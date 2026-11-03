/**
 * ODS Global Network — Chapa Payment Gateway Service
 *
 * Handles payment initialization, status verification, and HMAC webhook signature checks.
 * Supports official Chapa Test API and an offline mock simulator mode for zero-cost,
 * zero-dependency testing.
 */
'use strict';

const crypto = require('crypto');

const CHAPA_API_URL = process.env.CHAPA_API_URL || 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-mock-key';
const CHAPA_WEBHOOK_SECRET = process.env.CHAPA_WEBHOOK_SECRET || 'ods-test-webhook-secret';
const CHAPA_SIMULATOR_MODE = process.env.CHAPA_SIMULATOR_MODE === 'true' ||
  CHAPA_SECRET_KEY.startsWith('CHASECK_TEST-mock') ||
  CHAPA_SECRET_KEY === 'mock';

/**
 * Pure helper: verify HMAC signature of webhook payload
 * Compares incoming signature header with HMAC-SHA256 of raw body buffer
 */
function verifyWebhookSignature(rawBody, signature, secret = CHAPA_WEBHOOK_SECRET) {
  if (!signature || !secret || !rawBody) return false;

  try {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
    const computedHex = crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex');

    const sigBuffer = Buffer.from(String(signature).trim(), 'utf8');
    const expBuffer = Buffer.from(computedHex, 'utf8');

    if (sigBuffer.length !== expBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Pure helper: generate HMAC signature (used for testing and simulator webhooks)
 */
function generateWebhookSignature(rawBody, secret = CHAPA_WEBHOOK_SECRET) {
  const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  return crypto.createHmac('sha256', secret).update(rawBuffer).digest('hex');
}

/**
 * Initialize payment session with Chapa (or simulator)
 */
async function initializePayment({
  amount,
  currency = 'ETB',
  email,
  firstName,
  lastName,
  txRef,
  callbackUrl,
  returnUrl,
  metadata = {},
}) {
  if (!amount || !txRef || !email) {
    throw new Error('amount, txRef, and email are required to initialize payment');
  }

  // 1. Offline Simulator / Mock Mode
  if (CHAPA_SIMULATOR_MODE) {
    const simulatedCheckoutUrl = `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}tx_ref=${encodeURIComponent(txRef)}&status=success`;
    return {
      success: true,
      mode: 'simulator',
      checkout_url: simulatedCheckoutUrl,
      tx_ref: txRef,
    };
  }

  // In sandbox/dev environments, ensure email sent to Chapa has a valid public domain so Chapa's strict validator accepts it
  let chapaEmail = String(email).trim().toLowerCase();
  if (chapaEmail.endsWith('.local') || chapaEmail.endsWith('@ods.net') || chapaEmail.endsWith('@123.com') || chapaEmail.endsWith('@example.com') || chapaEmail.endsWith('.example.com')) {
    chapaEmail = `${chapaEmail.split('@')[0]}@gmail.com`;
  }

  // 2. Live Chapa Test / Production Mode
  const payload = {
    amount: String(amount),
    currency: String(currency || 'ETB').toUpperCase(),
    email: chapaEmail,
    first_name: firstName || 'ODS',
    last_name: lastName || 'Customer',
    tx_ref: txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    'customization[title]': 'ODS Global Network',
    'customization[description]': metadata.purpose || 'ODS Platform Payment',
    meta: metadata,
  };

  try {
    const res = await fetch(`${CHAPA_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.status !== 'success' || !data.data?.checkout_url) {
      let errMsg = 'Payment provider returned an error';
      if (typeof data.message === 'string') {
        errMsg = data.message;
      } else if (data.message && typeof data.message === 'object') {
        const issues = Object.entries(data.message).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
        errMsg = issues || JSON.stringify(data.message);
      }
      const err = new Error(`Chapa error: ${errMsg}`);
      err.providerStatus = res.status;
      throw err;
    }

    return {
      success: true,
      mode: 'live',
      checkout_url: data.data.checkout_url,
      tx_ref: txRef,
    };
  } catch (err) {
    // Sanitize error message to prevent secret key leakage
    if (err.providerStatus) throw err;
    throw new Error(`Payment initialization network failure: ${err.code || 'UNKNOWN_ERROR'}`);
  }
}

/**
 * Verify transaction with Chapa
 */
async function verifyPayment(txRef) {
  if (!txRef) throw new Error('txRef is required');

  if (CHAPA_SIMULATOR_MODE) {
    return {
      status: 'success',
      data: {
        tx_ref: txRef,
        status: 'success',
        reference: `sim-ref-${txRef}`,
      },
    };
  }

  try {
    const res = await fetch(`${CHAPA_API_URL}/transaction/verify/${encodeURIComponent(txRef)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || 'Verification lookup failed');
      err.providerStatus = res.status;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.providerStatus) throw err;
    throw new Error(`Payment verification network failure: ${err.code || 'UNKNOWN_ERROR'}`);
  }
}

module.exports = {
  initializePayment,
  verifyPayment,
  verifyWebhookSignature,
  generateWebhookSignature,
  isSimulatorMode: () => CHAPA_SIMULATOR_MODE,
};
