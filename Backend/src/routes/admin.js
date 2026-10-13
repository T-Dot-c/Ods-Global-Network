/**
 * ODS Global Network — Admin Routes (Phase 3)
 *
 * Endpoints:
 * - GET  /api/admin/kyc/queue               (admin, super_admin)
 * - POST /api/admin/kyc/:entityType/:id/decision  (admin, super_admin)
 * - GET  /api/admin/inbox/support           (admin, super_admin)
 * - GET  /api/admin/inbox/partners          (admin, super_admin)
 * - GET  /api/admin/audit-logs              (super_admin ONLY)
 *
 * Decision transaction order (OD-6):
 *   1. Pending check → 409 Conflict (if entity NOT pending)
 *   2. Document guard → 422 Unprocessable (if approving with 0 docs)
 *   3. Update entity + documents + write audit entry in same transaction
 *
 * 422 leaves entity in pending (rollback does NOT change status — the pending
 * check on step 1 used a locked row, and the rollback undoes all writes).
 *
 * Documents: served exclusively via /api/documents/:id/view — never direct paths.
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

const router = express.Router();

// All admin routes require authentication
router.use(requireAuth);

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/kyc/queue
   Returns all merchants and providers grouped by approval_status,
   with their attached documents (view links only — no direct paths).
   Access: admin, super_admin
   ───────────────────────────────────────────────────────────── */
router.get('/kyc/queue', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    // Query merchants
    const merchantRes = await pool.query(`
      SELECT
        m.id, 'merchant' AS entity_type,
        m.business_name AS display_name,
        m.category, m.approval_status, m.rejection_reason,
        m.reviewed_at,
        u.email AS user_email, u.full_name AS user_full_name,
        rev.email AS reviewer_email,
        m.created_at, m.updated_at
      FROM merchants m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN users rev ON rev.id = m.reviewed_by
      ORDER BY
        CASE m.approval_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
        m.updated_at DESC
    `);

    // Query providers
    const providerRes = await pool.query(`
      SELECT
        p.id, 'provider' AS entity_type,
        p.provider_name AS display_name,
        p.provider_type AS category, p.approval_status, p.rejection_reason,
        p.reviewed_at,
        u.email AS user_email, u.full_name AS user_full_name,
        rev.email AS reviewer_email,
        p.created_at, p.updated_at
      FROM providers p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN users rev ON rev.id = p.reviewed_by
      ORDER BY
        CASE p.approval_status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END,
        p.updated_at DESC
    `);

    // Fetch documents for each entity (return view URL, never storage_path)
    const enrichWithDocs = async (rows, entityType) => {
      const ids = rows.map(r => r.id);
      if (ids.length === 0) return rows;
      const docRes = await pool.query(
        `SELECT id, entity_id, document_type, purpose, file_name, mime_type,
                file_size, status, uploaded_at, rejection_reason
         FROM documents
         WHERE entity_type = $1 AND entity_id = ANY($2::uuid[])
           AND is_attached = TRUE
         ORDER BY uploaded_at DESC`,
        [entityType, ids]
      );
      const docsByEntity = {};
      for (const doc of docRes.rows) {
        const key = doc.entity_id;
        if (!docsByEntity[key]) docsByEntity[key] = [];
        // Expose view_url instead of storage_path
        docsByEntity[key].push({
          ...doc,
          view_url: `/api/documents/${doc.id}/view`,
          entity_id: undefined, // strip from response
        });
      }
      return rows.map(r => ({ ...r, documents: docsByEntity[r.id] || [] }));
    };

    const merchants = await enrichWithDocs(merchantRes.rows, 'merchant');
    const providers = await enrichWithDocs(providerRes.rows, 'provider');

    return res.json({
      success: true,
      queue: {
        merchants,
        providers,
        total_pending:
          merchants.filter(m => m.approval_status === 'pending').length +
          providers.filter(p => p.approval_status === 'pending').length,
      },
    });
  } catch (err) {
    console.error('[Admin KYC Queue Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve KYC queue.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/kyc/:entityType/:id/decision
   Applies an approval or rejection decision to a merchant or provider.
   Access: admin, super_admin

   Transaction order (OD-6):
     1. Lock row and check pending status → 409 if not pending
     2. If approving: check at least 1 attached non-rejected doc → 422 if none
     3. Update entity status + update attached documents + write audit entry
   ───────────────────────────────────────────────────────────── */
router.post('/kyc/:entityType/:id/decision', requireRole('admin', 'super_admin'), async (req, res) => {
  const { entityType, id: entityId } = req.params;
  const { decision, reason } = req.body;
  const adminUser = req.user;

  // Validate entity type
  if (!['merchant', 'provider'].includes(entityType)) {
    return res.status(400).json({ success: false, message: 'entityType must be "merchant" or "provider".' });
  }
  // Validate decision
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ success: false, message: 'decision must be "approved" or "rejected".' });
  }
  // Require reason when rejecting
  if (decision === 'rejected' && (!reason || !String(reason).trim())) {
    return res.status(400).json({ success: false, message: 'A non-empty reason is required when rejecting.' });
  }

  const table = entityType === 'merchant' ? 'merchants' : 'providers';
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── Step 1: Pending check (OD-6 §1) ──────────────────────────────────────
    // Lock the row so concurrent decisions cannot race.
    const pendingCheck = await client.query(
      `UPDATE ${table}
       SET approval_status = $1,
           rejection_reason = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4 AND approval_status = 'pending'
       RETURNING id, approval_status`,
      [decision, decision === 'rejected' ? String(reason).trim() : null, adminUser.id, entityId]
    );

    if (pendingCheck.rows.length === 0) {
      // Entity is not in pending status — 409 Conflict
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Entity is not in pending status. Only pending entities can receive a decision.',
      });
    }

    // ── Step 2: Document guard (OD-6 §2) — only for approvals ────────────────
    if (decision === 'approved') {
      const docCount = await client.query(
        `SELECT COUNT(*) AS c
         FROM documents
         WHERE entity_type = $1 AND entity_id = $2
           AND is_attached = TRUE AND status != 'rejected'`,
        [entityType, entityId]
      );
      if (parseInt(docCount.rows[0].c, 10) === 0) {
        // No valid documents — 422 Unprocessable. ROLLBACK leaves entity pending.
        await client.query('ROLLBACK');
        return res.status(422).json({
          success: false,
          message: 'Cannot approve entity without at least one uploaded KYC compliance document.',
        });
      }
    }

    // ── Step 3a: Update attached documents ────────────────────────────────────
    if (decision === 'approved') {
      await client.query(
        `UPDATE documents
         SET status = 'verified'
         WHERE entity_type = $1 AND entity_id = $2
           AND is_attached = TRUE AND status = 'pending'`,
        [entityType, entityId]
      );
    } else {
      await client.query(
        `UPDATE documents
         SET status = 'rejected', rejection_reason = $1
         WHERE entity_type = $2 AND entity_id = $3
           AND is_attached = TRUE AND status = 'pending'`,
        [String(reason).trim(), entityType, entityId]
      );
    }

    // ── Step 3b: Write audit entry in same transaction ────────────────────────
    const auditAction = decision === 'approved' ? 'KYC_APPROVAL' : 'KYC_REJECTION';
    await logAuditEvent(
      {
        userId: adminUser.id,
        action: auditAction,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          entity_type: entityType,
          entity_id: entityId,
          decision,
          reason: decision === 'rejected' ? String(reason).trim() : null,
        },
      },
      client // pass the transaction client so this is part of the same transaction
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Entity ${decision === 'approved' ? 'approved' : 'rejected'} successfully.`,
      entity_id: entityId,
      entity_type: entityType,
      decision,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Admin KYC Decision Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to process KYC decision.' });
  } finally {
    client.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/inbox/support
   Returns support request submissions.
   Access: admin, super_admin
   ───────────────────────────────────────────────────────────── */
router.get('/inbox/support', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const off = parseInt(offset, 10) || 0;
    params.push(lim, off);

    const result = await pool.query(
      `SELECT id, reference_id, name, email, phone, subject, message, status, created_at
       FROM support_requests
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM support_requests ${where}`,
      params.slice(0, params.length - 2)
    );

    return res.json({
      success: true,
      total: parseInt(countRes.rows[0].total, 10),
      requests: result.rows,
    });
  } catch (err) {
    console.error('[Admin Inbox Support Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve support requests.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/inbox/partners
   Returns partner inquiry submissions with document view links.
   Access: admin, super_admin
   ───────────────────────────────────────────────────────────── */
router.get('/inbox/partners', requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { partnership_type, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];
    if (partnership_type) {
      params.push(partnership_type);
      conditions.push(`p.partnership_type = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit, 10) || 50, 200);
    const off = parseInt(offset, 10) || 0;
    params.push(lim, off);

    const result = await pool.query(
      `SELECT
         p.id, p.partnership_type, p.name, p.company_name, p.email, p.phone,
         p.whatsapp, p.sector, p.investment_type, p.enquiry,
         p.document_id,
         p.created_at,
         -- Return view URL, never storage_path
         CASE WHEN p.document_id IS NOT NULL
              THEN '/api/documents/' || p.document_id::text || '/view'
              ELSE NULL
         END AS document_view_url,
         d.file_name AS document_name, d.mime_type AS document_mime
       FROM partners p
       LEFT JOIN documents d ON d.id = p.document_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM partners p ${where}`,
      params.slice(0, params.length - 2)
    );

    return res.json({
      success: true,
      total: parseInt(countRes.rows[0].total, 10),
      partners: result.rows,
    });
  } catch (err) {
    console.error('[Admin Inbox Partners Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve partner inquiries.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/audit-logs
   Searchable, paginated audit log stream.
   Access: super_admin ONLY (OD-4)
   ───────────────────────────────────────────────────────────── */
router.get('/audit-logs', requireRole('super_admin'), async (req, res) => {
  try {
    const { action, user_id, limit = 50, offset = 0 } = req.query;

    const conditions = [];
    const params = [];

    if (action) {
      params.push(action.toUpperCase());
      conditions.push(`al.action = $${params.length}`);
    }
    if (user_id) {
      params.push(user_id);
      conditions.push(`al.user_id = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const lim = Math.min(parseInt(limit, 10) || 50, 500);
    const off = parseInt(offset, 10) || 0;
    params.push(lim, off);

    const result = await pool.query(
      `SELECT
         al.id, al.user_id, al.action, al.ip_address, al.user_agent,
         al.details, al.created_at,
         u.email AS user_email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) AS total FROM audit_logs al ${where}`,
      params.slice(0, params.length - 2)
    );

    return res.json({
      success: true,
      total: parseInt(countRes.rows[0].total, 10),
      logs: result.rows,
    });
  } catch (err) {
    console.error('[Admin Audit Logs Error]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve audit logs.' });
  }
});

module.exports = router;
