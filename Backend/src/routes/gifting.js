/**
 * ODS Global Network — Gifting & Digital Vouchers Router
 *
 * Implements:
 * - POST /api/gifting/purchase: Purchase a monetary gift card or service voucher (direct, wallet, chapa)
 * - POST /api/gifting/redeem: Atomically redeem a gift card into customer wallet
 * - POST /api/gifting/check: Public/safe preview of gift card balance and validity
 * - POST /api/gifting/confirm-delivery: Provider confirmation of service delivery
 * - GET  /api/gifting/provider/vouchers: Provider list and metrics for clinical service vouchers
 * - GET  /api/gifting/wallet: Get current user wallet balance and redemption ledger
 * - GET  /api/gifting/my-cards: Get list of sent and received gift cards
 */
'use strict';

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { requireAuth, requireRole, requireVerifiedEmail } = require('../middleware/auth');
const giftCardService = require('../services/giftCardService');
const { notify } = require('../services/notificationService');
const chapaService = require('../services/chapaService');
const { logAuditEvent } = require('../services/auditService');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

const router = express.Router();

/* ─────────────────────────────────────────────────────────────
   Abuse Controls: Rate Limiters for Redemption & Purchase
   ───────────────────────────────────────────────────────────── */
const giftCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.ALLOW_DESTRUCTIVE_TESTS === '1',
  message: { success: false, message: 'Too many gift voucher lookup attempts. Please try again later.' },
});

const giftPurchaseLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40, // 40 purchases per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test' || process.env.ALLOW_DESTRUCTIVE_TESTS === '1',
  message: { success: false, message: 'Too many gift card purchase requests. Please try again later.' },
});

/* ─────────────────────────────────────────────────────────────
   GET /api/gifting/public/claim/:code (Public Guest Claim & Preview)
   ───────────────────────────────────────────────────────────── */
router.get('/public/claim/:code', giftCheckLimiter, async (req, res) => {
  const { code } = req.params;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Please provide a valid gift voucher claim code.' });
  }

  try {
    const card = await giftCardService.getPublicGiftCard(code);
    return res.json({
      success: true,
      card,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return res.status(status).json({ success: false, message: err.message || 'Error retrieving gift voucher.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/gifting/provider/vouchers (Healthcare Provider Inbox)
   ───────────────────────────────────────────────────────────── */
router.get('/provider/vouchers', requireAuth, requireRole('provider', 'super_admin', 'admin'), async (req, res) => {
  try {
    let providerId = req.query.provider_id || null;

    if (req.user.role === 'provider') {
      const pRes = await pool.query(`SELECT id FROM providers WHERE user_id = $1`, [req.user.id]);
      if (pRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Provider facility profile not found.' });
      }
      providerId = pRes.rows[0].id;
    }

    const { status, search, limit = 50, offset = 0 } = req.query;

    const data = await giftCardService.getProviderVouchers({
      providerId,
      status,
      search,
      limit: parseInt(limit, 10) || 50,
      offset: parseInt(offset, 10) || 0,
    });

    return res.json({
      success: true,
      ...data,
    });
  } catch (err) {
    console.error('[gifting/provider/vouchers] Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve provider service vouchers.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/gifting/check (Public / Safe Preview)
   ───────────────────────────────────────────────────────────── */
router.post('/check', giftCheckLimiter, async (req, res) => {
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
   Supports payment_method: 'direct' | 'wallet' | 'chapa'
   ───────────────────────────────────────────────────────────── */
router.post('/purchase', giftPurchaseLimiter, requireAuth, requireVerifiedEmail, async (req, res) => {
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
  const scheduled_delivery_date = req.body.scheduled_delivery_date || req.body.scheduledDeliveryDate || null;
  const payment_method = (req.body.payment_method || req.body.paymentMethod || 'direct').toLowerCase();
  const metadata = req.body.metadata;

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Please specify a valid gift amount greater than 0.' });
  }

  if (gift_type === 'service' && (!service_title || typeof service_title !== 'string' || !service_title.trim())) {
    return res.status(400).json({ success: false, message: 'Service title is required for service-linked gifts.' });
  }

  // 1. Payment via Digital Wallet Balance
  if (payment_method === 'wallet') {
    try {
      const result = await giftCardService.purchaseGiftCardWithWallet({
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
        scheduledDeliveryDate: scheduled_delivery_date,
        metadata,
      });

      const giftCard = result.giftCard;

      if (recipient_email) {
        const isScheduled = scheduled_delivery_date && new Date(scheduled_delivery_date) > new Date();
        const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
        const claimUrl = `${origin}/gift/claim?code=${encodeURIComponent(giftCard.code)}`;

        await notify('gift.delivered', {
          recipientName: recipient_name,
          recipientEmail: recipient_email,
          senderName: req.user.fullName || req.user.email,
          amount: giftCard.initialAmount,
          personalMessage: personal_message || 'A gift for your healthcare and wellness.',
          actionUrl: claimUrl,
          actionButton: { text: 'Claim Your Gift Card', url: claimUrl },
        }, {
          subjectType: 'gift',
          subjectId: giftCard.id,
          actorUserId: req.user.id,
          runAt: isScheduled ? new Date(scheduled_delivery_date) : new Date(),
        }).catch(err => console.warn('[gifting/purchase:wallet] Notification warning:', err.message));
      }

      try {
        await logAuditEvent({
          userId: req.user.id,
          action: 'GIFT_CARD_PURCHASED_WALLET',
          targetId: giftCard.id,
          details: {
            code: giftCard.code,
            amount: giftCard.initialAmount,
            currency: giftCard.currency,
            occasion: giftCard.occasion,
            packageType: giftCard.packageType,
            recipientEmail: recipient_email,
            scheduledDeliveryDate: scheduled_delivery_date,
            newWalletBalance: result.newWalletBalance,
          },
        });
      } catch (_) {}

      return res.status(201).json({
        success: true,
        message: 'Gift card created and paid via digital wallet.',
        giftCard,
        newWalletBalance: result.newWalletBalance,
        paidViaWallet: true,
      });
    } catch (err) {
      console.error('[gifting/purchase:wallet] Error:', err.message);
      const status = err.statusCode || 400;
      return res.status(status).json({ success: false, message: err.message || 'Failed to purchase gift card via wallet.' });
    }
  }

  // 2. Payment via Chapa Gateway
  if (payment_method === 'chapa') {
    const txRef = `ods-gc-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const cleanCurrency = String(currency || 'ETB').trim().toUpperCase().slice(0, 3);

    try {
      // Pre-create gift card in 'pending_payment' state
      const pendingCard = await giftCardService.purchaseGiftCard({
        senderId: req.user.id,
        amount: numericAmount,
        currency: cleanCurrency,
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
        scheduledDeliveryDate: scheduled_delivery_date,
        status: 'pending_payment',
        metadata: {
          ...(metadata || {}),
          tx_ref: txRef,
          paymentMethod: 'chapa',
        },
      });

      const giftCardDetails = {
        giftCardId: pendingCard.id,
        senderId: req.user.id,
        amount: numericAmount,
        currency: cleanCurrency,
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
        scheduledDeliveryDate: scheduled_delivery_date,
        metadata,
      };

      await pool.query(
        `INSERT INTO transactions (user_id, tx_ref, amount, currency, status, payment_method, purpose, metadata)
         VALUES ($1, $2, $3, $4, 'pending', 'chapa', 'gift_card_purchase', $5)`,
        [req.user.id, txRef, numericAmount, cleanCurrency, JSON.stringify({ giftCardDetails, gift_card_id: pendingCard.id })]
      );

      const nameParts = (req.user.fullName || req.user.full_name || 'ODS Customer').trim().split(' ');
      const firstName = nameParts[0] || 'ODS';
      const lastName = nameParts.slice(1).join(' ') || 'Customer';

      const chapaRes = await chapaService.initializePayment({
        amount: numericAmount,
        currency: cleanCurrency,
        email: req.user.email,
        firstName,
        lastName,
        txRef,
        callbackUrl: `${BACKEND_BASE_URL}/api/payments/webhook/chapa`,
        returnUrl: `${FRONTEND_ORIGIN}/payment/success?tx_ref=${encodeURIComponent(txRef)}`,
      });

      return res.status(200).json({
        success: true,
        paymentRequired: true,
        txRef,
        giftCardId: pendingCard.id,
        checkoutUrl: chapaRes.data?.checkout_url || chapaRes.checkout_url,
        mode: chapaRes.mode,
        message: 'Payment initialized with Chapa gateway.',
      });
    } catch (err) {
      console.error('[gifting/purchase:chapa] Error:', err.message);
      const status = err.statusCode || 500;
      return res.status(status).json({ success: false, message: err.message || 'Failed to initialize payment gateway.' });
    }
  }

  // 3. Direct issuance (Dev / Sandbox / Admin issuance)
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
      scheduledDeliveryDate: scheduled_delivery_date,
      metadata,
    });

    if (recipient_email) {
      const isScheduled = scheduled_delivery_date && new Date(scheduled_delivery_date) > new Date();
      const origin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
      const claimUrl = `${origin}/gift/claim?code=${encodeURIComponent(giftCard.code)}`;

      await notify('gift.delivered', {
        recipientName: recipient_name,
        recipientEmail: recipient_email,
        senderName: req.user.fullName || req.user.email,
        amount: giftCard.initialAmount,
        personalMessage: personal_message || 'A gift for your healthcare and wellness.',
        actionUrl: claimUrl,
        actionButton: { text: 'Claim Your Gift Card', url: claimUrl },
      }, {
        subjectType: 'gift',
        subjectId: giftCard.id,
        actorUserId: req.user.id,
        runAt: isScheduled ? new Date(scheduled_delivery_date) : new Date(),
      }).catch(err => console.warn('[gifting/purchase] Notification warning:', err.message));
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
          scheduledDeliveryDate: scheduled_delivery_date,
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
router.post('/redeem', giftCheckLimiter, requireAuth, requireVerifiedEmail, async (req, res) => {
  const { code } = req.body;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Please enter a gift card claim code.' });
  }

  try {
    const result = await giftCardService.redeemGiftCard({
      rawCode: code,
      userId: req.user.id,
    });

    // Notify sender if sender email exists via Notification Engine
    if (result.giftCard.sender_id) {
      pool.query(`SELECT email, full_name FROM users WHERE id = $1`, [result.giftCard.sender_id])
        .then(async (senderRes) => {
          if (senderRes.rows.length > 0) {
            const sender = senderRes.rows[0];
            await notify('gift.redeemed_notice', {
              senderName: sender.full_name || 'Valued Customer',
              recipientName: req.user.fullName || req.user.email,
              amount: result.redeemedAmount,
            }, {
              subjectType: 'user',
              subjectId: result.giftCard.sender_id,
              actorUserId: req.user.id,
            });
          }
        })
        .catch(err => console.warn('[Gift Redemption Notification Warning]', err.message));
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
