/**
 * ODS Global Network — Gifting & Digital Vouchers Router
 *
 * Implements:
 * - POST /api/gifting/purchase: Purchase a monetary gift card or service voucher
 * - POST /api/gifting/redeem: Atomically redeem a gift card into customer wallet
 * - POST /api/gifting/check: Public/safe preview of gift card balance and validity
 * - POST /api/gifting/confirm-delivery: Provider confirmation of service delivery
 * - GET  /api/gifting/wallet: Get current user wallet balance and redemption ledger
 * - GET  /api/gifting/my-cards: Get list of sent and received gift cards
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole, requireVerifiedEmail } = require('../middleware/auth');
const giftCardService = require('../services/giftCardService');
const emailService = require('../services/emailService');
const { logAuditEvent } = require('../services/auditService');

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   POST /api/gifting/check (Public / Safe Preview)
   ───────────────────────────────────────────────────────────── */
router.post('/check', async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Please provide a valid gift card code.' });
  }

  try {
    const result = await giftCardService.checkGiftCard(code);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    return res.json({
      success: true,
      valid: true,
      ...result,
    });
  } catch (err) {
    console.error('[gifting/check] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Error checking gift card status.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/gifting/purchase
   ───────────────────────────────────────────────────────────── */
router.post('/purchase', requireAuth, requireVerifiedEmail, async (req, res) => {
  const amount = req.body.amount;
  const currency = req.body.currency;
  const gift_type = req.body.gift_type || req.body.giftType;
  const package_type = req.body.package_type || req.body.packageType;
  const occasion = req.body.occasion;
  const service_title = req.body.service_title || req.body.serviceTitle;
  const service_category = req.body.service_category || req.body.serviceCategory;
  const service_provider_id = req.body.service_provider_id || req.body.serviceProviderId;
  const recipient_email = req.body.recipient_email || req.body.recipientEmail;
  const recipient_phone = req.body.recipient_phone || req.body.recipientPhone;
  const recipient_name = req.body.recipient_name || req.body.recipientName;
  const personal_message = req.body.personal_message || req.body.personalMessage;
  const metadata = req.body.metadata;

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please specify a valid gift amount greater than 0.' });
  }

  if (gift_type === 'service' && (!service_title || typeof service_title !== 'string' || !service_title.trim())) {
    return res.status(400).json({ success: false, message: 'Service title is required for service-linked gifts.' });
  }

  try {
    const giftCard = await giftCardService.purchaseGiftCard({
      senderId: req.user.id,
      amount: numericAmount,
      currency: currency || 'ETB',
      giftType: gift_type || 'monetary',
      packageType: package_type || 'basic',
      occasion: occasion || 'Generic',
      serviceTitle: service_title,
      serviceCategory: service_category,
      serviceProviderId: service_provider_id,
      recipientEmail: recipient_email,
      recipientPhone: recipient_phone,
      recipientName: recipient_name,
      personalMessage: personal_message,
      metadata,
    });

    // Asynchronously dispatch gift card presentation email if recipient email provided
    if (recipient_email) {
      emailService.sendGiftCardPresentationEmail({
        to: recipient_email,
        recipientName: recipient_name,
        senderName: req.user.fullName || req.user.email,
        code: giftCard.code,
        amount: giftCard.initialAmount,
        currency: giftCard.currency,
        giftType: giftCard.giftType,
        packageType: giftCard.packageType,
        occasion: giftCard.occasion,
        serviceTitle: giftCard.serviceTitle,
        personalMessage: personal_message,
        expiryDate: giftCard.expiryDate,
      }).catch((mailErr) => {
        console.error('[gifting/purchase] Email dispatch warning:', mailErr.message);
      });
    }

    try {
      await logAuditEvent({
        userId: req.user.id,
        action: 'GIFT_CARD_PURCHASED',
        targetId: giftCard.id,
        details: {
          code: giftCard.code,
          amount: giftCard.initialAmount,
          currency: giftCard.currency,
          occasion: giftCard.occasion,
          packageType: giftCard.packageType,
          recipientEmail: recipient_email,
        },
      });
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: 'Gift card created successfully.',
      giftCard,
    });
  } catch (err) {
    console.error('[gifting/purchase] Error:', err.message);
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to purchase gift card.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/gifting/redeem
   ───────────────────────────────────────────────────────────── */
router.post('/redeem', requireAuth, requireVerifiedEmail, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Please enter a gift card claim code.' });
  }

  try {
    const result = await giftCardService.redeemGiftCard({
      rawCode: code,
      userId: req.user.id,
    });

    // Notify sender if sender email exists
    if (result.giftCard.sender_id) {
      pool.query(`SELECT email, full_name FROM users WHERE id = $1`, [result.giftCard.sender_id])
        .then((senderRes) => {
          if (senderRes.rows.length > 0) {
            const sender = senderRes.rows[0];
            emailService.sendGiftCardRedemptionNoticeEmail({
              to: sender.email,
              senderName: sender.full_name,
              recipientName: req.user.fullName || req.user.email,
              amount: result.redeemedAmount,
              currency: result.currency,
              occasion: result.giftCard.occasion,
              code: result.giftCard.code || code,
            }).catch(() => {});
          }
        })
        .catch(() => {});
    }

    try {
      await logAuditEvent({
        userId: req.user.id,
        action: 'GIFT_CARD_REDEEMED',
        targetId: result.giftCard.id,
        details: {
          redeemedAmount: result.redeemedAmount,
          currency: result.currency,
          newWalletBalance: result.newWalletBalance,
        },
      });
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Gift card balance successfully credited to your digital wallet.',
      redeemedAmount: result.redeemedAmount,
      currency: result.currency,
      newWalletBalance: result.newWalletBalance,
      giftCard: result.giftCard,
    });
  } catch (err) {
    console.error('[gifting/redeem] Error:', err.message);
    const status = err.statusCode || 400;
    return res.status(status).json({ success: false, message: err.message || 'Failed to redeem gift card.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/gifting/confirm-delivery (Provider in-clinic confirmation)
   ───────────────────────────────────────────────────────────── */
router.post('/confirm-delivery', requireAuth, requireRole('provider', 'super_admin', 'admin'), async (req, res) => {
  const { code, service_provider_id } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Please enter a gift voucher claim code.' });
  }

  try {
    let providerId = service_provider_id;
    if (!providerId && req.user.role === 'provider') {
      const pRes = await pool.query(`SELECT id FROM providers WHERE user_id = $1`, [req.user.id]);
      if (pRes.rows.length > 0) {
        providerId = pRes.rows[0].id;
      }
    }

    const result = await giftCardService.confirmServiceDelivery({
      rawCode: code,
      providerId,
    });

    try {
      await logAuditEvent({
        userId: req.user.id,
        action: 'SERVICE_GIFT_DELIVERED',
        targetId: result.giftCard.id,
        details: {
          deliveredAt: result.deliveredAt,
          providerId,
        },
      });
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Service voucher delivery successfully confirmed.',
      deliveredAt: result.deliveredAt,
      giftCard: result.giftCard,
    });
  } catch (err) {
    console.error('[gifting/confirm-delivery] Error:', err.message);
    const status = err.statusCode || 400;
    return res.status(status).json({ success: false, message: err.message || 'Failed to confirm voucher delivery.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/gifting/wallet (Customer digital wallet & activity ledger)
   ───────────────────────────────────────────────────────────── */
router.get('/wallet', requireAuth, async (req, res) => {
  try {
    const wallet = await giftCardService.getWalletBalance(req.user.id);
    const activity = await giftCardService.getWalletActivity(req.user.id);

    return res.json({
      success: true,
      balance: wallet.balance,
      currency: wallet.currency,
      activity,
    });
  } catch (err) {
    console.error('[gifting/wallet] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve digital wallet.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/gifting/my-cards (Sent & Received Cards)
   ───────────────────────────────────────────────────────────── */
router.get('/my-cards', requireAuth, async (req, res) => {
  try {
    const [sent, received] = await Promise.all([
      giftCardService.getSentGiftCards(req.user.id),
      giftCardService.getReceivedGiftCards(req.user.id),
    ]);

    return res.json({
      success: true,
      sent,
      received,
    });
  } catch (err) {
    console.error('[gifting/my-cards] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your gift cards.' });
  }
});

module.exports = router;
