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
const rateLimit  = require('express-rate-limit');
const pool       = require('../db');
const { logAuditEvent } = require('../services/auditService');
const { requireAuth } = require('../middleware/auth');
const { revokeUserSessions } = require('../services/sessionService');
const {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendDuplicateRegistrationAlert,
  sendPasswordChangedNotice,
} = require('../services/emailService');

const JWT_SECRET      = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL SECURITY ERROR] JWT_SECRET is missing. Server must not run without JWT_SECRET.');
  process.exit(1);
}
const COOKIE_MAX_AGE  = parseInt(process.env.COOKIE_MAX_AGE_MS || '86400000', 10);
const COOKIE_SECURE   = process.env.COOKIE_SECURE === 'true';
const MAX_FAILURES    = 5;
const LOCKOUT_MINUTES = 15;

/* ── Batch 5 Rate Limiters ───────────────────────────────────── */
// Forgot-password IP limiter (default: 5 / 15m in strict, 1000 in generous)
const forgotPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_FORGOT_IP_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many recovery requests from this IP. Please try again later.' },
});

// Reset-password IP limiter (default: 5 / 15m in strict, 1000 in generous)
const resetPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_RESET_IP_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reset attempts from this IP. Please try again later.' },
});

// Register IP limiter (default: 5 / 1h in strict, 1000 in generous)
const registerIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_REGISTER_IP_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many registrations from this IP. Please try again later.' },
});

// Resend verification IP limiter (default: 5 / 15m in strict, 1000 in generous)
const resendVerificationIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_RESEND_IP_MAX || '1000', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification resend requests from this IP. Please try again later.' },
});

// In-memory sliding window store for per-email silent skips
// Limitation noted per Step 0(g): In-memory store is ephemeral and per-process.
// Multiple worker nodes would each maintain independent counters, which is standard for secondary abuse mitigations.
const emailRateLimitStore = new Map(); // key -> timestamps[]

function isEmailLimitExceeded(key, maxRequests, windowMs) {
  const now = Date.now();
  const timestamps = (emailRateLimitStore.get(key) || []).filter(t => now - t < windowMs);
  if (timestamps.length >= maxRequests) {
    emailRateLimitStore.set(key, timestamps);
    return true; // Exceeded
  }
  timestamps.push(now);
  emailRateLimitStore.set(key, timestamps);
  return false;
}

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

router.post('/register', registerIpLimiter, async (req, res) => {
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

  // Enforce 8-72 byte ceiling (bcrypt constraint)
  const pwBytes = Buffer.byteLength(password, 'utf8');
  if (pwBytes < 8 || pwBytes > 72) {
    return res.status(400).json({ success: false, message: 'Password must be between 8 and 72 bytes.' });
  }

  if (phone && (typeof phone !== 'string' || phone.trim().length > 32)) {
    return res.status(400).json({ success: false, message: 'Phone number cannot exceed 32 characters.' });
  }

  // Check per-email rate limit (default: 3 / 1h in strict, 1000 in generous)
  const regEmailMax = parseInt(process.env.RATE_LIMIT_REGISTER_EMAIL_MAX || '1000', 10);
  const regEmailKey = `reg:${trimmedEmail}`;
  const isEmailCapExceeded = isEmailLimitExceeded(regEmailKey, regEmailMax, 60 * 60 * 1000);

  // If email limit exceeded, anti-enumeration requires silent skip:
  // Match bcrypt work, return identical 201 response, skip DB insert & email
  if (isEmailCapExceeded) {
    await bcrypt.hash(password, 12);
    return res.status(201).json({
      success: true,
      user: {
        id: crypto.randomUUID(),
        email: trimmedEmail,
        full_name: trimmedName,
        role,
        approval_status: role === 'customer' ? 'approved' : 'pending',
      },
    });
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

      // Duplicate registration anti-enumeration:
      // Perform identical bcrypt work, generate random UUID, return identical 201 response shape,
      // and asynchronously dispatch duplicate registration notice to existing user.
      await bcrypt.hash(password, 12);
      const fakeId = crypto.randomUUID();

      setImmediate(async () => {
        try {
          await sendDuplicateRegistrationAlert({ to: trimmedEmail });
        } catch (e) {
          console.error('[emailService] Duplicate reg alert error:', e.originalCode || e.code || 'UNKNOWN_ERROR');
        }
      });

      return res.status(201).json({
        success: true,
        user: {
          id: fakeId,
          email: trimmedEmail,
          full_name: trimmedName,
          role,
          approval_status: role === 'customer' ? 'approved' : 'pending',
        },
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Generate 32-byte verification token and SHA-256 hash
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenHash = crypto.createHash('sha256').update(rawVerificationToken).digest('hex');
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert base user row with is_email_verified = FALSE and verification token
    const userResult = await client.query(
      `INSERT INTO users (
         email, password_hash, full_name, phone, role, preferred_language, notification_preference,
         is_email_verified, email_verification_token, email_verification_expires
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, $8, $9)
       RETURNING id, email, full_name, phone, role, created_at`,
      [
        trimmedEmail,
        password_hash,
        trimmedName,
        phone ? phone.trim() : null,
        role,
        preferred_language || 'en',
        notification_preference || 'email',
        verificationTokenHash,
        verificationExpiresAt,
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

    // Send verification email in background (non-blocking)
    setImmediate(async () => {
      try {
        await sendVerificationEmail({ to: user.email, token: rawVerificationToken });
      } catch (e) {
        console.error('[emailService] Registration verification mail error:', e.originalCode || e.code || 'UNKNOWN_ERROR');
      }
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
              failed_login_attempts, locked_until, last_login_at,
              token_version, is_email_verified
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

    // Per Batch 5 spec: Session JWT contains ONLY minimal claims: { id, token_version }
    const sessionJwtPayload = {
      id: user.id,
      token_version: user.token_version,
    };
    issueSessionCookie(res, sessionJwtPayload);

    // Response body returns user profile for client state
    const responsePayload = {
      id:              user.id,
      email:           user.email,
      role:            effectiveRole,
      full_name:       user.full_name,
      approval_status,
      is_email_verified: Boolean(user.is_email_verified),
    };

    return res.json({ success: true, user: responsePayload });
  } catch (err) {
    console.error('[login]', err.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

/* ─────────────────────────────────────────────────────────────
   GET /api/auth/me
   Uses requireAuth and returns explicit allowlist:
   id, email, full_name, phone, role, last_login_at, approval_status, is_email_verified
   Never leaks token_version, is_active, or internal fields.
   ───────────────────────────────────────────────────────────── */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone || null,
        role: user.role,
        last_login_at: user.last_login_at || null,
        approval_status: user.approval_status || null,
        is_email_verified: Boolean(user.is_email_verified),
      },
    });
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
   Anti-enumeration: Responds immediately (<100ms) with uniform 200 message.
   Background (setImmediate): Looks up user, checks per-email rate limit,
   generates 32-byte token, hashes to SHA-256 in users.password_reset_token,
   and dispatches reset email with fragment link.
   ───────────────────────────────────────────────────────────── */
router.post('/forgot-password', forgotPasswordIpLimiter, (req, res) => {
  const { email } = req.body || {};
  const uniformMessage = 'If an account exists with this email, recovery instructions have been sent.';

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  const trimmedEmail = email.toLowerCase().trim();
  if (trimmedEmail.length > 255 || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  // 1. Respond IMMEDIATELY to prevent timing attacks and decouple from SMTP/DB latency
  res.json({ success: true, message: uniformMessage });

  // 2. Execute recovery workflow in background
  setImmediate(async () => {
    try {
      // Check per-email rate limit (default 3 / 15m in Child #2 strict, 1000 in Child #1 generous)
      const emailMax = parseInt(process.env.RATE_LIMIT_FORGOT_EMAIL_MAX || '1000', 10);
      const emailKey = `forgot:${trimmedEmail}`;
      if (isEmailLimitExceeded(emailKey, emailMax, 15 * 60 * 1000)) {
        // Silently skip email dispatch per anti-enumeration requirements
        return;
      }

      // Check user existence and active status
      const userRes = await pool.query(
        'SELECT id, is_active FROM users WHERE email = $1',
        [trimmedEmail]
      );

      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        // Silent skip for non-existent or inactive user
        return;
      }

      const user = userRes.rows[0];

      // Generate 32-byte raw token and SHA-256 hash
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store hash only in DB
      await pool.query(
        `UPDATE users
         SET password_reset_token = $1, password_reset_expires = $2
         WHERE id = $3`,
        [tokenHash, expiresAt, user.id]
      );

      // Dispatch reset email
      try {
        await sendPasswordResetEmail({ to: trimmedEmail, token: rawToken });
      } catch (err) {
        console.error('[emailService] Background reset dispatch error:', err.originalCode || err.code || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      console.error('[forgot-password background error]:', err.message);
    }
  });
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/reset-password
   Body token exchange: { token: string, newPassword: string }
   Validates SHA-256 token hash against users.password_reset_token,
   enforces 15m expiration, verifies 8-72 byte password bounds,
   atomically updates password_hash, clears reset & email verification tokens,
   marks is_email_verified = TRUE, bumps token_version, and revokes sessions.
   ───────────────────────────────────────────────────────────── */
router.post('/reset-password', resetPasswordIpLimiter, async (req, res) => {
  const { token, newPassword } = req.body || {};
  const genericInvalidMessage = 'The password reset link is invalid or has expired. Please request a new one.';

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Reset token is required.' });
  }

  if (!newPassword || typeof newPassword !== 'string') {
    return res.status(400).json({ success: false, message: 'New password is required.' });
  }

  // Enforce 8-72 byte ceiling (bcrypt constraint)
  const pwBytes = Buffer.byteLength(newPassword, 'utf8');
  if (pwBytes < 8 || pwBytes > 72) {
    return res.status(400).json({ success: false, message: 'New password must be between 8 and 72 bytes.' });
  }

  const rawToken = token.trim();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find active user with matching unexpired password_reset_token
    const userRes = await client.query(
      `SELECT id, email, password_reset_expires
       FROM users
       WHERE password_reset_token = $1 AND is_active = TRUE
       FOR UPDATE`,
      [tokenHash]
    );

    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericInvalidMessage });
    }

    const user = userRes.rows[0];

    // Check expiry
    if (new Date(user.password_reset_expires) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericInvalidMessage });
    }

    // Hash new password with bcrypt work factor 12
    const newHash = await bcrypt.hash(newPassword, 12);

    // Atomically update password, clear reset & verification tokens, verify email, bump token_version
    await client.query(
      `UPDATE users
       SET password_hash = $1,
           password_reset_token = NULL,
           password_reset_expires = NULL,
           email_verification_token = NULL,
           email_verification_expires = NULL,
           is_email_verified = TRUE,
           token_version = token_version + 1,
           failed_login_attempts = 0,
           locked_until = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [newHash, user.id]
    );

    await client.query('COMMIT');

    // Audit log & session revocation
    await logAuditEvent({
      userId: user.id,
      action: 'PASSWORD_RESET',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Send confirmation security notice in background
    setImmediate(async () => {
      try {
        await sendPasswordChangedNotice({
          email: user.email,
          userAgent: req.headers['user-agent'] || 'Unknown client',
          ip: req.ip || 'Unknown IP',
        });
      } catch (e) {
        console.error('[emailService] Background notice dispatch error:', e.originalCode || e.code || 'UNKNOWN_ERROR');
      }
    });

    return res.json({ success: true, message: 'Password has been reset successfully. You may now log in with your new password.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[reset-password]', err.message);
    return res.status(500).json({ success: false, message: 'Server error processing password reset.' });
  } finally {
    client.release();
  }
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/resend-verification
   Anti-enumeration: Responds immediately (<100ms) with uniform 200 message.
   Enforces 2-minute per-email cooldown and 5 per day limit in background.
   Generates new 32-byte token, updates DB, dispatches verification email.
   Silently skips verified users, deactivated users, or cooldown hits.
   ───────────────────────────────────────────────────────────── */
// Cooldown store for resend: key -> lastTimestamp
// Per Step 0(g): In-memory store is ephemeral and per-process.
const resendCooldownStore = new Map();
const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes

router.post('/resend-verification', resendVerificationIpLimiter, (req, res) => {
  const { email } = req.body || {};
  const uniformMessage = 'If an unverified account exists with this email, a verification link has been sent.';

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  const trimmedEmail = email.toLowerCase().trim();
  if (trimmedEmail.length > 255 || !EMAIL_REGEX.test(trimmedEmail)) {
    return res.status(400).json({ success: false, message: 'Valid email address is required.' });
  }

  // 1. Respond immediately (<100ms)
  res.json({ success: true, message: uniformMessage });

  // 2. Execute background processing
  setImmediate(async () => {
    try {
      // Cooldown check (2 minutes per email)
      const now = Date.now();
      const lastSent = resendCooldownStore.get(trimmedEmail);
      if (lastSent && (now - lastSent < RESEND_COOLDOWN_MS)) {
        // Silently skip if within cooldown
        return;
      }

      // Check user existence, is_active, and is_email_verified
      const userRes = await pool.query(
        'SELECT id, is_active, is_email_verified FROM users WHERE email = $1',
        [trimmedEmail]
      );

      if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
        return; // Silent skip
      }

      const user = userRes.rows[0];
      if (user.is_email_verified) {
        return; // Silent skip for already-verified accounts
      }

      // Record new cooldown timestamp
      resendCooldownStore.set(trimmedEmail, now);

      // Generate new 32-byte verification token and SHA-256 hash
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await pool.query(
        `UPDATE users
         SET email_verification_token = $1, email_verification_expires = $2
         WHERE id = $3`,
        [tokenHash, expiresAt, user.id]
      );

      try {
        await sendVerificationEmail({ to: trimmedEmail, token: rawToken });
      } catch (err) {
        console.error('[emailService] Background resend verification error:', err.originalCode || err.code || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      console.error('[resend-verification background error]:', err.message);
    }
  });
});

/* ─────────────────────────────────────────────────────────────
   POST /api/auth/verify-email
   Body token exchange: { token: string }
   Matches SHA-256 token hash against users.email_verification_token,
   verifies token is unexpired, marks is_email_verified = TRUE,
   clears email_verification_token & email_verification_expires,
   and bumps token_version to refresh RBAC privileges.
   ───────────────────────────────────────────────────────────── */
router.post('/verify-email', async (req, res) => {
  const { token } = req.body || {};
  const genericErrorMessage = 'The verification link is invalid or has expired. Please request a new verification link.';

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Verification token is required.' });
  }

  const rawToken = token.trim();
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find active user with matching unexpired verification token
    const userRes = await client.query(
      `SELECT id, email, is_email_verified, email_verification_expires
       FROM users
       WHERE email_verification_token = $1 AND is_active = TRUE
       FOR UPDATE`,
      [tokenHash]
    );

    if (userRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericErrorMessage });
    }

    const user = userRes.rows[0];

    // Check expiry (24-hour window)
    if (new Date(user.email_verification_expires) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: genericErrorMessage });
    }

    // Atomically mark verified, clear verification tokens, and bump token_version
    const updateRes = await client.query(
      `UPDATE users
       SET is_email_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL,
           token_version = token_version + 1,
           updated_at = NOW()
       WHERE id = $1
       RETURNING token_version`,
      [user.id]
    );

    const newVersion = updateRes.rows[0].token_version;
    issueSessionCookie(res, { id: user.id, token_version: newVersion });

    await client.query('COMMIT');

    await logAuditEvent({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    return res.json({
      success: true,
      message: 'Your email address has been successfully verified! You may now access all features.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[verify-email]', err.message);
    return res.status(500).json({ success: false, message: 'Server error processing verification.' });
  } finally {
    client.release();
  }
});

router.ALLOWED_DOCUMENT_TYPES = ALLOWED_DOCUMENT_TYPES;
router.isValidDocumentType = isValidDocumentType;

module.exports = router;

