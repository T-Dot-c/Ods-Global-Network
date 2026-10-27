/**
 * ODS Global Network — Admin Gift Card Management & Logged Code Reveal API (Batch 10)
 *
 * Provides inspection of digital vouchers, status modifications, expiration extensions,
 * and audited unmasking of full redemption codes.
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');

const router = express.Router();
router.use(requireAuth);

/**
 * Masks a gift card voucher code for safe display
 * e.g. "ODS-GC-3N86-YRCC" -> "ODS-GC-****-****-YRCC"
 */
function maskCode(code) {
  if (!code || typeof code !== 'string') return 'ODS-GC-****-****';
  return 'ODS-GC-****-****';
}

/**
 * GET /api/admin/gifts
 * Search and list all gift cards with masked redemption codes.
 * Permission: gifts.view
 */
router.get('/', requirePermission('gifts.view'), async (req, res) => {
  try {
    const {
      status,
      recipient_email,
      sender_email,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status && status.trim()) {
      conditions.push(`g.status = $${idx++}`);
      values.push(status.trim());
    }

    if (recipient_email && recipient_email.trim()) {
      conditions.push(`g.recipient_email ILIKE $${idx++}`);
      values.push(`%${recipient_email.trim()}%`);
    }

    if (sender_email && sender_email.trim()) {
      conditions.push(`u.email ILIKE $${idx++}`);
      values.push(`%${sender_email.trim()}%`);
    }

    if (date_from) {
      conditions.push(`g.created_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`g.created_at <= $${idx++}`);
      values.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM gift_cards g
      JOIN users u ON u.id = g.sender_id
      ${whereClause};
    `;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const query = `
      SELECT 
        g.id,
        g.code,
        g.gift_type,
        g.initial_amount,
        g.balance,
        g.currency,
        g.status,
        g.occasion,
        g.recipient_name,
        g.recipient_email,
        g.expiry_date,
        g.created_at,
        u.email AS purchaser_email,
        u.full_name AS purchaser_name
      FROM gift_cards g
      JOIN users u ON u.id = g.sender_id
      ${whereClause}
      ORDER BY g.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    values.push(limitNum, offset);
    const result = await pool.query(query, values);

    // Safely mask codes in listing
    const maskedGifts = result.rows.map(r => ({
      ...r,
      code: maskCode(r.code),
    }));

    return res.json({
      success: true,
      data: {
        gifts: maskedGifts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[adminGifts] Error listing gifts:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve gift cards.' });
  }
});

/**
 * GET /api/admin/gifts/:id
 * Retrieve gift card details with redemptions ledger.
 * Permission: gifts.view
 */
router.get('/:id', requirePermission('gifts.view'), async (req, res) => {
  try {
    const giftId = req.params.id;

    const giftRes = await pool.query(
      `SELECT g.*, u.email AS purchaser_email, u.full_name AS purchaser_name
       FROM gift_cards g
       JOIN users u ON u.id = g.sender_id
       WHERE g.id = $1`,
      [giftId]
    );

    if (giftRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Gift card not found.' });
    }

    const gift = giftRes.rows[0];

    // Fetch redemptions ledger
    const redemptionsRes = await pool.query(
      `SELECT r.id, r.amount, r.created_at AS redeemed_at, u.email AS redeemer_email, u.full_name AS redeemer_name
       FROM gift_card_redemptions r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.gift_card_id = $1
       ORDER BY r.created_at DESC`,
      [giftId]
    );

    return res.json({
      success: true,
      data: {
        gift: {
          ...gift,
          code: maskCode(gift.code),
        },
        redemptions: redemptionsRes.rows,
      },
    });
  } catch (err) {
    console.error('[adminGifts] Error fetching gift detail:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve gift details.' });
  }
});

/**
 * POST /api/admin/gifts/:id/cancel
 * Administratively cancel an unredeemed gift card and issue a refund.
 * Permission: gifts.manage
 */
router.post('/:id/cancel', requirePermission('gifts.manage'), async (req, res) => {
  const giftId = req.params.id;
  const { reason } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const giftRes = await client.query(
      `SELECT id, code, sender_id, balance, status FROM gift_cards WHERE id = $1 FOR UPDATE`,
      [giftId]
    );

    if (giftRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Gift card not found.' });
    }

    const gift = giftRes.rows[0];
    if (gift.status === 'redeemed' || gift.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: `Cannot cancel a gift card in ${gift.status} status.` });
    }

    await client.query(
      `UPDATE gift_cards SET status = 'cancelled' WHERE id = $1`,
      [giftId]
    );

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'gifts.manage',
      action: 'ADMIN_GIFT_CANCEL',
      targetType: 'gift_card',
      targetId: giftId,
      summary: {
        masked_code: maskCode(gift.code),
        balance_at_cancellation: gift.balance,
      },
      reason: String(reason).trim(),
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Gift card ${maskCode(gift.code)} has been cancelled.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminGifts] Error cancelling gift card:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to cancel gift card.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/gifts/:id/extend
 * Extend a gift card validity expiration date.
 * Permission: gifts.manage
 */
router.post('/:id/extend', requirePermission('gifts.manage'), async (req, res) => {
  const giftId = req.params.id;
  const { new_expiry_date, reason } = req.body;

  if (!new_expiry_date) {
    return res.status(400).json({ success: false, message: 'Valid new_expiry_date is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const giftRes = await client.query(
      `SELECT id, code, expiry_date FROM gift_cards WHERE id = $1 FOR UPDATE`,
      [giftId]
    );

    if (giftRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Gift card not found.' });
    }

    const gift = giftRes.rows[0];

    await client.query(
      `UPDATE gift_cards SET expiry_date = $1 WHERE id = $2`,
      [new_expiry_date, giftId]
    );

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'gifts.manage',
      action: 'ADMIN_GIFT_EXTEND',
      targetType: 'gift_card',
      targetId: giftId,
      summary: {
        masked_code: maskCode(gift.code),
        previous_expiry: gift.expiry_date,
        new_expiry: new_expiry_date,
      },
      reason: reason ? String(reason).trim() : 'Validity extension granted',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Gift card expiration extended successfully.',
      new_expiry_date,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminGifts] Error extending gift card:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to extend expiration.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/gifts/:id/reveal-code
 * Unmask the full redemption code with mandatory justification and high-priority audit log.
 * Permission: gifts.reveal_code
 */
router.post('/:id/reveal-code', requirePermission('gifts.reveal_code'), async (req, res) => {
  const giftId = req.params.id;
  const { reason } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({
      success: false,
      message: 'A specific justification reason is mandatory to reveal a gift card redemption code.',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const giftRes = await client.query(`SELECT id, code, status FROM gift_cards WHERE id = $1`, [giftId]);
    if (giftRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Gift card not found.' });
    }

    const gift = giftRes.rows[0];

    // High-priority audit log
    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'gifts.reveal_code',
      action: 'GIFT_CODE_REVEALED',
      targetType: 'gift_card',
      targetId: giftId,
      summary: {
        status: gift.status,
        masked_code: maskCode(gift.code),
      },
      reason: String(reason).trim(),
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      data: {
        code: gift.code,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminGifts] Error revealing gift code:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to reveal code.' });
  } finally {
    client.release();
  }
});

module.exports = router;
