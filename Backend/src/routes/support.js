/**
 * Backend/src/routes/support.js
 * 
 * Support Request Endpoint for ODS Global Network
 * Handles public support inquiry submissions with validation, honeypot spam guard,
 * unique 8-hex reference generation with collision retry, and database persistence.
 */
'use strict';

const express = require('express');
const crypto  = require('crypto');
const pool    = require('../db');

const router = express.Router();

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Generates an 8-hex character reference code (e.g., ODS-REQ-A1B2C3D4)
 */
function generateReference() {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ODS-REQ-${hex}`;
}

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message, website } = req.body;

    // ── 1. Honeypot check (bot trap) ─────────────────────────────────
    if (website && String(website).trim().length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SUPPORT] Honeypot triggered. Silently discarded.');
      }
      return res.status(200).json({
        success: true,
        reference: 'ODS-REQ-00000000',
        message: 'Your support request has been received (Reference: ODS-REQ-00000000). For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net.',
      });
    }

    // ── 2. Server-side validation ────────────────────────────────────
    const trimmedName    = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail   = typeof email === 'string' ? email.trim() : '';
    const trimmedSubject = typeof subject === 'string' ? subject.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || trimmedName.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must not exceed 128 characters.',
      });
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required (maximum 255 characters).',
      });
    }

    if (!trimmedSubject || trimmedSubject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject is required and must not exceed 200 characters.',
      });
    }

    if (!trimmedMessage || trimmedMessage.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must not exceed 2000 characters.',
      });
    }

    // ── 3. Database insertion with collision retry ───────────────────
    const maxAttempts = 3;
    let inserted = false;
    let finalReference = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      finalReference = generateReference();
      try {
        await pool.query(
          `INSERT INTO support_requests (reference, name, email, subject, message)
           VALUES ($1, $2, $3, $4, $5)`,
          [finalReference, trimmedName, trimmedEmail, trimmedSubject, trimmedMessage]
        );
        inserted = true;
        break;
      } catch (dbErr) {
        // PostgreSQL unique violation code is 23505
        if (dbErr.code === '23505' && attempt < maxAttempts) {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[SUPPORT] Collision on ${finalReference}, retrying (attempt ${attempt + 1})...`);
          }
          continue;
        }
        throw dbErr;
      }
    }

    if (!inserted) {
      // Fallback timestamp-based reference if extremely unlikely collision loop occurred
      const fallbackHex = crypto.randomBytes(4).toString('hex').toUpperCase();
      finalReference = `ODS-REQ-${Date.now().toString(16).slice(-4).toUpperCase()}${fallbackHex}`;
      await pool.query(
        `INSERT INTO support_requests (reference, name, email, subject, message)
         VALUES ($1, $2, $3, $4, $5)`,
        [finalReference, trimmedName, trimmedEmail, trimmedSubject, trimmedMessage]
      );
    }

    // ── 4. Non-production console logging (reference & type only) ────
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SUPPORT] Type: inquiry | Ref: ${finalReference}`);
    }

    return res.status(200).json({
      success: true,
      reference: finalReference,
      message: `Your support request has been received (Reference: ${finalReference}). For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net.`,
    });
  } catch (error) {
    console.error('[SUPPORT] Error processing request:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process support request. Please try again later.',
    });
  }
});

module.exports = router;
