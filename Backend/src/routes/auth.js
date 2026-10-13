/**
 * ODS Global Network — Auth Routes
 * Endpoints: POST /register  POST /login  GET /me  POST /logout
 *
 * Schema alignment (migrations 001–004):
 *  - users.id               UUID (gen_random_uuid)
 *  - users.locked_until     TIMESTAMPTZ  (not lockout_until)
 *  - users.role             VARCHAR CHECK ('customer','merchant','provider','admin')
 *  - approval_status        lives on merchants / providers tables, NOT users
 *
 * Security decisions (per System Directive):
 *  - Passwords hashed with bcryptjs, 12 rounds
 *  - Session issued as HttpOnly, SameSite=Lax cookie (ods_session)
 *  - NO token in URL or localStorage
 *  - Rate limiting + progressive lockout (5 failures → 15-min lockout)
 */
'use strict';

const router     = require('express').Router();
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const crypto     = require('crypto');
const pool       = require('../db');
const { logAuditEvent } = require('../services/auditService');

const JWT_SECRET      = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL SECURITY ERROR] JWT_SECRET is missing. Server must not run without JWT_SECRET.');
  process.exit(1);
}
const COOKIE_MAX_AGE  = parseInt(process.env.COOKIE_MAX_AGE_MS || '86400000', 10);
const COOKIE_SECURE   = process.env.COOKIE_SECURE === 'true';
const MAX_FAILURES    = 5;
const LOCKOUT_MINUTES = 15;

/* ── RFC 5322 Compliant Email Validation Regex ────────────── */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/* ── Whitelist of Permitted Document Types for Polymorphic Uploads ── */
const ALLOWED_DOCUMENT_TYPES = Object.freeze([
  'registration_certificate',
  'trade_license',
  'tin',
  'accreditation_license',
  'medical_board_certification',
  'institutional_charter',
  'delegation_license'
]);

function isValidDocumentType(type) {
  return typeof type === 'string' && ALLOWED_DOCUMENT_TYPES.includes(type.trim().toLowerCase());
}

/* ─────────────────────────────────────────────────────────────
   Helper — issue session cookie
   ───────────────────────────────────────────────────────────── */
function issueSessionCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('ods_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure:   COOKIE_SECURE,
    maxAge:   COOKIE_MAX_AGE,
  });
}

/* ─────────────────────────────────────────────────────────────
   Helper — verify session cookie from request
   ───────────────────────────────────────────────────────────── */
function verifySession(req) {
  const token = req.cookies && req.cookies.ods_session;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Helper — fetch approval_status for merchant / provider
   Returns null for customer and admin (they don't have it).
   ───────────────────────────────────────────────────────────── */
async function getApprovalStatus(role, userId) {
  if (role === 'merchant') {
    const r = await pool.query(
      'SELECT approval_status FROM merchants WHERE user_id = $1', [userId]
    );
    return r.rows[0]?.approval_status ?? 'pending';
  }
  if (role === 'provider') {
    const r = await pool.query(
      'SELECT approval_status FROM providers WHERE user_id = $1', [userId]
    );
    return r.rows[0]?.approval_status ?? 'pending';
  }
  return 'approved'; // customer / admin
}

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/register
   Creates a user row + role-extension row in one transaction.
   Also creates address and contact_person rows if provided.
   approval_status 'pending' for merchant/provider,
   'approved' for customer.
   ───────────────────────────────────────────────────────────── */
function mapProviderType(type) {
  if (!type) return 'clinic';
  const t = String(type).toLowerCase().replace(/[\s&/_-]+/g, '_');
  if (t.includes('hospital')) return 'hospital';
  if (t.includes('pharmacy')) return 'pharmacy';
  if (t.includes('lab')) return 'laboratory';
  if (t.includes('wellness')) return 'wellness_center';
  if (t.includes('ambulance') || t.includes('emergency')) return 'ambulance';
  if (t.includes('home')) return 'home_care';
  if (t.includes('specialist')) return 'specialist';
  if (t.includes('diagnostic')) return 'diagnostic_center';
  return 'clinic';
}

router.post('/register', async (req, res) => {
  const {
    email, password, full_name, phone, role,
    preferred_language, notification_preference,
    // Merchant & Provider shared / entity fields
    business_name, business_type, category, business_phone, business_email, website, description,
    provider_name, provider_type, service_category, official_phone, official_email,
    services_offered, operating_hours, availability, license_no,
    // Address fields
    country, region_state, city, postal_code, address_line,
    // Contact person fields
    contact_person_name, contact_person_role, contact_person_email, contact_person_phone,
  } = req.body;

  const validRoles = ['customer', 'merchant', 'provider'];
  if (!email || !password || !full_name || !role || typeof email !== 'string' || typeof password !== 'string' || typeof full_name !== 'string') {
    return res.status(400).json({ success: false, message: 'Full name, email, password, and role are required.' });
  }
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role.' });
  }
  const trimmedName = full_name.trim();
  if (trimmedName.length === 0 || trimmedName.length > 128) {
    return res.status(400).json({ success: false, message: 'Full name must be between 1 and 128 characters.' });
  }
  const trimmedEmail = email.toLowerCase().trim();
  if (trimmedEmail.length > 255 || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address (up to 255 characters).' });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
  }
  if (phone && (typeof phone !== 'string' || phone.trim().length > 32)) {
    return res.status(400).json({ success: false, message: 'Phone number cannot exceed 32 characters.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Duplicate email check
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1', [trimmedEmail]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Insert base user row
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, preferred_language, notification_preference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, full_name, phone, role, created_at`,
      [
        trimmedEmail,
        password_hash,
        trimmedName,
        phone ? phone.trim() : null,
        role,
        preferred_language || 'en',
        notification_preference || 'email'
      ]
    );
    const user = userResult.rows[0];

    // Insert role-extension row & related addresses/contact_persons
    if (role === 'merchant') {
      const merchResult = await client.query(
        `INSERT INTO merchants (user_id, business_name, business_type, category, business_phone, business_email, website, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          user.id,
          business_name ? business_name.trim() : full_name.trim(),
          business_type || 'retailer',
          category || 'General',
          business_phone ? business_phone.trim() : (phone || null),
          business_email ? business_email.toLowerCase().trim() : email.toLowerCase().trim(),
          website ? website.trim() : null,
          description ? description.trim() : null,
        ]
      );
      const merchantId = merchResult.rows[0].id;

      // Address record
      if (city || country || address_line) {
        await client.query(
          `INSERT INTO addresses (entity_type, entity_id, country, region_state, city, postal_code, address_line)
           VALUES ('merchant', $1, $2, $3, $4, $5, $6)`,
          [merchantId, country || 'Ethiopia', region_state || null, city || null, postal_code || null, address_line || null]
        );
      }

      // Contact Person record
      if (contact_person_name) {
        await client.query(
          `INSERT INTO contact_persons (entity_type, entity_id, full_name, position_role, email, phone)
           VALUES ('merchant', $1, $2, $3, $4, $5)`,
          [merchantId, contact_person_name.trim(), contact_person_role || 'Representative', contact_person_email || null, contact_person_phone || null]
        );
      }

    } else if (role === 'provider') {
      const normalizedType = mapProviderType(provider_type);
      const provResult = await client.query(
        `INSERT INTO providers (user_id, provider_name, provider_type, service_category, official_phone, official_email, website, description, services_offered, operating_hours, availability, license_no)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING id`,
        [
          user.id,
          provider_name ? provider_name.trim() : full_name.trim(),
          normalizedType,
          service_category || 'Healthcare Services',
          official_phone ? official_phone.trim() : (phone || null),
          official_email ? official_email.toLowerCase().trim() : email.toLowerCase().trim(),
          website ? website.trim() : null,
          description ? description.trim() : null,
          services_offered ? services_offered.trim() : null,
          operating_hours || '24/7 Operations',
          availability || 'Immediate & Scheduled',
          license_no || null,
        ]
      );
      const providerId = provResult.rows[0].id;

      // Address record
      if (city || country || address_line) {
        await client.query(
          `INSERT INTO addresses (entity_type, entity_id, country, region_state, city, postal_code, address_line)
           VALUES ('provider', $1, $2, $3, $4, $5, $6)`,
          [providerId, country || 'Ethiopia', region_state || null, city || null, postal_code || null, address_line || null]
        );
      }

      // Contact Person record
      if (contact_person_name) {
        await client.query(
          `INSERT INTO contact_persons (entity_type, entity_id, full_name, position_role, email, phone)
           VALUES ('provider', $1, $2, $3, $4, $5)`,
          [providerId, contact_person_name.trim(), contact_person_role || 'Primary Contact', contact_person_email || null, contact_person_phone || null]
        );
      }
    } else if (role === 'customer') {
      // Address record for customer if provided at registration
      if (city || country || address_line) {
        await client.query(
          `INSERT INTO addresses (entity_type, entity_id, country, region_state, city, postal_code, address_line)
           VALUES ('customer', $1, $2, $3, $4, $5, $6)`,
          [user.id, country || 'Ethiopia', region_state || null, city || null, postal_code || null, address_line || null]
        );
      }
    }

    await client.query('COMMIT');

    await logAuditEvent({
      userId: user.id,
      action: 'REGISTER_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { role },
    });

    const approval_status = await getApprovalStatus(role, user.id);

    return res.status(201).json({
      success: true,
      user: { ...user, approval_status },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[register]', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  } finally {
    client.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/login
   ───────────────────────────────────────────────────────────── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  // Bounds checking to prevent bcrypt DoS through excessive payload lengths
  if (email.length > 255 || password.length > 128) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, password_hash, full_name, phone, role,
              failed_login_attempts, locked_until, last_login_at
       FROM users
       WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      await logAuditEvent({
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { email: email.toLowerCase(), reason: 'user_not_found' },
      });
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked. Try again in ${remaining} minute${remaining !== 1 ? 's' : ''}.`,
        locked_until: user.locked_until,
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      const newAttempts  = (user.failed_login_attempts || 0) + 1;
      const locked_until = newAttempts >= MAX_FAILURES
        ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

      await pool.query(
        `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
        [newAttempts, locked_until, user.id]
      );

      await logAuditEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        details: { email: user.email, attempts: newAttempts },
      });

      const attemptsLeft = MAX_FAILURES - newAttempts;
      return res.status(401).json({
        success: false,
        message: locked_until
          ? `Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`
          : `Invalid email or password. ${Math.max(0, attemptsLeft)} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before lockout.`,
        attemptsLeft: Math.max(0, attemptsLeft),
      });
    }

    // ── Successful login ──────────────────────────────────────
    await pool.query(
      `UPDATE users
       SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW()
       WHERE id = $1`,
      [user.id]
    );

    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    const approval_status = await getApprovalStatus(user.role, user.id);

    let effectiveRole = user.role;
    if (user.role === 'admin') {
      const adminRow = await pool.query('SELECT admin_level FROM admins WHERE user_id = $1', [user.id]);
      if (adminRow.rows.length > 0 && adminRow.rows[0].admin_level === 'super_admin') {
        effectiveRole = 'super_admin';
      }
    }

    const sessionPayload = {
      id:              user.id,
      email:           user.email,
      role:            effectiveRole,
      full_name:       user.full_name,
      approval_status,
    };

    issueSessionCookie(res, sessionPayload);

    return res.json({ success: true, user: sessionPayload });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/auth/me
   ───────────────────────────────────────────────────────────── */
router.get('/me', async (req, res) => {
  const payload = verifySession(req);
  if (!payload) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  try {
    const result = await pool.query(
      `SELECT id, email, full_name, phone, role, last_login_at
       FROM users WHERE id = $1 AND is_active = TRUE`,
      [payload.id]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    const user = result.rows[0];
    const approval_status = await getApprovalStatus(user.role, user.id);

    let effectiveRole = user.role;
    if (user.role === 'admin') {
      const adminRow = await pool.query('SELECT admin_level FROM admins WHERE user_id = $1', [user.id]);
      if (adminRow.rows.length > 0 && adminRow.rows[0].admin_level === 'super_admin') {
        effectiveRole = 'super_admin';
      }
    }

    return res.json({ success: true, user: { ...user, role: effectiveRole, approval_status } });
  } catch (err) {
    console.error('[me]', err.message);
    return res.status(500).json({ success: false, message: 'Could not retrieve profile.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/logout
   ───────────────────────────────────────────────────────────── */
router.post('/logout', (_req, res) => {
  res.clearCookie('ods_session', {
    httpOnly: true,
    sameSite: 'lax',
    secure:   COOKIE_SECURE,
  });
  return res.json({ success: true, message: 'Logged out successfully.' });
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/forgot-password
   Anti-enumeration: Always returns HTTP 200 with uniform message
   ───────────────────────────────────────────────────────────── */
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  const neutralMessage = 'If an account exists with this email, a reset code has been sent.';

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  const trimmedEmail = email.toLowerCase().trim();
  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  try {
    const userResult = await pool.query(
      `SELECT id, email, is_active FROM users WHERE email = $1`,
      [trimmedEmail]
    );

    // If user does not exist or is inactive, return 200 with neutral message (anti-enumeration)
    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      console.log(`[ODS RECOVERY DEV] ℹ️ Password reset requested for non-existent/inactive email: ${trimmedEmail}`);
      return res.json({ success: true, message: neutralMessage });
    }

    const user = userResult.rows[0];

    // Invalidate existing unused recovery OTPs for this user
    await pool.query(
      `DELETE FROM otp_codes WHERE user_id = $1 AND purpose = 'password_recovery' AND verified_at IS NULL`,
      [user.id]
    );

    // Generate cryptographically secure 6-digit numeric OTP code
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(rawOtp, 10);

    // Insert into otp_codes (15-minute expiration)
    await pool.query(
      `INSERT INTO otp_codes (user_id, code_hash, purpose, expires_at)
       VALUES ($1, $2, 'password_recovery', now() + interval '15 minutes')`,
      [user.id, codeHash]
    );

    // Development terminal logging for local testing
    console.log(`\n=============================================================`);
    console.log(`[ODS RECOVERY DEV] 🔑 PASSWORD RESET CODE FOR ${trimmedEmail}:`);
    console.log(`                    >>> ${rawOtp} <<<`);
    console.log(`                    (Valid for 15 minutes)`);
    console.log(`=============================================================\n`);

    return res.json({ success: true, message: neutralMessage });
  } catch (err) {
    console.error('[forgot-password]', err.message);
    return res.status(500).json({ success: false, message: 'Server error processing request.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/reset-password
   Verifies OTP code and sets new bcrypt password
   ───────────────────────────────────────────────────────────── */
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body || {};

  if (!email || !code || !newPassword || typeof email !== 'string' || typeof code !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ success: false, message: 'Email, code, and new password are required.' });
  }

  const trimmedEmail = email.toLowerCase().trim();
  const trimmedCode = code.trim();

  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ success: false, message: 'Password must be between 8 and 128 characters.' });
  }

  const genericInvalidMessage = 'The recovery code is invalid or has expired. Please check your code or request a new one.';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Find user
    const userRes = await client.query(
      `SELECT id, is_active FROM users WHERE email = $1`,
      [trimmedEmail]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericInvalidMessage });
    }

    const userId = userRes.rows[0].id;

    // 2. Fetch latest active OTP for password recovery
    const otpRes = await client.query(
      `SELECT id, code_hash, expires_at
       FROM otp_codes
       WHERE user_id = $1 AND purpose = 'password_recovery' AND verified_at IS NULL
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (otpRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericInvalidMessage });
    }

    const otpRecord = otpRes.rows[0];

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericInvalidMessage });
    }

    // Verify OTP code
    const isCodeMatch = await bcrypt.compare(trimmedCode, otpRecord.code_hash);
    if (!isCodeMatch) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericInvalidMessage });
    }

    // 3. Hash new password with bcrypt (12 rounds per directive)
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // 4. Update user's password and reset lockout counters
    await client.query(
      `UPDATE users
       SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = now()
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    // 5. Mark OTP code as consumed
    await client.query(
      `UPDATE otp_codes SET verified_at = now() WHERE id = $1`,
      [otpRecord.id]
    );

    await client.query('COMMIT');

    console.log(`[ODS RECOVERY DEV] ✅ Password successfully reset for ${trimmedEmail}`);

    return res.json({ success: true, message: 'Your password has been reset successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[reset-password]', err.message);
    return res.status(500).json({ success: false, message: 'Server error processing reset.' });
  } finally {
    client.release();
  }
});

router.ALLOWED_DOCUMENT_TYPES = ALLOWED_DOCUMENT_TYPES;
router.isValidDocumentType = isValidDocumentType;

module.exports = router;
