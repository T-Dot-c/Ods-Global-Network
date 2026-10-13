/**
 * ODS Global Network — Customer Portal Routes
 * Endpoints: GET /profile, PUT /profile, POST /change-password
 */
'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { logAuditEvent } = require('../services/auditService');

/* ── Whitelists ─────────────────────────────────────────────── */
const ALLOWED_LANGUAGES = ['en', 'am'];
const ALLOWED_NOTIFICATION_PREFERENCES = ['email', 'sms', 'both'];

/* ─────────────────────────────────────────────────────────────
   GET /api/customer/profile
   ───────────────────────────────────────────────────────────── */
router.get('/profile', requireAuth, requireRole('customer', 'admin', 'super_admin'), async (req, res) => {
  const userId = req.user.id;

  try {
    const userRes = await pool.query(
      `SELECT id, email, full_name, phone, role, preferred_language, notification_preference, created_at, last_login_at
       FROM users
       WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    const user = userRes.rows[0];

    const addrRes = await pool.query(
      `SELECT country, region_state, city, postal_code, address_line
       FROM addresses
       WHERE entity_type = 'customer' AND entity_id = $1
       LIMIT 1`,
      [userId]
    );

    const address = addrRes.rows[0] || {};

    return res.json({
      success: true,
      profile: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || '',
        role: user.role,
        preferred_language: user.preferred_language || 'en',
        notification_preference: user.notification_preference || 'email',
        country: address.country || '',
        region_state: address.region_state || '',
        city: address.city || '',
        postal_code: address.postal_code || '',
        address_line: address.address_line || '',
        created_at: user.created_at,
        last_login_at: user.last_login_at,
      },
    });
  } catch (err) {
    console.error('[customer GET /profile]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   PUT /api/customer/profile
   ───────────────────────────────────────────────────────────── */
router.put('/profile', requireAuth, requireRole('customer', 'admin', 'super_admin'), async (req, res) => {
  const userId = req.user.id;
  const {
    full_name,
    phone,
    preferred_language,
    notification_preference,
    country,
    region_state,
    city,
    postal_code,
    address_line,
  } = req.body || {};

  // Validation
  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Full name is required.' });
  }

  const trimmedName = full_name.trim();
  if (trimmedName.length > 128) {
    return res.status(400).json({ success: false, message: 'Full name must be 128 characters or fewer.' });
  }

  if (phone !== undefined && phone !== null && phone !== '') {
    if (typeof phone !== 'string' || phone.trim().length > 32) {
      return res.status(400).json({ success: false, message: 'Phone number cannot exceed 32 characters.' });
    }
  }

  const lang = (preferred_language && ALLOWED_LANGUAGES.includes(preferred_language))
    ? preferred_language
    : 'en';

  const notif = (notification_preference && ALLOWED_NOTIFICATION_PREFERENCES.includes(notification_preference))
    ? notification_preference
    : 'email';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Update user record
    const updatedUserRes = await client.query(
      `UPDATE users
       SET full_name = $1,
           phone = $2,
           preferred_language = $3,
           notification_preference = $4,
           updated_at = NOW()
       WHERE id = $5 AND is_active = TRUE
       RETURNING id, email, full_name, phone, role, preferred_language, notification_preference, created_at, last_login_at`,
      [trimmedName, phone ? phone.trim() : null, lang, notif, userId]
    );

    if (updatedUserRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Customer account not found.' });
    }

    // 2. Update-then-insert address record
    const addrCheck = await client.query(
      `SELECT id FROM addresses WHERE entity_type = 'customer' AND entity_id = $1`,
      [userId]
    );

    if (addrCheck.rows.length > 0) {
      await client.query(
        `UPDATE addresses
         SET country = $1,
             region_state = $2,
             city = $3,
             postal_code = $4,
             address_line = $5,
             updated_at = NOW()
         WHERE entity_type = 'customer' AND entity_id = $6`,
        [
          country ? country.trim() : null,
          region_state ? region_state.trim() : null,
          city ? city.trim() : null,
          postal_code ? postal_code.trim() : null,
          address_line ? address_line.trim() : null,
          userId,
        ]
      );
    } else if (country || region_state || city || postal_code || address_line) {
      await client.query(
        `INSERT INTO addresses (entity_type, entity_id, country, region_state, city, postal_code, address_line)
         VALUES ('customer', $1, $2, $3, $4, $5, $6)`,
        [
          userId,
          country ? country.trim() : null,
          region_state ? region_state.trim() : null,
          city ? city.trim() : null,
          postal_code ? postal_code.trim() : null,
          address_line ? address_line.trim() : null,
        ]
      );
    }

    await client.query('COMMIT');

    const updatedUser = updatedUserRes.rows[0];

    // Audit log
    await logAuditEvent({
      userId,
      action: 'PROFILE_UPDATE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { fields: ['full_name', 'phone', 'preferred_language', 'notification_preference', 'address'] },
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully.',
      profile: {
        id: updatedUser.id,
        email: updatedUser.email,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone || '',
        role: updatedUser.role,
        preferred_language: updatedUser.preferred_language,
        notification_preference: updatedUser.notification_preference,
        country: country ? country.trim() : '',
        region_state: region_state ? region_state.trim() : '',
        city: city ? city.trim() : '',
        postal_code: postal_code ? postal_code.trim() : '',
        address_line: address_line ? address_line.trim() : '',
        created_at: updatedUser.created_at,
        last_login_at: updatedUser.last_login_at,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[customer PUT /profile]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  } finally {
    client.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/customer/change-password
   ───────────────────────────────────────────────────────────── */
router.post('/change-password', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { current_password, new_password } = req.body || {};

  if (!current_password || typeof current_password !== 'string' || current_password.length === 0) {
    return res.status(400).json({ success: false, message: 'Current password is required.' });
  }

  if (!new_password || typeof new_password !== 'string') {
    return res.status(400).json({ success: false, message: 'New password is required.' });
  }

  if (new_password.length < 8 || new_password.length > 128) {
    return res.status(400).json({ success: false, message: 'New password must be between 8 and 128 characters.' });
  }

  try {
    const userRes = await pool.query(
      `SELECT id, password_hash FROM users WHERE id = $1 AND is_active = TRUE`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    const user = userRes.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(current_password, user.password_hash);
    if (!isMatch) {
      await logAuditEvent({
        userId,
        action: 'PASSWORD_CHANGE_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { reason: 'incorrect_current_password' },
      });
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    // Hash new password with work factor 12
    const newHash = await bcrypt.hash(new_password, 12);

    await pool.query(
      `UPDATE users
       SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id = $2`,
      [newHash, userId]
    );

    await logAuditEvent({
      userId,
      action: 'PASSWORD_CHANGE',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[customer POST /change-password]', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update password.' });
  }
});

module.exports = router;
