/**
 * ODS Global Network — Admin Notification Engine Console API
 *
 * Provides permission-gated administrative inspection and operational controls:
 * - GET /api/admin/notifications (delivery ledger with filters)
 * - GET /api/admin/notifications/:id (detailed attempt history)
 * - GET /api/admin/notifications/dead (dead-letter queue)
 * - POST /api/admin/notifications/:id/requeue (re-queue dead letter job)
 * - POST /api/admin/notifications/:id/discard (discard dead letter job)
 * - GET /api/admin/notification-templates (template catalog with version history)
 * - PUT /api/admin/notification-templates/:key (create new immutable template version)
 * - POST /api/admin/notification-templates/:key/preview (preview rendered template)
 * - POST /api/admin/notification-templates/:key/test-send (send test email to admin)
 * - GET /api/admin/notification-health (queue health, failure rate, and pending depth metrics)
 * - GET/POST/DELETE /api/admin/suppressions (manage suppression list)
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');
const { renderNotification } = require('../services/notificationTemplateService');
const { dispatchMail } = require('../services/emailService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/admin/notifications
 * Delivery ledger with status, channel, date, and search filters
 */
router.get('/', requirePermission('notifications.view'), async (req, res) => {
  try {
    const {
      status,
      channel,
      category,
      recipient,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status && status.trim()) {
      conditions.push(`n.status = $${idx++}`);
      values.push(status.trim());
    }
    if (channel && channel.trim()) {
      conditions.push(`n.channel = $${idx++}`);
      values.push(channel.trim());
    }
    if (category && category.trim()) {
      conditions.push(`n.category = $${idx++}`);
      values.push(category.trim());
    }
    if (recipient && recipient.trim()) {
      conditions.push(`n.recipient_address ILIKE $${idx++}`);
      values.push(`%${recipient.trim()}%`);
    }
    if (date_from) {
      conditions.push(`n.created_at >= $${idx++}`);
      values.push(new Date(date_from));
    }
    if (date_to) {
      conditions.push(`n.created_at <= $${idx++}`);
      values.push(new Date(date_to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * safeLimit;

    const countRes = await pool.query(`SELECT COUNT(*)::int as total FROM notifications n ${whereClause}`, values);

    const query = `
      SELECT n.id, n.event_id, n.recipient_user_id, n.recipient_address, n.channel,
             n.category, n.template_key, n.template_version, n.status, n.attempts,
             n.max_attempts, n.run_at, n.sent_at, n.last_error, n.provider_message_id,
             n.title, n.created_at, ne.event_type
      FROM notifications n
      LEFT JOIN notification_events ne ON ne.id = n.event_id
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const { rows } = await pool.query(query, [...values, safeLimit, offset]);

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
    console.error('[adminNotifications/list]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notifications ledger.' });
  }
});

/**
 * GET /api/admin/notifications/health
 * Real-time queue health tiles
 */
router.get('/health', requirePermission('notifications.view'), async (_req, res) => {
  try {
    const statsQuery = `
      SELECT
        COUNT(*) FILTER (WHERE status = 'pending')::int as pending_count,
        COUNT(*) FILTER (WHERE status = 'retrying')::int as retrying_count,
        COUNT(*) FILTER (WHERE status = 'dead')::int as dead_count,
        COUNT(*) FILTER (WHERE status = 'sent' AND created_at >= NOW() - INTERVAL '24 hours')::int as sent_24h_count,
        COUNT(*) FILTER (WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '24 hours')::int as failed_24h_count,
        MIN(run_at) FILTER (WHERE status IN ('pending', 'retrying')) as oldest_pending_run_at
      FROM notifications;
    `;

    const { rows } = await pool.query(statsQuery);
    const health = rows[0] || {};

    return res.json({
      success: true,
      data: {
        pendingCount: health.pending_count || 0,
        retryingCount: health.retrying_count || 0,
        deadCount: health.dead_count || 0,
        sentLast24h: health.sent_24h_count || 0,
        failedLast24h: health.failed_24h_count || 0,
        oldestPendingRunAt: health.oldest_pending_run_at || null,
      },
    });
  } catch (err) {
    console.error('[adminNotifications/health]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notification health.' });
  }
});

/**
 * GET /api/admin/notifications/:id
 * Detailed attempt history and rendered content
 */
router.get('/:id', requirePermission('notifications.view'), async (req, res) => {
  try {
    const notifRes = await pool.query(`
      SELECT n.*, ne.event_type, ne.payload as event_payload
      FROM notifications n
      LEFT JOIN notification_events ne ON ne.id = n.event_id
      WHERE n.id = $1;
    `, [req.params.id]);

    if (notifRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    const attemptsRes = await pool.query(`
      SELECT id, attempt_no, status, error, provider_response_summary, created_at
      FROM notification_attempts
      WHERE notification_id = $1
      ORDER BY attempt_no ASC;
    `, [req.params.id]);

    return res.json({
      success: true,
      data: {
        notification: notifRes.rows[0],
        attempts: attemptsRes.rows,
      },
    });
  } catch (err) {
    console.error('[adminNotifications/:id]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve notification details.' });
  }
});

/**
 * POST /api/admin/notifications/:id/requeue
 * Resets a dead job back to pending status for retry
 */
router.post('/:id/requeue', requirePermission('notifications.manage'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE notifications
      SET status = 'pending',
          attempts = 0,
          next_attempt_at = NOW(),
          last_error = NULL,
          updated_at = NOW()
      WHERE id = $1 AND status = 'dead'
      RETURNING id, recipient_address, template_key;
    `, [req.params.id]);

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Dead notification not found or not in dead status.' });
    }

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'notifications.manage',
      action: 'NOTIFICATION_REQUEUE',
      targetType: 'notification',
      targetId: req.params.id,
      summary: { recipient: updateRes.rows[0].recipient_address },
      reason: req.body.reason || 'Administrative dead letter requeue',
      req,
    });

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Notification requeued successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[adminNotifications/requeue]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to requeue notification.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/notifications/:id/discard
 * Discards a dead job permanently
 */
router.post('/:id/discard', requirePermission('notifications.manage'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updateRes = await client.query(`
      UPDATE notifications
      SET status = 'discarded',
          last_error = 'Discarded by administrative action',
          updated_at = NOW()
      WHERE id = $1 AND status = 'dead'
      RETURNING id, recipient_address;
    `, [req.params.id]);

    if (updateRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Dead notification not found.' });
    }

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'notifications.manage',
      action: 'NOTIFICATION_DISCARD',
      targetType: 'notification',
      targetId: req.params.id,
      summary: { recipient: updateRes.rows[0].recipient_address },
      reason: req.body.reason || 'Administrative dead letter discard',
      req,
    });

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Notification discarded.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[adminNotifications/discard]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to discard notification.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/notification-templates
 * Lists templates with latest active version
 */
router.get('/templates/catalog', requirePermission('notifications.templates.manage'), async (_req, res) => {
  try {
    const query = `
      SELECT t.key, t.channel, t.category, t.is_essential, t.description,
             v.version, v.subject, v.locale, v.body_html, v.body_text, v.updated_at
      FROM notification_templates t
      LEFT JOIN LATERAL (
        SELECT version, subject, locale, body_html, body_text, created_at as updated_at
        FROM notification_template_versions
        WHERE template_key = t.key AND is_active = TRUE
        ORDER BY version DESC LIMIT 1
      ) v ON TRUE
      ORDER BY t.category, t.key;
    `;
    const { rows } = await pool.query(query);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[adminTemplates/list]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to list notification templates.' });
  }
});

/**
 * PUT /api/admin/notification-templates/:key
 * Publishes a new immutable template version
 */
router.put('/templates/:key', requirePermission('notifications.templates.manage'), async (req, res) => {
  const { subject, body_html, body_text, locale = 'en' } = req.body;
  const templateKey = req.params.key;

  if (!subject || !body_html || !body_text) {
    return res.status(400).json({ success: false, message: 'Subject, body_html, and body_text are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current max version
    const maxVerRes = await client.query(`
      SELECT COALESCE(MAX(version), 0) + 1 as next_ver
      FROM notification_template_versions
      WHERE template_key = $1;
    `, [templateKey]);

    const nextVer = maxVerRes.rows[0].next_ver;

    // Deactivate previous active version for this locale
    await client.query(`
      UPDATE notification_template_versions
      SET is_active = FALSE
      WHERE template_key = $1 AND locale = $2;
    `, [templateKey, locale]);

    // Insert new version
    const insertRes = await client.query(`
      INSERT INTO notification_template_versions (
        template_key, version, locale, subject, body_html, body_text, created_by, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      RETURNING id, template_key, version, locale, subject;
    `, [templateKey, nextVer, locale, subject, body_html, body_text, req.user.id]);

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'notifications.templates.manage',
      action: 'TEMPLATE_VERSION_CREATE',
      targetType: 'notification_template',
      targetId: templateKey,
      summary: { new_version: nextVer, locale },
      reason: req.body.reason || 'Template update',
      req,
    });

    await client.query('COMMIT');
    return res.json({ success: true, message: 'Template version created successfully.', data: insertRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[adminTemplates/update]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update template version.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/notification-templates/:key/preview
 * Previews rendered template output with provided or sample variables
 */
router.post('/templates/:key/preview', requirePermission('notifications.templates.manage'), async (req, res) => {
  try {
    const { sampleData = {}, locale = 'en' } = req.body;
    const rendered = await renderNotification(req.params.key, sampleData, locale);
    return res.json({ success: true, data: rendered });
  } catch (err) {
    console.error('[adminTemplates/preview]', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/notification-templates/:key/test-send
 * Dispatches test email of a template to the calling admin
 */
router.post('/templates/:key/test-send', requirePermission('notifications.templates.manage'), async (req, res) => {
  try {
    const adminEmail = req.user.email;
    const { sampleData = {} } = req.body;
    const rendered = await renderNotification(req.params.key, {
      ...sampleData,
      recipientName: req.user.full_name || 'Admin',
      firstName: (req.user.full_name || '').split(' ')[0] || 'Admin',
    });

    const result = await dispatchMail({
      to: adminEmail,
      subject: `[TEST] ${rendered.subject}`,
      html: rendered.html,
      text: rendered.text,
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: `Failed to deliver test email: ${result.error}` });
    }

    return res.json({
      success: true,
      message: `Test email dispatched to ${adminEmail}`,
      messageId: result.messageId,
    });
  } catch (err) {
    console.error('[adminTemplates/test-send]', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/admin/notifications/suppressions
 * List suppressed addresses
 */
router.get('/suppressions/list', requirePermission('notifications.suppressions.manage'), async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT address, reason, source, created_at
      FROM notification_suppressions
      ORDER BY created_at DESC;
    `);
    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[adminSuppressions/list]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve suppressions.' });
  }
});

/**
 * POST /api/admin/notifications/suppressions
 * Manually add an address to suppression list
 */
router.post('/suppressions', requirePermission('notifications.suppressions.manage'), async (req, res) => {
  const { address, reason = 'Manual administrative suppression' } = req.body;
  if (!address || !String(address).includes('@')) {
    return res.status(400).json({ success: false, message: 'Valid email address required.' });
  }

  try {
    await pool.query(`
      INSERT INTO notification_suppressions (address, reason, source, created_at)
      VALUES (LOWER($1), $2, 'admin_manual', NOW())
      ON CONFLICT (address) DO UPDATE
      SET reason = EXCLUDED.reason;
    `, [address.trim(), reason]);

    return res.json({ success: true, message: `Address ${address} added to suppression list.` });
  } catch (err) {
    console.error('[adminSuppressions/add]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to add address to suppression.' });
  }
});

/**
 * DELETE /api/admin/notifications/suppressions/:address
 * Remove address from suppression list
 */
router.delete('/suppressions/:address', requirePermission('notifications.suppressions.manage'), async (req, res) => {
  try {
    await pool.query(`
      DELETE FROM notification_suppressions WHERE LOWER(address) = LOWER($1);
    `, [req.params.address]);

    return res.json({ success: true, message: `Address ${req.params.address} removed from suppression list.` });
  } catch (err) {
    console.error('[adminSuppressions/delete]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to remove address from suppression.' });
  }
});

module.exports = router;
