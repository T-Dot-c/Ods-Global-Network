/**
 * ODS Global Network — Admin Two-Factor Authentication Routes
 * 
 * Endpoints:
 * - GET  /api/admin/2fa/status  Check if 2FA is active
 * - POST /api/admin/2fa/setup   Generate new secret & recovery codes
 * - POST /api/admin/2fa/enable  Verify initial token & activate 2FA
 * - POST /api/admin/2fa/verify  Validate 2FA code during login/step-up
 * - POST /api/admin/2fa/disable Disable 2FA (requires password + code)
 */
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/adminRbac');
const {
  get2FAStatus,
  setup2FA,
  enable2FA,
  verifyAdminAuth2FA,
} = require('../services/twoFactorService');
const { logAdminAction } = require('../services/adminAuditService');

const router = express.Router();

/**
 * Middleware: ensure actor is an admin.
 */
function requireAdminRole(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Administrative access required.' });
  }
  next();
}

/* ─────────────────────────────────────────────────────────────
   GET /api/admin/2fa/status
   ───────────────────────────────────────────────────────────── */
router.get('/status', requireAuth, requireAdminRole, async (req, res) => {
  try {
    const status = await get2FAStatus(req.user.id);
    return res.json({ success: true, ...status });
  } catch (err) {
    console.error('[Admin2FA status]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve 2FA status.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/2fa/setup
   ───────────────────────────────────────────────────────────── */
router.post('/setup', requireAuth, requireAdminRole, async (req, res) => {
  try {
    const setupData = await setup2FA(req.user.id, req.user.email);
    
    await logAdminAction({
      actorUserId: req.user.id,
      action: '2FA_SETUP_INITIATED',
      targetType: 'user',
      targetId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      secret: setupData.secret,
      otpauthUri: setupData.otpauthUri,
      recoveryCodes: setupData.recoveryCodes,
    });
  } catch (err) {
    console.error('[Admin2FA setup]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to initiate 2FA setup.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/2fa/enable
   ───────────────────────────────────────────────────────────── */
router.post('/enable', requireAuth, requireAdminRole, async (req, res) => {
  const { code } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Verification code is required.' });
  }

  try {
    const enabled = await enable2FA(req.user.id, code.trim());

    if (!enabled) {
      return res.status(400).json({ success: false, message: 'Invalid verification code. Please check your authenticator app.' });
    }

    await logAdminAction({
      actorUserId: req.user.id,
      action: '2FA_ENABLED',
      targetType: 'user',
      targetId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Two-Factor Authentication is now enabled for your administrator account.' });
  } catch (err) {
    console.error('[Admin2FA enable]', err.message);
    return res.status(500).json({ success: false, message: err.message || 'Failed to activate 2FA.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/2fa/verify
   ───────────────────────────────────────────────────────────── */
router.post('/verify', requireAuth, requireAdminRole, async (req, res) => {
  const { code } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ success: false, message: 'Code is required.' });
  }

  try {
    const result = await verifyAdminAuth2FA(req.user.id, code);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.reason || 'Verification failed.' });
    }

    // Set 2FA verified flag in session cookie / response
    res.cookie('ods_admin_2fa', 'verified', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    await logAdminAction({
      actorUserId: req.user.id,
      action: '2FA_VERIFIED',
      targetType: 'user',
      targetId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { method: result.method },
    });

    return res.json({
      success: true,
      message: 'Two-factor verification successful.',
      method: result.method,
      remainingRecoveryCodes: result.remainingRecoveryCodes,
    });
  } catch (err) {
    console.error('[Admin2FA verify]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to verify 2FA code.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/admin/2fa/disable
   ───────────────────────────────────────────────────────────── */
router.post('/disable', requireAuth, requireAdminRole, async (req, res) => {
  const { password, code } = req.body || {};

  if (!password || !code) {
    return res.status(400).json({ success: false, message: 'Password and current 2FA code are required to disable 2FA.' });
  }

  try {
    // 1. Verify password
    const userRes = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const pwMatch = await bcrypt.compare(password, userRes.rows[0].password_hash);
    if (!pwMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password.' });
    }

    // 2. Verify 2FA code
    const result = await verifyAdminAuth2FA(req.user.id, code);
    if (!result.success) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA code.' });
    }

    // 3. Disable in DB
    await pool.query('DELETE FROM admin_2fa_secrets WHERE user_id = $1', [req.user.id]);
    res.clearCookie('ods_admin_2fa');

    await logAdminAction({
      actorUserId: req.user.id,
      action: '2FA_DISABLED',
      targetType: 'user',
      targetId: req.user.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Two-Factor Authentication has been disabled.' });
  } catch (err) {
    console.error('[Admin2FA disable]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to disable 2FA.' });
  }
});

module.exports = router;
