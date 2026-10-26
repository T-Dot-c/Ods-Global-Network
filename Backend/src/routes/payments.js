/**
 * ODS Global Network — Payments Router (Batch 6)
 *
 * Implements:
 * 1. POST /api/payments/initialize (Customer initiates payment session)
 * 2. POST /api/payments/webhook/chapa (Public webhook with cryptographic HMAC verification & idempotency)
 * 3. GET  /api/payments/verify/:txRef (Verify transaction status)
 * 4. GET  /api/payments/receipt/:txRef (Itemized payment receipt)
 * 5. GET  /api/payments/history (Authenticated user transaction history)
 */
'use strict';

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const pool = require('../db');
const { requireAuth, requireVerifiedEmail } = require('../middleware/auth');
const chapaService = require('../services/chapaService');
const { sendPaymentReceiptEmail } = require('../services/emailService');
const giftCardService = require('../services/giftCardService');

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// Rate limiter for payment initialization (default 30/hour per user or IP)
const initLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment initialization requests — please slow down.' },
});

/**
 * Helper: write audit log entry
 */
async function recordAuditLog(userId, action, req, details = {}) {
  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null;
    const ua = (req.headers['user-agent'] || '').slice(0, 255);
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId || null, action, ip, ua, JSON.stringify(details)]
    );
  } catch (err) {
    // Non-blocking logging failure
  }
}

/**
 * 1. POST /api/payments/initialize
 * Requires authenticated user with verified email
 */
router.post('/initialize', requireAuth, requireVerifiedEmail, initLimiter, async (req, res) => {
  const { amount, currency = 'ETB', purpose = 'general_payment', paymentMethod = 'chapa', metadata = {} } = req.body;

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
  }

  if (parsedAmount > 10000000) {
    return res.status(400).json({ success: false, message: 'Amount exceeds maximum allowable transaction limit.' });
  }

  const cleanCurrency = String(currency || 'ETB').trim().toUpperCase().slice(0, 3);
  const cleanPurpose = String(purpose || 'general_payment').trim().slice(0, 50);
  const cleanMethod = String(paymentMethod || 'chapa').trim().slice(0, 30);

  // Generate unique ODS transaction reference
  const txRef = `ods-tx-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

  const client = await pool.connect();
  try {
    // Record pending transaction in database
    const insertRes = await client.query(
      `INSERT INTO transactions (user_id, tx_ref, amount, currency, status, payment_method, purpose, metadata)
       VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
       RETURNING id, tx_ref, amount, currency, status, created_at`,
      [req.user.id, txRef, parsedAmount, cleanCurrency, cleanMethod, cleanPurpose, JSON.stringify(metadata)]
    );

    const transaction = insertRes.rows[0];

    const callbackUrl = `${BACKEND_BASE_URL}/api/payments/webhook/chapa`;
    const returnUrl = `${FRONTEND_ORIGIN}/payment/success?tx_ref=${encodeURIComponent(txRef)}`;

    // Initialize with Chapa / Simulator
    const nameParts = (req.user.full_name || 'ODS Customer').trim().split(' ');
    const firstName = nameParts[0] || 'ODS';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    const chapaRes = await chapaService.initializePayment({
      amount: parsedAmount,
      currency: cleanCurrency,
      email: req.user.email,
      firstName,
      lastName,
      txRef,
      callbackUrl,
      returnUrl,
      metadata: {
        userId: req.user.id,
        purpose: cleanPurpose,
        ...metadata,
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
    console.error('[Payment init failure]:', err.message);
    return res.status(err.providerStatus || 500).json({
      success: false,
      message: err.message || 'Failed to initiate payment session. Please try again.',
    });
  } finally {
    client.release();
  }
});

/**
 * 2. POST /api/payments/webhook/chapa
 * Public webhook endpoint — authenticated strictly via HMAC signature
 */
router.post('/webhook/chapa', async (req, res) => {
  const signature = req.headers['x-chapa-signature'] || req.headers['chapa-signature'];

  if (!signature || !req.rawBody) {
    return res.status(401).json({ success: false, message: 'Missing or empty webhook signature payload.' });
  }

  // Cryptographic constant-time HMAC check
  const isValid = chapaService.verifyWebhookSignature(req.rawBody, signature);
  if (!isValid) {
    return res.status(401).json({ success: false, message: 'Invalid cryptographic webhook signature.' });
  }

  // Extract webhook payload attributes (supporting both top-level and data-wrapped schemas)
  const body = req.body || {};
  const txRef = body.tx_ref || body.data?.tx_ref;
  const rawStatus = (body.status || body.data?.status || '').toLowerCase();
  const chapaReference = body.reference || body.data?.reference || null;

  if (!txRef) {
    return res.status(400).json({ success: false, message: 'Missing tx_ref in webhook body.' });
  }

  // Fast acknowledgment: Payment gateway expects quick 200 ACK
  if (rawStatus !== 'success') {
    // Record failure or cancellation if pending
    if (['failed', 'cancelled'].includes(rawStatus)) {
      try {
        await pool.query(
          `UPDATE transactions
           SET status = $1, chapa_reference = $2, updated_at = NOW()
           WHERE tx_ref = $3 AND status = 'pending'`,
          [rawStatus, chapaReference, txRef]
        );
      } catch (_) {}
    }
    return res.status(200).json({ success: true, message: 'Webhook non-success acknowledged.' });
  }

  // Idempotent Atomic State Transition:
  // ONLY updates if status is currently 'pending'. If replayed, 0 rows will be updated.
  try {
    const updateRes = await pool.query(
      `UPDATE transactions
       SET status = 'completed', chapa_reference = $1, completed_at = NOW(), updated_at = NOW()
       WHERE tx_ref = $2 AND status = 'pending'
       RETURNING *`,
      [chapaReference, txRef]
    );

    // If exactly 1 row updated: this is the first execution (not a replay)
    if (updateRes.rows.length === 1) {
      const tx = updateRes.rows[0];

      // Retrieve user info for receipt email
      const userRes = await pool.query(
        `SELECT email, full_name FROM users WHERE id = $1`,
        [tx.user_id]
      );

      const user = userRes.rows[0];
      if (user && user.email) {
        // Dispatch receipt email non-blocking in background
        setImmediate(async () => {
          try {
            await sendPaymentReceiptEmail({
              to: user.email,
              fullName: user.full_name,
              txRef: tx.tx_ref,
              amount: tx.amount,
              currency: tx.currency,
              purpose: tx.purpose,
              date: tx.completed_at || tx.created_at,
            });
          } catch (_) {}
        });
      }

      // Record audit log entry
      await recordAuditLog(tx.user_id, 'PAYMENT_COMPLETED', req, {
        tx_ref: tx.tx_ref,
        amount: tx.amount,
        currency: tx.currency,
        reference: chapaReference,
      });

      // If this transaction was for a gift card purchase, finalize and issue the card
      if (tx.purpose === 'gift_card_purchase' && tx.metadata?.giftCardDetails) {
        setImmediate(async () => {
          try {
            await giftCardService.finalizePaidGiftCard(tx);
          } catch (gcErr) {
            console.error('[webhook/chapa] finalizePaidGiftCard error:', gcErr.message);
          }
        });
      }

      // If this transaction was for a booking payment, confirm the booking
      if (tx.purpose === 'booking_payment' && tx.metadata?.booking_id) {
        setImmediate(async () => {
          try {
            const bookingService = require('../services/bookingService');
            await bookingService.confirmPaidBooking(tx);
          } catch (bErr) {
            console.error('[webhook/chapa] confirmPaidBooking error:', bErr.message);
          }
        });
      }
    }

    // Always return HTTP 200 to acknowledge webhook
    return res.status(200).json({ success: true, message: 'Webhook processed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Database error processing webhook.' });
  }
});

/**
 * 3. GET /api/payments/verify/:txRef
 * Verify payment status for authenticated user
 */
router.get('/verify/:txRef', requireAuth, async (req, res) => {
  const { txRef } = req.params;

  try {
    const txRes = await pool.query(
      `SELECT * FROM transactions WHERE tx_ref = $1`,
      [txRef]
    );

    if (txRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    let tx = txRes.rows[0];

    // Cross-tenant IDOR protection: only owner or admin can view
    const isOwner = req.user.id === tx.user_id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to transaction.' });
    }

    // Fallback gateway verification if transaction is still pending
    if (tx.status === 'pending') {
      try {
        const verifyResult = await chapaService.verifyPayment(txRef);
        if (verifyResult && (verifyResult.status === 'success' || verifyResult.data?.status === 'success')) {
          const chapaRef = verifyResult.data?.reference || `ref-${txRef}`;
          const updateRes = await pool.query(
            `UPDATE transactions
             SET status = 'completed', chapa_reference = $1, completed_at = NOW(), updated_at = NOW()
             WHERE tx_ref = $2 AND status = 'pending'
             RETURNING *`,
            [chapaRef, txRef]
          );

          if (updateRes.rows.length > 0) {
            tx = updateRes.rows[0];

            if (req.user && req.user.email) {
              setImmediate(async () => {
                try {
                  await sendPaymentReceiptEmail({
                    to: req.user.email,
                    fullName: req.user.full_name || 'Customer',
                    txRef: tx.tx_ref,
                    amount: tx.amount,
                    currency: tx.currency,
                    purpose: tx.purpose,
                    date: tx.completed_at || new Date(),
                  });
                } catch (_) {}
              });
            }

            await recordAuditLog(tx.user_id, 'PAYMENT_COMPLETED', req, {
              tx_ref: tx.tx_ref,
              amount: tx.amount,
              currency: tx.currency,
              reference: chapaRef,
              verified_via: 'gateway_lookup',
            });

            // If this transaction was for a gift card purchase, finalize and issue the card
            if (tx.purpose === 'gift_card_purchase' && tx.metadata?.giftCardDetails) {
              try {
                await giftCardService.finalizePaidGiftCard(tx);
              } catch (gcErr) {
                console.error('[payments/verify] finalizePaidGiftCard error:', gcErr.message);
              }
            }

            // If this transaction was for a booking payment, confirm the booking
            if (tx.purpose === 'booking_payment' && tx.metadata?.booking_id) {
              try {
                const bookingService = require('../services/bookingService');
                await bookingService.confirmPaidBooking(tx);
              } catch (bErr) {
                console.error('[payments/verify] confirmPaidBooking error:', bErr.message);
              }
            }
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      transaction: tx,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to verify transaction.' });
  }
});

/**
 * 4. GET /api/payments/receipt/:txRef
 * Returns itemized receipt data for completed transaction
 */
router.get('/receipt/:txRef', requireAuth, async (req, res) => {
  const { txRef } = req.params;

  try {
    const receiptRes = await pool.query(
      `SELECT t.*, u.email as user_email, u.full_name as user_name
       FROM transactions t
       JOIN users u ON u.id = t.user_id
       WHERE t.tx_ref = $1`,
      [txRef]
    );

    if (receiptRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found.' });
    }

    let tx = receiptRes.rows[0];

    // Cross-tenant IDOR guard
    const isOwner = req.user.id === tx.user_id;
    const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied to receipt.' });
    }

    // Fallback gateway verification if transaction is still pending
    if (tx.status === 'pending') {
      try {
        const verifyResult = await chapaService.verifyPayment(txRef);
        if (verifyResult && (verifyResult.status === 'success' || verifyResult.data?.status === 'success')) {
          const chapaRef = verifyResult.data?.reference || `ref-${txRef}`;
          const updateRes = await pool.query(
            `UPDATE transactions
             SET status = 'completed', chapa_reference = $1, completed_at = NOW(), updated_at = NOW()
             WHERE tx_ref = $2 AND status = 'pending'
             RETURNING *`,
            [chapaRef, txRef]
          );

          if (updateRes.rows.length > 0) {
            tx = { ...tx, ...updateRes.rows[0] };

            const userEmail = tx.user_email || req.user.email;
            const userName = tx.user_name || req.user.full_name;
            if (userEmail) {
              setImmediate(async () => {
                try {
                  await sendPaymentReceiptEmail({
                    to: userEmail,
                    fullName: userName,
                    txRef: tx.tx_ref,
                    amount: tx.amount,
                    currency: tx.currency,
                    purpose: tx.purpose,
                    date: tx.completed_at || new Date(),
                  });
                } catch (_) {}
              });
            }

            await recordAuditLog(tx.user_id, 'PAYMENT_COMPLETED', req, {
              tx_ref: tx.tx_ref,
              amount: tx.amount,
              currency: tx.currency,
              reference: chapaRef,
              verified_via: 'gateway_lookup',
            });
          }
        }
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      receipt: {
        tx_ref: tx.tx_ref,
        reference: tx.chapa_reference || tx.tx_ref,
        amount: parseFloat(tx.amount),
        currency: tx.currency,
        status: tx.status,
        payment_method: tx.payment_method,
        purpose: tx.purpose,
        customer_name: tx.user_name || 'Customer',
        customer_email: tx.user_email,
        created_at: tx.created_at,
        completed_at: tx.completed_at,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve receipt.' });
  }
});

/**
 * 5. GET /api/payments/history (or GET /api/customer/payments)
 * Returns recent transaction history for authenticated user
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const historyRes = await pool.query(
      `SELECT id, tx_ref, amount, currency, status, payment_method, purpose, created_at, completed_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      transactions: historyRes.rows,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve transaction history.' });
  }
});

module.exports = router;
