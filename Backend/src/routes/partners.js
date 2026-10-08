/**
 * Backend/src/routes/partners.js
 * 
 * Partner Intake Endpoint for ODS Global Network
 * Handles partnership, investor, and sponsorship inquiries with validation,
 * honeypot spam protection, and database persistence.
 */
'use strict';

const express = require('express');
const pool    = require('../db');

const router = express.Router();

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const ALLOWED_TYPES = ['investor', 'strategic_partner', 'sponsorship'];

router.post('/', async (req, res) => {
  try {
    const {
      partnership_type,
      name,
      company_name,
      email,
      phone,
      whatsapp,
      sector,
      investment_type,
      enquiry,
      website_url,
    } = req.body;

    // ── 1. Honeypot check (bot trap) ─────────────────────────────────
    if (website_url && String(website_url).trim().length > 0) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[PARTNERS] Honeypot triggered. Silently discarded.');
      }
      return res.status(200).json({
        success: true,
        message: 'Your partnership inquiry has been received. For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net.',
      });
    }

    // ── 2. Server-side validation ────────────────────────────────────
    const type = typeof partnership_type === 'string' ? partnership_type.trim().toLowerCase() : '';
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'A valid partnership type (investor, strategic_partner, or sponsorship) is required.',
      });
    }

    const trimmedName    = typeof name === 'string' ? name.trim() : '';
    const trimmedCompany = typeof company_name === 'string' ? company_name.trim() : '';
    const trimmedEmail   = typeof email === 'string' ? email.trim() : '';
    const trimmedPhone   = typeof phone === 'string' ? phone.trim() : '';
    const trimmedWhatsapp = typeof whatsapp === 'string' ? whatsapp.trim() : null;
    const trimmedSector  = typeof sector === 'string' ? sector.trim() : null;
    const trimmedInvType = typeof investment_type === 'string' ? investment_type.trim() : null;
    const trimmedEnquiry = typeof enquiry === 'string' ? enquiry.trim() : null;

    if (!trimmedName || trimmedName.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Name is required and must not exceed 128 characters.',
      });
    }

    if (!trimmedCompany || trimmedCompany.length > 128) {
      return res.status(400).json({
        success: false,
        message: 'Company name is required and must not exceed 128 characters.',
      });
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 255) {
      return res.status(400).json({
        success: false,
        message: 'A valid email address is required (maximum 255 characters).',
      });
    }

    if (!trimmedPhone || trimmedPhone.length < 5 || trimmedPhone.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'A valid phone number (5 to 50 characters) is required.',
      });
    }

    if (trimmedWhatsapp && (trimmedWhatsapp.length < 5 || trimmedWhatsapp.length > 50)) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp number must be between 5 and 50 characters if provided.',
      });
    }

    if (trimmedSector && trimmedSector.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Sector must not exceed 100 characters.',
      });
    }

    if (trimmedInvType && trimmedInvType.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Investment type must not exceed 100 characters.',
      });
    }

    if (trimmedEnquiry && trimmedEnquiry.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Enquiry must not exceed 2000 characters.',
      });
    }

    // ── 3. Database insertion ────────────────────────────────────────
    await pool.query(
      `INSERT INTO partners (
        partnership_type, name, company_name, email, phone, whatsapp, sector, investment_type, enquiry
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        type,
        trimmedName,
        trimmedCompany,
        trimmedEmail,
        trimmedPhone,
        trimmedWhatsapp || null,
        trimmedSector || null,
        trimmedInvType || null,
        trimmedEnquiry || null,
      ]
    );

    // ── 4. Non-production console logging (type only) ────────────────
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PARTNERS] Type: ${type}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Your partnership inquiry has been received. For urgent matters, please contact us at +251 960 606 042 or info@odsglobal.net.',
    });
  } catch (error) {
    console.error('[PARTNERS] Error processing request:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to process partnership inquiry. Please try again later.',
    });
  }
});

module.exports = router;
