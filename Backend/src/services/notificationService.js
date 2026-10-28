/**
 * ODS Global Network — Unified Notification Service
 *
 * Core intake service. Dispatches domain notifications transactionally.
 * Writes to notification_events and fans out to notifications queue within
 * the caller's DB transaction (or pool runner).
 */
'use strict';

const crypto = require('crypto');
const pool = require('../db');
const { EVENT_CATALOG, CHANNELS } = require('./notificationCatalog');
const { renderNotification } = require('./notificationTemplateService');

/**
 * Generates an HMAC-signed one-click unsubscribe token
 */
function generateUnsubscribeToken(userId, category) {
  const secret = process.env.JWT_SECRET || 'ods_default_notification_secret';
  const payload = `${userId}:${category}:${Date.now()}`;
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return Buffer.from(`${payload}:${hmac}`).toString('base64url');
}

/**
 * Verifies an unsubscribe token
 */
function verifyUnsubscribeToken(tokenStr) {
  try {
    const raw = Buffer.from(tokenStr, 'base64url').toString('utf8');
    const parts = raw.split(':');
    if (parts.length !== 4) return null;
    const [userId, category, timestamp, hmac] = parts;

    const secret = process.env.JWT_SECRET || 'ods_default_notification_secret';
    const payload = `${userId}:${category}:${timestamp}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) {
      return { userId, category, timestamp: Number(timestamp) };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks whether recipient has unsubscribed or opted out of this category/channel
 */
async function isRecipientOptedOut(userId, category, channel, client = null) {
  if (!userId) return false;
  const runner = client || pool;
  const res = await runner.query(`
    SELECT enabled FROM notification_preferences
    WHERE user_id = $1 AND category = $2 AND channel = $3;
  `, [userId, category, channel]);

  if (res.rows.length > 0) {
    return res.rows[0].enabled === false;
  }
  // Default is enabled
  return false;
}

/**
 * Checks whether recipient email is on suppression list (bounces/spam)
 */
async function isAddressSuppressed(email, client = null) {
  if (!email) return false;
  const runner = client || pool;
  const res = await runner.query(`
    SELECT 1 FROM notification_suppressions WHERE LOWER(address) = LOWER($1);
  `, [email]);
  return res.rows.length > 0;
}

/**
 * Resolves recipients for a domain event
 * Returns array of: { userId, email, name, role }
 */
async function resolveRecipients(eventType, subjectType, subjectId, payload, client = null) {
  const runner = client || pool;
  const recipients = [];

  // 1. Direct explicit recipient in payload
  if (payload.recipientEmail) {
    recipients.push({
      userId: payload.recipientUserId || null,
      email: payload.recipientEmail,
      name: payload.recipientName || 'Valued User',
    });
    return recipients;
  }

  // 2. Direct user target
  if (subjectType === 'user' && subjectId) {
    const { rows } = await runner.query(`
      SELECT id, email, full_name FROM users WHERE id = $1;
    `, [subjectId]);
    if (rows.length > 0) {
      recipients.push({
        userId: rows[0].id,
        email: rows[0].email,
        name: rows[0].full_name || 'Valued Member',
      });
    }
    return recipients;
  }

  // 3. Booking events -> resolve customer and provider
  if (subjectType === 'booking' && subjectId) {
    const { rows } = await runner.query(`
      SELECT b.id, b.reference, b.customer_user_id, b.provider_user_id,
             u_c.email as customer_email, u_c.full_name as customer_name,
             p.provider_name, u_p.email as provider_email
      FROM bookings b
      LEFT JOIN users u_c ON u_c.id = b.customer_user_id
      LEFT JOIN providers p ON p.user_id = b.provider_user_id
      LEFT JOIN users u_p ON u_p.id = p.user_id
      WHERE b.id = $1;
    `, [subjectId]);

    if (rows.length > 0) {
      const b = rows[0];
      if (payload.targetRole === 'provider') {
        recipients.push({
          userId: b.provider_user_id,
          email: b.provider_email,
          name: b.provider_name || 'Healthcare Provider',
        });
      } else if (payload.targetRole === 'customer') {
        recipients.push({
          userId: b.customer_user_id,
          email: b.customer_email,
          name: b.customer_name || 'Valued Customer',
        });
      } else {
        // Both
        if (b.customer_email) {
          recipients.push({
            userId: b.customer_user_id,
            email: b.customer_email,
            name: b.customer_name || 'Valued Customer',
          });
        }
        if (b.provider_email) {
          recipients.push({
            userId: b.provider_user_id,
            email: b.provider_email,
            name: b.provider_name || 'Healthcare Provider',
          });
        }
      }
    }
    return recipients;
  }

  // 4. Gift events
  if (subjectType === 'gift' && subjectId) {
    const { rows } = await runner.query(`
      SELECT id, sender_name, sender_email, recipient_name, recipient_email, user_id
      FROM gift_cards WHERE id = $1;
    `, [subjectId]);

    if (rows.length > 0) {
      const g = rows[0];
      if (payload.targetRole === 'recipient') {
        recipients.push({
          userId: null,
          email: g.recipient_email,
          name: g.recipient_name,
        });
      } else {
        recipients.push({
          userId: g.user_id || null,
          email: g.sender_email,
          name: g.sender_name,
        });
      }
    }
    return recipients;
  }

  // 5. Admin group recipients (e.g. compliance, finance)
  if (payload.adminPermission) {
    const { rows } = await runner.query(`
      SELECT DISTINCT u.id, u.email, u.full_name
      FROM users u
      JOIN admin_user_groups aug ON aug.user_id = u.id
      JOIN admin_group_permissions agp ON agp.group_id = aug.group_id
      JOIN admin_permissions ap ON ap.id = agp.permission_id
      WHERE ap.key = $1 AND u.role IN ('admin', 'super_admin');
    `, [payload.adminPermission]);

    for (const r of rows) {
      recipients.push({
        userId: r.id,
        email: r.email,
        name: r.full_name || 'Admin Team',
      });
    }
  }

  return recipients;
}

/**
 * Core transactional intake function: notify(eventType, payload, options, client)
 *
 * @param {string} eventType e.g. 'booking.confirmed'
 * @param {object} payload Domain identifiers and rendering data
 * @param {object} options { subjectType, subjectId, actorUserId, runAt, idempotencyKey }
 * @param {object} client Optional pg client for caller's ongoing database transaction
 */
async function notify(eventType, payload = {}, options = {}, client = null) {
  const runner = client || pool;
  const eventDef = EVENT_CATALOG[eventType];

  if (!eventDef) {
    console.warn(`[NotificationEngine] Warning: Unrecognized eventType="${eventType}". Skipping dispatch.`);
    return { success: false, reason: 'UNKNOWN_EVENT_TYPE' };
  }

  const subjectType = options.subjectType || 'system';
  const subjectId = String(options.subjectId || '0');
  const actorUserId = options.actorUserId || null;
  const runAt = options.runAt ? new Date(options.runAt) : new Date();

  // Create deterministic event idempotency key if not supplied
  const eventIdempotencyKey = options.idempotencyKey ||
    (options.subjectId
      ? crypto.createHash('sha256')
          .update(`${eventType}:${subjectType}:${subjectId}:${JSON.stringify(payload)}:${options.runAt || 'now'}`)
          .digest('hex')
      : crypto.createHash('sha256')
          .update(`${eventType}:${subjectType}:${Date.now()}:${crypto.randomBytes(8).toString('hex')}:${JSON.stringify(payload)}`)
          .digest('hex'));

  // 1. Write to notification_events ledger inside transaction
  let eventRecordId;
  try {
    const insertEventQuery = `
      INSERT INTO notification_events (
        event_type, subject_type, subject_id, actor_user_id, payload, idempotency_key
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (idempotency_key) DO NOTHING
      RETURNING id;
    `;

    const eventRes = await runner.query(insertEventQuery, [
      eventType,
      subjectType,
      subjectId,
      actorUserId,
      JSON.stringify(payload),
      eventIdempotencyKey,
    ]);

    if (eventRes.rows.length > 0) {
      eventRecordId = eventRes.rows[0].id;
    } else {
      const existing = await runner.query(
        'SELECT id FROM notification_events WHERE idempotency_key = $1',
        [eventIdempotencyKey]
      );
      eventRecordId = existing.rows[0]?.id;
    }
  } catch (err) {
    console.error(`[NotificationEngine] Failed to record event "${eventType}":`, err.message);
    throw err;
  }

  // 2. Resolve target recipients
  const recipients = await resolveRecipients(eventType, subjectType, subjectId, payload, runner);
  if (recipients.length === 0) {
    return { success: true, eventId: eventRecordId, queuedCount: 0, note: 'No recipients resolved' };
  }

  let queuedCount = 0;

  // 3. Fan out to channel queues (email, in_app)
  for (const recipient of recipients) {
    for (const channel of eventDef.channels) {
      const notifIdempotency = crypto.createHash('sha256')
        .update(`${eventRecordId}:${recipient.email || recipient.userId}:${channel}`)
        .digest('hex');

      // Check user preferences if category is optional
      if (!eventDef.isEssential && recipient.userId) {
        const isOptedOut = await isRecipientOptedOut(recipient.userId, eventDef.category, channel, runner);
        if (isOptedOut) {
          // Record as skipped
          await runner.query(`
            INSERT INTO notifications (
              event_id, recipient_user_id, recipient_address, channel, category,
              template_key, status, last_error, idempotency_key
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'skipped', 'Suppressed by user preference', $7)
            ON CONFLICT (idempotency_key) DO NOTHING;
          `, [eventRecordId, recipient.userId, recipient.email || '', channel, eventDef.category, eventDef.templateKey, notifIdempotency]);
          continue;
        }
      }

      // Check suppression list for email
      if (channel === CHANNELS.EMAIL && recipient.email) {
        const isSuppressed = await isAddressSuppressed(recipient.email, runner);
        if (isSuppressed) {
          await runner.query(`
            INSERT INTO notifications (
              event_id, recipient_user_id, recipient_address, channel, category,
              template_key, status, last_error, idempotency_key
            )
            VALUES ($1, $2, $3, $4, $5, $6, 'skipped', 'Address on suppression list', $7)
            ON CONFLICT (idempotency_key) DO NOTHING;
          `, [eventRecordId, recipient.userId, recipient.email, channel, eventDef.category, eventDef.templateKey, notifIdempotency]);
          continue;
        }
      }

      // Merge recipient information into render data
      const renderData = {
        ...payload,
        recipientName: recipient.name,
        firstName: (recipient.name || '').split(' ')[0] || 'Member',
      };

      // Generate unsubscribe URL if not essential and has a user id
      const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
      let unsubscribeUrl = null;
      if (!eventDef.isEssential && recipient.userId) {
        const token = generateUnsubscribeToken(recipient.userId, eventDef.category);
        unsubscribeUrl = `${origin}/unsubscribe?token=${token}`;
      }

      // Render content
      let rendered;
      try {
        rendered = await renderNotification(eventDef.templateKey, renderData, payload.locale || 'en', {
          unsubscribeUrl,
          actionButton: payload.actionButton,
        });
      } catch (renderErr) {
        console.error(`[NotificationEngine] Render error for template "${eventDef.templateKey}":`, renderErr.message);
        // Fallback title/body so queue does not break
        rendered = {
          templateVersion: 1,
          subject: eventDef.description,
          html: `<p>${eventDef.description}</p>`,
          text: eventDef.description,
        };
      }

      const insertNotifQuery = `
        INSERT INTO notifications (
          event_id, recipient_user_id, recipient_address, channel, category,
          template_key, template_version, locale, status, run_at, title,
          rendered_body, action_url, idempotency_key
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id;
      `;

      const notifRes = await runner.query(insertNotifQuery, [
        eventRecordId,
        recipient.userId,
        recipient.email || '',
        channel,
        eventDef.category,
        eventDef.templateKey,
        rendered.templateVersion || 1,
        payload.locale || 'en',
        runAt,
        rendered.subject,
        channel === CHANNELS.EMAIL ? rendered.html : rendered.text,
        payload.actionUrl || null,
        notifIdempotency,
      ]);

      if (notifRes.rowCount > 0) {
        queuedCount++;
      }
    }
  }

  return {
    success: true,
    eventId: eventRecordId,
    queuedCount,
  };
}

module.exports = {
  notify,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  isRecipientOptedOut,
  isAddressSuppressed,
  resolveRecipients,
};
