/**
 * ODS Global Network — Admin Finance, Reconciliation & Refund Approvals API (Batch 10)
 *
 * Provides financial oversight, discrepancy reconciliation, provider earnings tracking,
 * and a two-person authorization workflow for large refunds (> 10,000 ETB).
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');
const { notify } = require('../services/notificationService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/admin/transactions
 * Retrieve financial transaction records with filters and pagination.
 * Permission: payments.view_ledger
 */
router.get('/transactions', requirePermission('payments.view_ledger'), async (req, res) => {
  try {
    const {
      status,
      purpose,
      search,
      min_amount,
      max_amount,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status && status.trim()) {
      conditions.push(`t.status = $${idx++}`);
      values.push(status.trim());
    }

    if (purpose && purpose.trim()) {
      conditions.push(`t.purpose = $${idx++}`);
      values.push(purpose.trim());
    }

    if (search && search.trim()) {
      conditions.push(`(t.tx_ref ILIKE $${idx} OR t.chapa_reference ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (min_amount) {
      conditions.push(`t.amount >= $${idx++}`);
      values.push(parseFloat(min_amount));
    }
    if (max_amount) {
      conditions.push(`t.amount <= $${idx++}`);
      values.push(parseFloat(max_amount));
    }

    if (date_from) {
      conditions.push(`t.created_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`t.created_at <= $${idx++}`);
      values.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `
      SELECT COUNT(*) AS total 
      FROM transactions t 
      LEFT JOIN users u ON u.id = t.user_id 
      ${whereClause};
    `;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const query = `
      SELECT 
        t.id,
        t.tx_ref,
        t.chapa_reference,
        t.amount,
        t.currency,
        t.status,
        t.purpose,
        t.payment_method,
        t.created_at,
        t.updated_at,
        u.id AS user_id,
        u.email AS user_email,
        u.full_name AS user_full_name
      FROM transactions t
      LEFT JOIN users u ON u.id = t.user_id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    values.push(limitNum, offset);
    const result = await pool.query(query, values);

    return res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[adminFinance] Error listing transactions:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve transactions.' });
  }
});

/**
 * GET /api/admin/reconciliation
 * Flag mismatches between payments and booking/gift states.
 * Permission: payments.view_ledger
 */
router.get('/reconciliation', requirePermission('payments.view_ledger'), async (_req, res) => {
  try {
    // 1. Paid transactions whose linked booking is NOT confirmed or completed
    const unconfirmedPaidQuery = `
      SELECT 
        t.id AS transaction_id, t.tx_ref, t.amount, t.currency, t.status AS transaction_status,
        b.id AS booking_id, b.reference AS booking_reference, b.status AS booking_status,
        u.email AS customer_email
      FROM transactions t
      JOIN bookings b ON b.payment_transaction_id = t.id
      JOIN users u ON u.id = t.user_id
      WHERE t.status = 'completed' AND b.status NOT IN ('confirmed', 'in_progress', 'completed')
      LIMIT 50;
    `;
    const unconfirmedPaidRes = await pool.query(unconfirmedPaidQuery);

    // 2. Late-payment conflict bookings requiring manual resolution
    const conflictsQuery = `
      SELECT 
        b.id, b.reference, b.price_amount, b.currency, b.status, b.start_at,
        u.email AS customer_email,
        p.provider_name
      FROM bookings b
      JOIN users u ON u.id = b.customer_user_id
      LEFT JOIN providers p ON p.user_id = b.provider_user_id
      WHERE b.status = 'payment_conflict'
      ORDER BY b.created_at DESC
      LIMIT 50;
    `;
    const conflictsRes = await pool.query(conflictsQuery);

    // 3. Transactions marked pending for more than 30 minutes
    const stalePendingQuery = `
      SELECT t.id, t.tx_ref, t.amount, t.currency, t.created_at, u.email
      FROM transactions t
      JOIN users u ON u.id = t.user_id
      WHERE t.status = 'pending' AND t.created_at < NOW() - INTERVAL '30 minutes'
      ORDER BY t.created_at DESC
      LIMIT 50;
    `;
    const stalePendingRes = await pool.query(stalePendingQuery);

    return res.json({
      success: true,
      data: {
        unconfirmed_paid_bookings: unconfirmedPaidRes.rows,
        booking_payment_conflicts: conflictsRes.rows,
        stale_pending_transactions: stalePendingRes.rows,
        summary: {
          unconfirmed_paid_count: unconfirmedPaidRes.rowCount,
          conflicts_count: conflictsRes.rowCount,
          stale_pending_count: stalePendingRes.rowCount,
        },
      },
    });
  } catch (err) {
    console.error('[adminFinance] Error running reconciliation:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to run financial reconciliation.' });
  }
});

/**
 * GET /api/admin/earnings
 * Summary of provider earnings owed from completed bookings.
 * Permission: payments.view_ledger
 */
router.get('/earnings', requirePermission('payments.view_ledger'), async (_req, res) => {
  try {
    const query = `
      SELECT 
        p.id AS provider_id,
        p.provider_name,
        u.email AS provider_email,
        COUNT(b.id) AS completed_bookings_count,
        COALESCE(SUM(b.price_amount), 0) AS gross_revenue_etb,
        ROUND(COALESCE(SUM(b.price_amount), 0) * 0.90, 2) AS provider_earnings_etb,
        ROUND(COALESCE(SUM(b.price_amount), 0) * 0.10, 2) AS platform_commission_etb
      FROM providers p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN bookings b ON b.provider_user_id = p.user_id AND b.status = 'completed'
      GROUP BY p.id, p.provider_name, u.email
      ORDER BY gross_revenue_etb DESC
      LIMIT 50;
    `;

    const result = await pool.query(query);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('[adminFinance] Error calculating earnings:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve earnings summary.' });
  }
});

/**
 * GET /api/admin/refunds
 * List refund records and pending two-person approval requests.
 * Permission: refunds.initiate
 */
router.get('/refunds', requirePermission('refunds.initiate'), async (_req, res) => {
  try {
    const approvalsQuery = `
      SELECT 
        ra.id,
        ra.transaction_id,
        ra.booking_id,
        ra.amount,
        ra.currency,
        ra.status,
        ra.request_reason,
        ra.decision_reason,
        ra.created_at,
        ra.decided_at,
        requester.full_name AS requested_by_name,
        requester.email AS requested_by_email,
        approver.full_name AS approved_by_name,
        approver.email AS approved_by_email,
        t.tx_ref,
        b.reference AS booking_reference
      FROM refund_approvals ra
      JOIN users requester ON requester.id = ra.requested_by
      LEFT JOIN users approver ON approver.id = ra.approved_by
      JOIN transactions t ON t.id = ra.transaction_id
      LEFT JOIN bookings b ON b.id = ra.booking_id
      ORDER BY 
        CASE ra.status WHEN 'pending_approval' THEN 0 ELSE 1 END,
        ra.created_at DESC;
    `;

    const result = await pool.query(approvalsQuery);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('[adminFinance] Error listing refunds:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve refund records.' });
  }
});

/**
 * POST /api/admin/refunds
 * Initiate a customer refund. If amount > 10,000 ETB, enters two-person approval workflow.
 * Permission: refunds.initiate
 */
router.post('/refunds', requirePermission('refunds.initiate'), async (req, res) => {
  const {
    transaction_id,
    booking_id,
    amount,
    currency = 'ETB',
    reason,
  } = req.body;

  if (!transaction_id || !amount || parseFloat(amount) <= 0 || !reason) {
    return res.status(400).json({ success: false, message: 'Valid transaction_id, positive amount, and reason are required.' });
  }

  const refundAmount = parseFloat(amount);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Validate transaction existence and status
    const txRes = await client.query(
      `SELECT id, user_id, amount, currency, status, tx_ref 
       FROM transactions 
       WHERE id = $1 FOR UPDATE`,
      [transaction_id]
    );

    if (txRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const tx = txRes.rows[0];
    if (tx.status !== 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Only completed transactions can be refunded.' });
    }

    // 2. Fetch refund threshold setting (default: 10000)
    let threshold = 10000;
    const settingRes = await client.query(
      `SELECT value FROM platform_settings WHERE key = 'refund_two_person_threshold_etb'`
    );
    if (settingRes.rows.length > 0) {
      threshold = parseInt(settingRes.rows[0].value, 10) || 10000;
    }

    // 3. Two-Person Rule Evaluation
    if (refundAmount > threshold) {
      const approvalRes = await client.query(
        `INSERT INTO refund_approvals (
          transaction_id, booking_id, amount, currency, status, requested_by, request_reason
        ) VALUES ($1, $2, $3, $4, 'pending_approval', $5, $6)
        RETURNING id, status, created_at`,
        [transaction_id, booking_id || null, refundAmount, currency, req.user.id, String(reason).trim()]
      );

      await logAdminAction(client, {
        actorUserId: req.user.id,
        permissionKey: 'refunds.initiate',
        action: 'REFUND_REQUESTED',
        targetType: 'refund_approval',
        targetId: approvalRes.rows[0].id,
        summary: {
          transaction_id,
          tx_ref: tx.tx_ref,
          amount: refundAmount,
          threshold,
          requires_second_approver: true,
        },
        reason: String(reason).trim(),
        req,
      });

      // Dispatch alert to finance approvers (Batch 11 Notification Engine)
      try {
        await notify('payment.admin_refund_approval_pending', {
          refundAmount,
          initiatorEmail: req.user.email,
          reason: String(reason).trim(),
        }, {
          subjectType: 'system',
          adminPermission: 'refunds.approve',
          actorUserId: req.user.id,
        }, client);
      } catch (notifErr) {
        console.warn('[adminFinance] Finance alert warning:', notifErr.message);
      }

      await client.query('COMMIT');

      return res.status(202).json({
        success: true,
        status: 'pending_approval',
        message: `Refund of ${refundAmount} ${currency} exceeds threshold (${threshold} ETB) and requires second approval.`,
        approval_id: approvalRes.rows[0].id,
      });
    }

    // 4. Executed immediately for amounts <= threshold
    // Insert compensating refund row into transactions
    const refundRef = `RF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await client.query(
      `INSERT INTO transactions (
        user_id, tx_ref, chapa_reference, amount, currency, status, purpose, payment_method, metadata
      ) VALUES ($1, $2, $3, $4, $5, 'completed', 'refund', 'system_credit', $6)`,
      [
        tx.user_id,
        refundRef,
        tx.tx_ref,
        refundAmount,
        currency,
        JSON.stringify({ original_tx_id: tx.id, reason: String(reason).trim(), approved_by: req.user.id }),
      ]
    );

    // If booking linked, update booking refund_amount
    if (booking_id) {
      await client.query(
        `UPDATE bookings 
         SET refund_amount = refund_amount + $1, updated_at = NOW() 
         WHERE id = $2`,
        [refundAmount, booking_id]
      );
    }

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'refunds.initiate',
      action: 'REFUND_EXECUTED',
      targetType: 'transaction',
      targetId: transaction_id,
      summary: {
        tx_ref: tx.tx_ref,
        refund_ref: refundRef,
        amount: refundAmount,
      },
      reason: String(reason).trim(),
      req,
    });

    // Dispatch refund issued notification (Batch 11 Notification Engine)
    try {
      const userRes = await client.query('SELECT full_name, email FROM users WHERE id = $1', [tx.user_id]);
      const customerName = userRes.rows[0]?.full_name || 'Customer';

      await notify('payment.refund_issued', {
        customerName,
        refundAmount,
        transactionRef: tx.tx_ref,
        refundReason: String(reason).trim(),
      }, {
        subjectType: 'user',
        subjectId: tx.user_id,
        actorUserId: req.user.id,
      }, client);
    } catch (notifErr) {
      console.warn('[adminFinance] Refund notification warning:', notifErr.message);
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      status: 'approved',
      message: `Refund of ${refundAmount} ${currency} executed successfully.`,
      refund_reference: refundRef,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminFinance] Error processing refund:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to process refund.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/refunds/:id/approve
 * Second-person approval for large refunds (> 10,000 ETB).
 * Permission: refunds.approve
 */
router.post('/refunds/:id/approve', requirePermission('refunds.approve'), async (req, res) => {
  const approvalId = req.params.id;
  const { reason = 'Second-person refund approval granted' } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const appRes = await client.query(
      `SELECT ra.*, t.tx_ref, t.user_id AS customer_user_id
       FROM refund_approvals ra
       JOIN transactions t ON t.id = ra.transaction_id
       WHERE ra.id = $1 FOR UPDATE`,
      [approvalId]
    );

    if (appRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Refund approval request not found.' });
    }

    const approval = appRes.rows[0];

    if (approval.status !== 'pending_approval') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Refund request is already ${approval.status}.` });
    }

    // STRICT TWO-PERSON RULE: Approver MUST be different from requester
    if (approval.requested_by === req.user.id && req.user.role !== 'super_admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'Two-person authorization violation: You cannot approve your own refund request.',
      });
    }

    // 1. Mark approval approved
    await client.query(
      `UPDATE refund_approvals 
       SET status = 'approved', approved_by = $1, decision_reason = $2, decided_at = NOW() 
       WHERE id = $3`,
      [req.user.id, String(reason).trim(), approvalId]
    );

    // 2. Insert compensating refund transaction
    const refundRef = `RF-2P-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await client.query(
      `INSERT INTO transactions (
        user_id, tx_ref, chapa_reference, amount, currency, status, purpose, payment_method, metadata
      ) VALUES ($1, $2, $3, $4, $5, 'completed', 'refund', 'system_credit', $6)`,
      [
        approval.customer_user_id,
        refundRef,
        approval.tx_ref,
        approval.amount,
        approval.currency,
        JSON.stringify({
          original_tx_id: approval.transaction_id,
          requested_by: approval.requested_by,
          approved_by: req.user.id,
          approval_id: approval.id,
        }),
      ]
    );

    // 3. Update booking refund_amount if present
    if (approval.booking_id) {
      await client.query(
        `UPDATE bookings 
         SET refund_amount = refund_amount + $1, updated_at = NOW() 
         WHERE id = $2`,
        [approval.amount, approval.booking_id]
      );
    }

    // 4. Atomic audit log
    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'refunds.approve',
      action: 'REFUND_SECOND_APPROVAL',
      targetType: 'refund_approval',
      targetId: approvalId,
      summary: {
        amount: approval.amount,
        requested_by: approval.requested_by,
        approved_by: req.user.id,
        refund_reference: refundRef,
      },
      reason: String(reason).trim(),
      req,
    });

    // Dispatch refund issued notification (Batch 11 Notification Engine)
    try {
      const userRes = await client.query('SELECT full_name, email FROM users WHERE id = $1', [approval.customer_user_id]);
      const customerName = userRes.rows[0]?.full_name || 'Customer';

      await notify('payment.refund_issued', {
        customerName,
        refundAmount: approval.amount,
        transactionRef: approval.tx_ref,
        refundReason: String(reason).trim(),
      }, {
        subjectType: 'user',
        subjectId: approval.customer_user_id,
        actorUserId: req.user.id,
      }, client);
    } catch (notifErr) {
      console.warn('[adminFinance] Secondary refund notification warning:', notifErr.message);
    }

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Refund of ${approval.amount} ${approval.currency} approved and executed.`,
      refund_reference: refundRef,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminFinance] Error approving refund:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to approve refund.' });
  } finally {
    client.release();
  }
});

module.exports = router;
