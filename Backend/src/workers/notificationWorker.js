/**
 * ODS Global Network — Notification Queue Worker
 *
 * Polls the notifications table using PostgreSQL `SELECT ... FOR UPDATE SKIP LOCKED`.
 * Dispatches messages via appropriate channel (Email via dispatchMail, In-App mark sent).
 * Applies exponential backoff on retries and moves exhausted attempts to dead_letter.
 */
'use strict';

const pool = require('../db');
const { dispatchMail } = require('../services/emailService');
const { CHANNELS } = require('../services/notificationCatalog');

const RETRY_BACKOFF_SECONDS = [60, 300, 1800, 7200]; // 1m, 5m, 30m, 2h
const BATCH_SIZE = 10;
const POLL_INTERVAL_MS = 3000;

let isRunning = false;
let pollTimer = null;

/**
 * Claims a batch of ready notifications safely using SKIP LOCKED
 */
async function claimBatch(client, limit = BATCH_SIZE) {
  const query = `
    SELECT id, event_id, recipient_user_id, recipient_address, channel,
           category, template_key, template_version, attempts, max_attempts,
           title, rendered_body, action_url
    FROM notifications
    WHERE status IN ('pending', 'retrying')
      AND run_at <= NOW()
      AND next_attempt_at <= NOW()
    ORDER BY run_at ASC, next_attempt_at ASC
    LIMIT $1
    FOR UPDATE SKIP LOCKED;
  `;

  const { rows } = await client.query(query, [limit]);
  return rows;
}

/**
 * Dispatches a single claimed notification record
 */
async function processNotification(client, notif) {
  const attemptNo = notif.attempts + 1;
  let dispatchResult = { success: false, error: 'UNKNOWN_CHANNEL' };

  if (notif.channel === CHANNELS.EMAIL) {
    if (!notif.recipient_address) {
      dispatchResult = { success: false, error: 'MISSING_RECIPIENT_ADDRESS' };
    } else {
      dispatchResult = await dispatchMail({
        to: notif.recipient_address,
        subject: notif.title || 'ODS Global Network Notice',
        html: notif.rendered_body,
        text: notif.title || 'ODS Global Network Notice',
      });
    }
  } else if (notif.channel === CHANNELS.IN_APP) {
    // In-app notifications are stored directly in notifications table and visible to user
    dispatchResult = { success: true, messageId: `inapp_${notif.id}` };
  }

  // 1. Record attempt in notification_attempts audit ledger
  await client.query(`
    INSERT INTO notification_attempts (
      notification_id, attempt_no, status, error, provider_response_summary
    )
    VALUES ($1, $2, $3, $4, $5);
  `, [
    notif.id,
    attemptNo,
    dispatchResult.success ? 'sent' : 'failed',
    dispatchResult.error || null,
    JSON.stringify({ messageId: dispatchResult.messageId || null }),
  ]);

  // 2. Update notifications state
  if (dispatchResult.success) {
    await client.query(`
      UPDATE notifications
      SET status = 'sent',
          attempts = $1,
          sent_at = NOW(),
          provider_message_id = $2,
          last_error = NULL,
          updated_at = NOW()
      WHERE id = $3;
    `, [attemptNo, dispatchResult.messageId, notif.id]);
  } else {
    // Determine retry or dead-letter
    if (attemptNo >= notif.max_attempts) {
      await client.query(`
        UPDATE notifications
        SET status = 'dead',
            attempts = $1,
            last_error = $2,
            updated_at = NOW()
        WHERE id = $3;
      `, [attemptNo, dispatchResult.error, notif.id]);
      console.warn(`[NotificationWorker] Job ${notif.id} exhausted max retries (${notif.max_attempts}). Moved to dead_letter.`);
    } else {
      const backoffSec = RETRY_BACKOFF_SECONDS[attemptNo - 1] || 7200;
      await client.query(`
        UPDATE notifications
        SET status = 'retrying',
            attempts = $1,
            next_attempt_at = NOW() + ($2 || ' seconds')::INTERVAL,
            last_error = $3,
            updated_at = NOW()
      WHERE id = $4;
      `, [attemptNo, `${backoffSec}`, dispatchResult.error, notif.id]);
    }
  }
}

/**
 * Runs a single polling cycle across active jobs
 */
async function processQueueOnce() {
  const client = await pool.connect();
  let processedCount = 0;

  try {
    await client.query('BEGIN');
    const jobs = await claimBatch(client, BATCH_SIZE);

    if (jobs.length > 0) {
      for (const job of jobs) {
        await processNotification(client, job);
        processedCount++;
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[NotificationWorker] Queue processing error:', err.message);
  } finally {
    client.release();
  }

  return processedCount;
}

/**
 * Starts the continuous worker loop
 */
function startWorker(intervalMs = POLL_INTERVAL_MS) {
  if (isRunning) return;
  isRunning = true;
  console.log(`[NotificationWorker] Started (polling every ${intervalMs}ms)...`);

  const loop = async () => {
    if (!isRunning) return;
    try {
      await processQueueOnce();
    } catch (e) {
      console.error('[NotificationWorker] Loop uncaught error:', e.message);
    }
    if (isRunning) {
      pollTimer = setTimeout(loop, intervalMs);
    }
  };

  loop();
}

/**
 * Stops the continuous worker loop
 */
function stopWorker() {
  isRunning = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  console.log('[NotificationWorker] Stopped.');
}

if (require.main === module) {
  startWorker();
  process.on('SIGINT', () => {
    stopWorker();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    stopWorker();
    process.exit(0);
  });
}

module.exports = {
  startWorker,
  stopWorker,
  processQueueOnce,
  processNotification,
  claimBatch,
};
