/**
 * ODS Global Network — User In-App Notifications & Preferences API
 *
 * Provides:
 * - GET /api/notifications (paginated list, filter by unread/read)
 * - GET /api/notifications/unread-count (lightweight badge count)
 * - POST /api/notifications/:id/read (mark single read)
 * - POST /api/notifications/read-all (mark all read)
 * - GET /api/notification-preferences (get user category opt-in configuration)
 * - PUT /api/notification-preferences (update category opt-in configuration)
 * - GET /api/notifications/unsubscribe?token= (one-click signed token unsubscribe)
 * - POST /api/notifications/unsubscribe (confirm signed token unsubscribe)
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { verifyUnsubscribeToken } = require('../services/notificationService');
const { NOTIFICATION_CATEGORIES } = require('../services/notificationCatalog');

const router = express.Router();

/**
 * GET /api/notifications/unread-count
 * Lightweight endpoint for header bell badge counter
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int as unread_count
      FROM notifications
      WHERE recipient_user_id = $1
        AND channel = 'in_app'
        AND read_at IS NULL
        AND status = 'sent';
    `, [req.user.id]);

    return res.json({
      success: true,
      unread_count: rows[0]?.unread_count || 0,
    });
  } catch (err) {
    console.error('[notifications/unread-count]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve unread count.' });
  }
});

/**
 * GET /api/notifications
 * In-app notifications feed (paginated, unread filter)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = 'false' } = req.query;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const conditions = ['recipient_user_id = $1', "channel = 'in_app'", "status = 'sent'"];
    const values = [req.user.id];

    if (unread_only === 'true') {
      conditions.push('read_at IS NULL');
    }

    const whereClause = conditions.join(' AND ');

    const countRes = await pool.query(`
      SELECT COUNT(*)::int as total
      FROM notifications
      WHERE ${whereClause};
    `, values);

    const listQuery = `
      SELECT id, category, template_key, title, rendered_body, action_url,
             read_at, created_at
      FROM notifications
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2};
    `;

    const { rows } = await pool.query(listQuery, [...values, safeLimit, offset]);

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page, 10),
        limit: safeLimit,
        total: countRes.rows[0]?.total || 0,
      },
    });
  } catch (err) {
    console.error('[notifications/list]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark an in-app notification as read
 */
router.post('/:id/read', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE notifications
      SET read_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND recipient_user_id = $2
      RETURNING id, read_at;
    `, [req.params.id, req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[notifications/:id/read]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

/**
 * POST /api/notifications/read-all
 * Mark all user in-app notifications as read
 */
router.post('/read-all', requireAuth, async (req, res) => {
  try {
    const { rowCount } = await pool.query(`
      UPDATE notifications
      SET read_at = NOW(), updated_at = NOW()
      WHERE recipient_user_id = $1 AND channel = 'in_app' AND read_at IS NULL;
    `, [req.user.id]);

    return res.json({ success: true, message: 'All notifications marked as read.', updated: rowCount });
  } catch (err) {
    console.error('[notifications/read-all]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
});

/**
 * GET /api/notifications/preferences
 * Returns user notification settings across categories
 */
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT category, channel, enabled, updated_at
      FROM notification_preferences
      WHERE user_id = $1;
    `, [req.user.id]);

    // Build complete mapping with defaults
    const configMap = {};
    for (const catKey of Object.values(NOTIFICATION_CATEGORIES)) {
      configMap[catKey] = {
        email: true,
        in_app: true,
      };
    }

    for (const r of rows) {
      if (configMap[r.category]) {
        configMap[r.category][r.channel] = r.enabled;
      }
    }

    return res.json({
      success: true,
      data: configMap,
    });
  } catch (err) {
    console.error('[notifications/preferences GET]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notification preferences.' });
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
router.put('/preferences', requireAuth, async (req, res) => {
  const { preferences } = req.body;
  if (!preferences || typeof preferences !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid preferences payload.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const [category, channels] of Object.entries(preferences)) {
      // Guard: essential categories cannot be disabled
      if (category === NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY) {
        continue;
      }

      if (typeof channels === 'object') {
        for (const [channel, enabled] of Object.entries(channels)) {
          await client.query(`
            INSERT INTO notification_preferences (user_id, category, channel, enabled, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (user_id, category, channel) DO UPDATE
            SET enabled = EXCLUDED.enabled, updated_at = NOW();
          `, [req.user.id, category, channel, Boolean(enabled)]);
        }
      }
    }

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Preferences updated successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[notifications/preferences PUT]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update preferences.' });
  } finally {
    client.release();
  }
});

/**
 * GET/POST /api/notifications/unsubscribe
 * Public signed one-click unsubscribe endpoint (no login required)
 */
router.all('/unsubscribe', async (req, res) => {
  const tokenStr = req.query.token || req.body?.token;
  if (!tokenStr) {
    return res.status(400).json({ success: false, message: 'Missing unsubscribe token.' });
  }

  const verified = verifyUnsubscribeToken(tokenStr);
  if (!verified) {
    return res.status(400).json({ success: false, message: 'Invalid or expired unsubscribe link.' });
  }

  const { userId, category } = verified;

  // Essential categories cannot be unsubscribed
  if (category === NOTIFICATION_CATEGORIES.ACCOUNT_SECURITY) {
    return res.status(400).json({
      success: false,
      message: 'Account security and transactional notices cannot be unsubscribed.',
    });
  }

  try {
    await pool.query(`
      INSERT INTO notification_preferences (user_id, category, channel, enabled, updated_at)
      VALUES ($1, $2, 'email', FALSE, NOW())
      ON CONFLICT (user_id, category, channel) DO UPDATE
      SET enabled = FALSE, updated_at = NOW();
    `, [userId, category]);

    return res.json({
      success: true,
      message: `You have successfully unsubscribed from ${category.replace('_', ' ')} email notifications.`,
      category,
    });
  } catch (err) {
    console.error('[notifications/unsubscribe]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to process unsubscription.' });
  }
});

module.exports = router;
