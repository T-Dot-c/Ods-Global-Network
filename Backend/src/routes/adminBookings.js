/**
 * ODS Global Network — Admin Booking Oversight & Conflict Resolution API (Batch 10)
 *
 * Provides platform-wide booking discovery, status timeline inspection,
 * administrative cancellation with policy/override refunding, and payment conflict resolution.
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');
const { transitionBookingStatus } = require('../services/bookingService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/admin/bookings
 * Search and list all platform bookings with filters.
 * Permission: bookings.view
 */
router.get('/', requirePermission('bookings.view'), async (req, res) => {
  try {
    const {
      reference,
      status,
      customer_email,
      provider_id,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (reference && reference.trim()) {
      conditions.push(`b.reference ILIKE $${idx++}`);
      values.push(`%${reference.trim()}%`);
    }

    if (status && status.trim()) {
      conditions.push(`b.status = $${idx++}`);
      values.push(status.trim());
    }

    if (customer_email && customer_email.trim()) {
      conditions.push(`c.email ILIKE $${idx++}`);
      values.push(`%${customer_email.trim()}%`);
    }

    if (provider_id && provider_id.trim()) {
      conditions.push(`b.provider_user_id = $${idx++}`);
      values.push(provider_id.trim());
    }

    if (date_from) {
      conditions.push(`b.start_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`b.start_at <= $${idx++}`);
      values.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM bookings b
      JOIN users c ON c.id = b.customer_user_id
      ${whereClause};
    `;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const query = `
      SELECT 
        b.id,
        b.reference,
        b.service_id,
        b.customer_user_id,
        b.provider_user_id,
        b.start_at,
        b.end_at,
        b.status,
        b.price_amount,
        b.currency,
        b.refund_amount,
        b.reschedule_count,
        b.created_at,
        b.service_snapshot->>'title' AS service_title,
        c.email AS customer_email,
        c.full_name AS customer_name,
        p.provider_name
      FROM bookings b
      JOIN users c ON c.id = b.customer_user_id
      LEFT JOIN providers p ON p.user_id = b.provider_user_id
      ${whereClause}
      ORDER BY b.start_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    values.push(limitNum, offset);
    const result = await pool.query(query, values);

    return res.json({
      success: true,
      data: {
        bookings: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[adminBookings] Error listing bookings:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Retrieve comprehensive details, timelines, snapshots, and payment details for a booking.
 * Permission: bookings.view
 */
router.get('/:id', requirePermission('bookings.view'), async (req, res) => {
  try {
    const bookingId = req.params.id;

    // 1. Fetch booking with customer and provider info
    const query = `
      SELECT 
        b.*,
        c.email AS customer_email,
        c.full_name AS customer_name,
        c.phone AS customer_registered_phone,
        p.provider_name,
        t.tx_ref,
        t.status AS transaction_status,
        gc.code AS gift_card_masked_code
      FROM bookings b
      JOIN users c ON c.id = b.customer_user_id
      LEFT JOIN providers p ON p.user_id = b.provider_user_id
      LEFT JOIN transactions t ON t.id = b.payment_transaction_id
      LEFT JOIN gift_cards gc ON gc.id = b.gift_card_id
      WHERE b.id = $1;
    `;

    const result = await pool.query(query, [bookingId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = result.rows[0];

    // 2. Fetch immutable status history
    const historyRes = await pool.query(
      `SELECT h.id, h.from_status, h.to_status, h.reason, h.created_at, u.full_name AS actor_name, u.role AS actor_role
       FROM booking_status_history h
       LEFT JOIN users u ON u.id = h.actor_user_id
       WHERE h.booking_id = $1
       ORDER BY h.created_at ASC`,
      [bookingId]
    );

    return res.json({
      success: true,
      data: {
        booking,
        timeline: historyRes.rows,
      },
    });
  } catch (err) {
    console.error('[adminBookings] Error fetching booking detail:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve booking detail.' });
  }
});

/**
 * POST /api/admin/bookings/:id/cancel
 * Administrative cancellation with policy refunding or explicit override.
 * Permission: bookings.manage (bookings.cancel_override required for manual override amount)
 */
router.post('/:id/cancel', requirePermission('bookings.manage'), async (req, res) => {
  const bookingId = req.params.id;
  const { reason, refund_override_amount } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'Mandatory cancellation reason required.' });
  }

  // Check override permission if refund_override_amount is supplied
  if (refund_override_amount !== undefined && refund_override_amount !== null) {
    if (!req.userPermissions.includes('bookings.cancel_override') && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: missing permission bookings.cancel_override to manually set refund amounts.',
      });
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];
    if (['completed', 'cancelled_by_customer', 'cancelled_by_provider'].includes(booking.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Cannot cancel booking in ${booking.status} status.` });
    }

    let finalRefund = 0;
    if (refund_override_amount !== undefined && refund_override_amount !== null) {
      finalRefund = Math.min(parseFloat(booking.price_amount), Math.max(0, parseFloat(refund_override_amount)));
    } else {
      // Default admin cancellation gives 100% full refund
      finalRefund = parseFloat(booking.price_amount);
    }

    // Update booking refund_amount
    await client.query(
      `UPDATE bookings SET refund_amount = $1, updated_at = NOW() WHERE id = $2`,
      [finalRefund, bookingId]
    );

    // Transition status to cancelled_by_provider
    await transitionBookingStatus(
      bookingId,
      'cancelled_by_provider',
      req.user.id,
      `Admin cancellation: ${String(reason).trim()}`,
      client
    );

    // Log admin action atomically
    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'bookings.manage',
      action: 'ADMIN_BOOKING_CANCEL',
      targetType: 'booking',
      targetId: bookingId,
      summary: {
        reference: booking.reference,
        price_amount: booking.price_amount,
        refund_amount: finalRefund,
        refund_override: refund_override_amount !== undefined,
      },
      reason: String(reason).trim(),
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Booking ${booking.reference} cancelled by admin. Refund of ${finalRefund} ${booking.currency} recorded.`,
      refund_amount: finalRefund,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminBookings] Error cancelling booking:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/bookings/:id/resolve-conflict
 * Resolve payment_conflict booking (e.g. late payment arrived after hold expired).
 * Permission: bookings.resolve_conflict
 */
router.post('/:id/resolve-conflict', requirePermission('bookings.resolve_conflict'), async (req, res) => {
  const bookingId = req.params.id;
  const { resolution, reason } = req.body; // resolution: 'refund' or 'confirm'

  if (!['refund', 'confirm'].includes(resolution)) {
    return res.status(400).json({ success: false, message: "Resolution must be 'refund' or 'confirm'." });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(
      `SELECT * FROM bookings WHERE id = $1 FOR UPDATE`,
      [bookingId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRes.rows[0];
    if (booking.status !== 'payment_conflict') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Only bookings in payment_conflict status can be resolved.' });
    }

    if (resolution === 'refund') {
      await client.query(
        `UPDATE bookings SET refund_amount = price_amount, updated_at = NOW() WHERE id = $1`,
        [bookingId]
      );
      await transitionBookingStatus(
        bookingId,
        'cancelled_by_provider',
        req.user.id,
        `Resolved payment conflict with 100% refund: ${reason || 'Admin resolved'}`,
        client
      );
    } else {
      // Force confirmation
      await transitionBookingStatus(
        bookingId,
        'confirmed',
        req.user.id,
        `Resolved payment conflict by confirming appointment: ${reason || 'Admin resolved'}`,
        client
      );
    }

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'bookings.resolve_conflict',
      action: 'RESOLVE_PAYMENT_CONFLICT',
      targetType: 'booking',
      targetId: bookingId,
      summary: { reference: booking.reference, resolution },
      reason: reason || 'Administrative conflict resolution',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Conflict resolved via ${resolution}.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminBookings] Error resolving conflict:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to resolve conflict.' });
  } finally {
    client.release();
  }
});

module.exports = router;
