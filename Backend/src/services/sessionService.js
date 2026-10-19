/**
 * ODS Global Network — Centralized Session Resolution & Invalidation Service
 * Provides database-backed session verification and token version revocation.
 */
'use strict';

const jwt = require('jsonwebtoken');
const pool = require('../db');

// Module-load security guard: server must fail fast if JWT_SECRET is unset
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL SECURITY ERROR] JWT_SECRET is missing. Server must not run without JWT_SECRET.');
  process.exit(1);
}

/**
 * Resolves an ods_session JWT cookie against the database.
 * Verifies signature, validates numeric token_version, checks account active status,
 * matches token_version against current database state, and dynamically resolves
 * effective role (super_admin elevation) and approval_status fresh from DB.
 *
 * Wrapped in try/catch — returns null on ANY error (never throws into callers).
 *
 * @param {string|null|undefined} token - Raw JWT string from cookie
 * @param {import('pg').Pool|import('pg').PoolClient} [poolInstance=pool]
 * @returns {Promise<Object|null>} Resolved user object or null
 */
async function resolveSession(token, poolInstance = pool) {
  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Reject tokens lacking numeric token_version (pre-Batch-5 legacy tokens)
    if (!decoded || typeof decoded.token_version !== 'number' || !decoded.id) {
      return null;
    }

    const query = `
      SELECT 
        u.id, 
        u.email, 
        u.full_name, 
        u.phone,
        u.role, 
        u.is_active, 
        u.is_email_verified, 
        u.token_version, 
        u.last_login_at,
        a.admin_level,
        m.approval_status AS merchant_approval_status,
        p.approval_status AS provider_approval_status
      FROM users u
      LEFT JOIN admins a ON a.user_id = u.id AND u.role = 'admin'
      LEFT JOIN merchants m ON m.user_id = u.id AND u.role = 'merchant'
      LEFT JOIN providers p ON p.user_id = u.id AND u.role = 'provider'
      WHERE u.id = $1;
    `;

    const result = await poolInstance.query(query, [decoded.id]);
    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    // Reject deactivated accounts
    if (row.is_active !== true) {
      return null;
    }

    // Reject stale/revoked sessions where token_version does not match current DB version
    if (row.token_version !== decoded.token_version) {
      return null;
    }

    // Compute effective role (super_admin elevation) fresh from database
    const effectiveRole = (row.role === 'admin' && row.admin_level === 'super_admin')
      ? 'super_admin'
      : row.role;

    // Compute approval status fresh from database
    const approvalStatus = (row.role === 'merchant')
      ? (row.merchant_approval_status || 'pending')
      : (row.role === 'provider')
        ? (row.provider_approval_status || 'pending')
        : 'approved';

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      phone: row.phone,
      role: effectiveRole,
      base_role: row.role,
      is_active: Boolean(row.is_active),
      is_email_verified: Boolean(row.is_email_verified),
      token_version: row.token_version,
      approval_status: approvalStatus,
      last_login_at: row.last_login_at,
    };
  } catch (err) {
    // Log unexpected database/system outages without logging token data
    if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') {
      console.error('[sessionService] Database/system error resolving session:', err.message);
    }
    return null;
  }
}

/**
 * Atomically increments user's token_version in the database, invalidating all
 * existing JWT sessions across devices immediately.
 *
 * @param {string} userId - User UUID
 * @param {import('pg').Pool|import('pg').PoolClient} [client=pool]
 * @returns {Promise<number>} New token_version
 */
async function revokeUserSessions(userId, client = pool) {
  const result = await client.query(
    `UPDATE users 
     SET token_version = token_version + 1, updated_at = NOW() 
     WHERE id = $1 
     RETURNING token_version;`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error(`User not found for session revocation: ${userId}`);
  }

  return result.rows[0].token_version;
}

const COOKIE_MAX_AGE  = parseInt(process.env.COOKIE_MAX_AGE_MS || '86400000', 10);
const COOKIE_SECURE   = process.env.COOKIE_SECURE === 'true';

/**
 * Issues an HttpOnly, SameSite=Lax session cookie containing minimal JWT { id, token_version }
 */
function issueSessionCookie(res, payload) {
  const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1d' });
  res.cookie('ods_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure:   COOKIE_SECURE,
    maxAge:   COOKIE_MAX_AGE,
  });
}

module.exports = {
  resolveSession,
  revokeUserSessions,
  issueSessionCookie,
};
