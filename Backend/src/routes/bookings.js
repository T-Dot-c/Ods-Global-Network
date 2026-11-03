/**
 * ODS Global Network — Bookings & Availability Router (Batch 9)
 *
 * Implements:
 * 1. Public Availability:
 *    - GET /api/services/:id/availability (Open slots computation)
 * 2. Customer Booking Flow:
 *    - POST /api/bookings (Create booking with 10-minute hold)
 *    - GET  /api/bookings (My bookings list)
 *    - GET  /api/bookings/:id (Booking details with history)
 *    - POST /api/bookings/:id/pay-gift (Redeem gift voucher for full cover)
 *    - POST /api/bookings/:id/cancel (Customer cancellation with policy refund)
 *    - POST /api/bookings/:id/reschedule (Atomic slot rescheduling)
 * 3. Provider Availability & Appointments:
 *    - GET  /api/my/availability (Weekly schedule rules)
 *    - PUT  /api/my/availability (Update weekly schedule rules)
 *    - GET  /api/my/availability/exceptions (List exceptions / blackouts)
 *    - POST /api/my/availability/exceptions (Add exception / blackout)
 *    - DELETE /api/my/availability/exceptions/:id (Remove exception)
 *    - GET  /api/my/bookings (Incoming provider appointments)
 *    - POST /api/my/bookings/:id/complete (Mark completed)
 *    - POST /api/my/bookings/:id/no-show (Mark no-show)
 *    - POST /api/my/bookings/:id/cancel (Provider cancel with reason)
 * 4. Admin Management:
 *    - GET  /api/admin/bookings (Platform-wide bookings oversight)
 *    - POST /api/admin/bookings/:id/cancel (Emergency cancel by admin)
 */
'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { requireAuth, requireRole, requireVerifiedEmail } = require('../middleware/auth');
const bookingService = require('../services/bookingService');
const chapaService = require('../services/chapaService');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Availability query limiter (public)
const slotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many availability queries — please slow down.' },
});

// Booking creation limiter
const createBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking attempts — please slow down.' },
});

/**
 * Helper: checks if user is an approved provider or merchant
 */
async function resolveApprovedProviderUser(userId) {
  const [pRes, mRes] = await Promise.all([
    pool.query(`SELECT id, approval_status FROM providers WHERE user_id = $1`, [userId]),
    pool.query(`SELECT id, approval_status FROM merchants WHERE user_id = $1`, [userId]),
  ]);

  if (pRes.rows.length > 0) {
    if (pRes.rows[0].approval_status !== 'approved') {
      const err = new Error('Provider account has not been approved yet.');
      err.status = 403;
      throw err;
    }
    return { type: 'provider', entityId: pRes.rows[0].id };
  }

  if (mRes.rows.length > 0) {
    if (mRes.rows[0].approval_status !== 'approved') {
      const err = new Error('Merchant account has not been approved yet.');
      err.status = 403;
      throw err;
    }
    return { type: 'merchant', entityId: mRes.rows[0].id };
  }

  const err = new Error('You must be a registered service provider or merchant.');
  err.status = 403;
  throw err;
}

/* ─────────────────────────────────────────────────────────────
   1. PUBLIC AVAILABILITY
   ───────────────────────────────────────────────────────────── */

/**
 * GET /api/services/:id/availability?from=&to=
 * Publicly viewable slot availability for any published service
 */
router.get('/services/:id/availability', slotLimiter, async (req, res) => {
  try {
    const { id: serviceId } = req.params;
    const { from, to } = req.query;

    const data = await bookingService.getAvailableSlots({
      serviceId,
      fromDate: from,
      toDate: to,
    });

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   2. CUSTOMER BOOKING ENDPOINTS
   ───────────────────────────────────────────────────────────── */

/**
 * POST /api/bookings
 * Reserves a slot and places a 10-minute hold (pending_payment)
 */
router.post('/bookings', requireAuth, requireVerifiedEmail, createBookingLimiter, async (req, res) => {
  try {
    const { service_id, start_at, contact_phone, customer_note } = req.body;

    if (!contact_phone || String(contact_phone).trim().length < 7) {
      return res.status(400).json({ success: false, message: 'A valid contact phone number is required at booking.' });
    }

    const result = await bookingService.createBookingHold({
      serviceId: service_id,
      startAt: start_at,
      customerUserId: req.user.id,
      contactPhone: String(contact_phone).trim(),
      customerNote: customer_note ? String(customer_note).trim().slice(0, 500) : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Time slot reserved. Please complete payment within 10 minutes.',
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/bookings
 * Returns authenticated customer's appointments (upcoming, past, or all)
 */
router.get('/bookings', requireAuth, async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;

    const bookings = await bookingService.getCustomerBookings(req.user.id, {
      status,
      limit,
      offset,
    });

    return res.json({ success: true, data: bookings });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/bookings/:id
 * Returns booking details, service snapshot, and immutable history ledger
 */
router.get('/bookings/:id', requireAuth, async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    return res.json({ success: true, data: booking });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/bookings/:id/pay-gift
 * Redeems an active gift card to confirm the booking atomically
 */
router.post('/bookings/:id/pay-gift', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const { gift_code } = req.body;
    if (!gift_code) {
      return res.status(400).json({ success: false, message: 'Gift card code is required.' });
    }

    const result = await bookingService.redeemGiftForBooking({
      bookingId: req.params.id,
      giftCode: gift_code,
      customerUserId: req.user.id,
    });

    return res.json({
      success: true,
      message: 'Booking confirmed using Gift Card.',
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/bookings/:id/pay-chapa
 * Customer initiates payment for their pending booking via Chapa.
 * Amount is strictly retrieved from the booking record, hold expiry is enforced.
 */
router.post('/bookings/:id/pay-chapa', requireAuth, requireVerifiedEmail, createBookingLimiter, async (req, res) => {
  const bookingId = req.params.id;
  const client = await pool.connect();
  try {
    const bRes = await client.query(
      `SELECT b.id, b.status, b.hold_expires_at, b.price_amount, b.currency, b.customer_user_id,
              s.title AS service_title, u.email, u.full_name
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       JOIN users u ON u.id = b.customer_user_id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bRes.rows[0];

    if (booking.customer_user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You are not authorized to pay for this booking.' });
    }

    if (booking.status !== 'pending_payment') {
      return res.status(400).json({
        success: false,
        message: `Booking is not awaiting payment (current status: ${booking.status}).`,
      });
    }

    if (new Date(booking.hold_expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'The 10-minute reservation hold on this booking has expired. Please select a fresh appointment slot.',
      });
    }

    const price = parseFloat(booking.price_amount);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid booking price configuration.' });
    }

    const txRef = `ods-bk-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const cleanCurrency = String(booking.currency || 'ETB').trim().toUpperCase().slice(0, 3);
    const purpose = 'booking_payment';
    const metadata = {
      booking_id: booking.id,
      service_title: booking.service_title,
    };

    const insertRes = await client.query(
      `INSERT INTO transactions (user_id, tx_ref, amount, currency, status, payment_method, purpose, metadata)
       VALUES ($1, $2, $3, $4, 'pending', 'chapa', $5, $6)
       RETURNING id, tx_ref, amount, currency, status, created_at`,
      [req.user.id, txRef, price, cleanCurrency, purpose, JSON.stringify(metadata)]
    );

    const transaction = insertRes.rows[0];
    const callbackUrl = `${BACKEND_BASE_URL}/api/payments/webhook/chapa`;
    const returnUrl = `${FRONTEND_ORIGIN}/payment/success?tx_ref=${encodeURIComponent(txRef)}`;

    const nameParts = (req.user.full_name || 'ODS Customer').trim().split(' ');
    const firstName = nameParts[0] || 'ODS';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const chapaRes = await chapaService.initializePayment({
      amount: price,
      currency: cleanCurrency,
      email: req.user.email,
      firstName,
      lastName,
      txRef,
      callbackUrl,
      returnUrl,
      metadata: {
        userId: req.user.id,
        purpose,
        booking_id: booking.id,
      },
    });

    return res.status(200).json({
      success: true,
      tx_ref: txRef,
      checkout_url: chapaRes.checkout_url,
      mode: chapaRes.mode,
      transaction,
    });
  } catch (err) {
    console.error('[pay-chapa error]:', err.message);
    return res.status(err.providerStatus || 500).json({
      success: false,
      message: err.message || 'Failed to initiate Chapa payment for booking.',
    });
  } finally {
    client.release();
  }
});

/**
 * POST /api/bookings/:id/cancel
 * Customer cancels their booking with policy-computed refund
 */
router.post('/bookings/:id/cancel', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await bookingService.cancelBookingByCustomer(req.params.id, req.user.id, reason);
    return res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/bookings/:id/reschedule
 * Customer reschedules to a new slot of the same service
 */
router.post('/bookings/:id/reschedule', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const { new_start_at } = req.body;
    if (!new_start_at) {
      return res.status(400).json({ success: false, message: 'new_start_at is required.' });
    }

    const updated = await bookingService.rescheduleBooking({
      bookingId: req.params.id,
      newStartAt: new_start_at,
      customerUserId: req.user.id,
    });

    return res.json({
      success: true,
      message: 'Booking rescheduled successfully.',
      data: updated,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   3. PROVIDER / MERCHANT AVAILABILITY & APPOINTMENTS
   ───────────────────────────────────────────────────────────── */

/**
 * GET /api/my/availability
 * Returns provider's recurring weekly availability rules
 */
router.get('/my/availability', requireAuth, async (req, res) => {
  try {
    const { service_id } = req.query;
    const rules = await bookingService.getWeeklyAvailability(req.user.id, service_id);
    return res.json({ success: true, data: rules });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

/**
 * PUT /api/my/availability
 * Updates provider's recurring weekly availability rules
 */
router.put('/my/availability', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    await resolveApprovedProviderUser(req.user.id);
    const { rules, service_id } = req.body;

    const saved = await bookingService.setWeeklyAvailability(req.user.id, rules, service_id);
    return res.json({
      success: true,
      message: 'Weekly availability updated successfully.',
      data: saved,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/my/availability/exceptions
 * Lists blackout dates and custom hours
 */
router.get('/my/availability/exceptions', requireAuth, async (req, res) => {
  try {
    const { service_id } = req.query;
    const exceptions = await bookingService.getAvailabilityExceptions(req.user.id, service_id);
    return res.json({ success: true, data: exceptions });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/availability/exceptions
 * Adds an exception date
 */
router.post('/my/availability/exceptions', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    await resolveApprovedProviderUser(req.user.id);
    const saved = await bookingService.addAvailabilityException(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Availability exception added successfully.',
      data: saved,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * DELETE /api/my/availability/exceptions/:id
 * Removes an exception date
 */
router.delete('/my/availability/exceptions/:id', requireAuth, async (req, res) => {
  try {
    await bookingService.deleteAvailabilityException(req.user.id, req.params.id);
    return res.json({ success: true, message: 'Exception deleted.' });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/my/bookings
 * Returns incoming appointments for own services
 */
router.get('/my/bookings', requireAuth, async (req, res) => {
  try {
    const { status, fromDate, toDate, limit = 50, offset = 0 } = req.query;
    const bookings = await bookingService.getProviderBookings(req.user.id, {
      status,
      fromDate,
      toDate,
      limit,
      offset,
    });
    return res.json({ success: true, data: bookings });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/bookings/:id/complete
 * Provider marks appointment completed
 */
router.post('/my/bookings/:id/complete', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    await bookingService.markBookingCompleted(req.params.id, req.user.id);
    return res.json({ success: true, message: 'Appointment marked as completed.' });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/bookings/:id/no-show
 * Provider marks customer as no-show
 */
router.post('/my/bookings/:id/no-show', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    await bookingService.markBookingNoShow(req.params.id, req.user.id);
    return res.json({ success: true, message: 'Appointment marked as no-show.' });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/my/bookings/:id/cancel
 * Provider cancels appointment with mandatory reason (100% refund)
 */
router.post('/my/bookings/:id/cancel', requireAuth, requireVerifiedEmail, async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await bookingService.cancelBookingByProvider(req.params.id, req.user.id, reason);
    return res.json({
      success: true,
      message: 'Appointment cancelled. Customer will receive a full refund.',
      data: result,
    });
  } catch (err) {
    return res.status(err.status || 400).json({ success: false, message: err.message });
  }
});

/* ─────────────────────────────────────────────────────────────
   4. ADMIN BOOKINGS MANAGEMENT (THIN SLICE)
   ───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/bookings
 * Read-only list of platform-wide bookings
 */
router.get('/admin/bookings', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT b.*,
             s.title as service_title,
             COALESCE(p.provider_name, m.business_name, 'ODS Partner') as provider_name,
             u.full_name as customer_name,
             u.email as customer_email
      FROM bookings b
      LEFT JOIN services s ON b.service_id = s.id
      LEFT JOIN providers p ON b.provider_user_id = p.user_id
      LEFT JOIN merchants m ON b.provider_user_id = m.user_id
      LEFT JOIN users u ON b.customer_user_id = u.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE b.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await pool.query(query, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/admin/bookings/:id/cancel
 * Emergency platform cancellation by admin
 */
router.post('/admin/bookings/:id/cancel', requireAuth, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
    }

    const bRes = await pool.query(`SELECT * FROM bookings WHERE id = $1`, [req.params.id]);
    if (bRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Booking not found.' });

    const booking = bRes.rows[0];
    const fullRefund = parseFloat(booking.price_amount) || 0;

    await pool.query(
      `UPDATE bookings SET status = 'cancelled_by_admin', refund_amount = $1, updated_at = NOW() WHERE id = $2`,
      [fullRefund, booking.id]
    );

    await pool.query(
      `INSERT INTO booking_status_history (booking_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, $2, 'cancelled_by_admin', $3, $4)`,
      [booking.id, booking.status, req.user.id, `Admin intervention: ${reason}`]
    );

    return res.json({ success: true, message: 'Booking cancelled by admin.', refund_amount: fullRefund });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
