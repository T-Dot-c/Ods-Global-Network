/**
 * ODS Global Network — Unified Admin Dashboard & Analytics (Batch 10)
 *
 * Implements:
 * 1. GET /api/admin/dashboard (Aggregate KPI metrics & operational queue)
 */
'use strict';

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');

router.use(requireAuth);

/**
 * GET /api/admin/dashboard
 * Aggregated operational dashboard with KPI counters and Needs Attention queue.
 * Permission: users.view (all admin groups can access their relevant slice)
 */
router.get('/dashboard', requirePermission('users.view'), async (req, res) => {
  try {
    const permissions = req.userPermissions || [];
    const isSuper = req.user.role === 'super_admin' || permissions.includes('*');

    const canSeeUsers = isSuper || permissions.includes('users.view');
    const canSeeKyc = isSuper || permissions.includes('kyc.queue_view');
    const canSeeServices = isSuper || permissions.includes('services.view');
    const canSeeBookings = isSuper || permissions.includes('bookings.view');
    const canSeeFinance = isSuper || permissions.includes('payments.view_ledger') || permissions.includes('payments.view');
    const canSeeGifts = isSuper || permissions.includes('gifts.view');

    const counters = {
      new_users_30d: 0,
      pending_kyc_count: 0,
      pending_services_count: 0,
      today_confirmed_bookings: 0,
      today_revenue_etb: 0,
      payment_conflicts_count: 0,
      pending_refund_approvals: 0,
      expiring_gifts_30d: 0,
    };

    const needsAttention = [];

    // 1. Users KPI (Registered users in 30 days)
    if (canSeeUsers) {
      const uRes = await pool.query(`SELECT COUNT(*) AS total FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`);
      counters.new_users_30d = parseInt(uRes.rows[0].total, 10);
    }

    // 2. KYC Queue KPI & Attention items
    if (canSeeKyc) {
      const kycRes = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM merchants WHERE approval_status = 'pending') +
          (SELECT COUNT(*) FROM providers WHERE approval_status = 'pending') AS total_pending
      `);
      counters.pending_kyc_count = parseInt(kycRes.rows[0].total_pending, 10);

      // Add attention item if pending KYC exists
      if (counters.pending_kyc_count > 0) {
        needsAttention.push({
          type: 'kyc_pending',
          label: 'KYC Submissions Awaiting Compliance Review',
          priority: 'high',
          tab: 'kyc',
          count: counters.pending_kyc_count,
        });
      }
    }

    // 3. Service Moderation KPI & Attention items
    if (canSeeServices) {
      const sRes = await pool.query(`SELECT COUNT(*) AS total FROM services WHERE status = 'pending_review'`);
      counters.pending_services_count = parseInt(sRes.rows[0].total, 10);

      if (counters.pending_services_count > 0) {
        needsAttention.push({
          type: 'services_pending',
          label: 'Services Pending Catalog Moderation',
          priority: 'medium',
          tab: 'services',
          count: counters.pending_services_count,
        });
      }
    }

    // 4. Bookings KPI & Payment Conflicts (Africa/Addis_Ababa day boundaries)
    if (canSeeBookings) {
      const bRes = await pool.query(`
        SELECT 
          COUNT(*) FILTER (
            WHERE status = 'confirmed'
              AND start_at >= (NOW() AT TIME ZONE 'Africa/Addis_Ababa')::date AT TIME ZONE 'Africa/Addis_Ababa'
              AND start_at < ((NOW() AT TIME ZONE 'Africa/Addis_Ababa')::date + INTERVAL '1 day') AT TIME ZONE 'Africa/Addis_Ababa'
          ) AS today_count,
          COUNT(*) FILTER (WHERE status = 'payment_conflict') AS conflict_count
        FROM bookings;
      `);
      counters.today_confirmed_bookings = parseInt(bRes.rows[0].today_count, 10) || 0;
      counters.payment_conflicts_count = parseInt(bRes.rows[0].conflict_count, 10) || 0;

      if (counters.payment_conflicts_count > 0) {
        needsAttention.push({
          type: 'booking_conflicts',
          label: 'Late-Payment Booking Conflicts Requiring Resolution',
          priority: 'critical',
          tab: 'bookings',
          count: counters.payment_conflicts_count,
        });
      }
    }

    // 5. Finance & Revenue KPI (Africa/Addis_Ababa day boundaries)
    if (canSeeFinance) {
      const fRes = await pool.query(`
        SELECT 
          COALESCE(SUM(b.price_amount), 0) AS revenue_today
        FROM bookings b
        WHERE b.status = 'confirmed'
          AND b.start_at >= (NOW() AT TIME ZONE 'Africa/Addis_Ababa')::date AT TIME ZONE 'Africa/Addis_Ababa'
          AND b.start_at < ((NOW() AT TIME ZONE 'Africa/Addis_Ababa')::date + INTERVAL '1 day') AT TIME ZONE 'Africa/Addis_Ababa';
      `);
      counters.today_revenue_etb = parseFloat(fRes.rows[0].revenue_today) || 0;

      const refRes = await pool.query(`SELECT COUNT(*) AS total FROM refund_approvals WHERE status = 'pending_approval'`);
      counters.pending_refund_approvals = parseInt(refRes.rows[0].total, 10) || 0;

      if (counters.pending_refund_approvals > 0) {
        needsAttention.push({
          type: 'refund_approvals',
          label: 'Large Refunds Awaiting Two-Person Authorization',
          priority: 'high',
          tab: 'finance',
          count: counters.pending_refund_approvals,
        });
      }
    }

    // 6. Gifts KPI
    if (canSeeGifts) {
      const gRes = await pool.query(`
        SELECT COUNT(*) AS total 
        FROM gift_cards 
        WHERE status = 'active' AND expiry_date <= NOW() + INTERVAL '30 days'
      `);
      counters.expiring_gifts_30d = parseInt(gRes.rows[0].total, 10) || 0;
    }

    return res.json({
      success: true,
      data: {
        counters,
        needs_attention: needsAttention,
      },
    });
  } catch (err) {
    console.error('[adminDashboard] Error compiling dashboard metrics:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve dashboard metrics.' });
  }
});

module.exports = router;
