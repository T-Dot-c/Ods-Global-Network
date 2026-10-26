/**
 * ODS Global Network — Unattached Document Sweeper Service
 *
 * Runs on startup and on a periodic schedule (default 15 minutes).
 * Guarded query: DELETE ... WHERE is_attached = FALSE AND expires_at <= NOW()
 * Sequence: Database row is deleted FIRST, then file is unlinked from disk.
 * Tolerates missing disk file (ENOENT) gracefully.
 */
'use strict';

const fs = require('fs');
const pool = require('../db');
const { logAuditEvent } = require('./auditService');

async function sweepExpiredDocuments() {
  const client = await pool.connect();
  try {
    const deleteRes = await client.query(`
      DELETE FROM documents
      WHERE is_attached = FALSE
        AND expires_at <= NOW()
      RETURNING id, storage_path
    `);

    for (const doc of deleteRes.rows) {
      if (doc.storage_path) {
        try {
          await fs.promises.unlink(doc.storage_path);
        } catch (err) {
          if (err.code !== 'ENOENT') {
            console.error(`[Sweeper] Failed to unlink ${doc.storage_path}:`, err.message);
          }
        }
      }
    }

    await logAuditEvent({
      userId: null,
      action: 'DOCUMENT_PURGED',
      details: {
        purged_count: deleteRes.rows.length,
        document_ids: deleteRes.rows.map(r => r.id),
      },
    });

    if (deleteRes.rows.length > 0) {
      console.log(`[Sweeper] Purged ${deleteRes.rows.length} expired unattached document(s).`);
    }
    return deleteRes.rows.length;
  } catch (err) {
    console.error('[Sweeper Error]', err.message);
    return 0;
  } finally {
    client.release();
  }
}

async function sweepExpiredBookingHolds() {
  try {
    const bookingService = require('./bookingService');
    const cleaned = await bookingService.cleanExpiredHolds();
    if (cleaned > 0) {
      console.log(`[Sweeper] Expired ${cleaned} lapsed booking hold(s).`);
    }
    return cleaned;
  } catch (err) {
    console.error('[Sweeper Booking Holds Error]', err.message);
    return 0;
  }
}

let sweeperInterval = null;
let bookingHoldInterval = null;

function startSweeper(intervalMs = 15 * 60 * 1000) {
  // Run sweep on startup
  sweepExpiredDocuments().catch(err => console.error('[Sweeper Startup Error]', err.message));
  sweepExpiredBookingHolds().catch(err => console.error('[Sweeper Hold Startup Error]', err.message));

  // Schedule recurring document sweep
  if (!sweeperInterval) {
    sweeperInterval = setInterval(() => {
      sweepExpiredDocuments().catch(err => console.error('[Sweeper Interval Error]', err.message));
    }, intervalMs);
    if (sweeperInterval.unref) {
      sweeperInterval.unref();
    }
  }

  // Schedule recurring booking hold expiration check (every 60 seconds)
  if (!bookingHoldInterval) {
    bookingHoldInterval = setInterval(() => {
      sweepExpiredBookingHolds().catch(err => console.error('[Sweeper Hold Interval Error]', err.message));
    }, 60 * 1000);
    if (bookingHoldInterval.unref) {
      bookingHoldInterval.unref();
    }
  }
}

function stopSweeper() {
  if (sweeperInterval) {
    clearInterval(sweeperInterval);
    sweeperInterval = null;
  }
  if (bookingHoldInterval) {
    clearInterval(bookingHoldInterval);
    bookingHoldInterval = null;
  }
}

module.exports = {
  sweepExpiredDocuments,
  runSweeper: sweepExpiredDocuments,
  sweepExpiredBookingHolds,
  startSweeper,
  stopSweeper,
};
