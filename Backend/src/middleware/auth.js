/**
 * ODS Global Network — Auth & RBAC Middleware
 * Provides session verification and server-side role enforcement.
 */
'use strict';

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL SECURITY ERROR] JWT_SECRET is missing. Server must not run without JWT_SECRET.');
  process.exit(1);
}

/**
 * Middleware: Verify ods_session HttpOnly cookie and resolve user state from DB
 */
const { resolveSession } = require('../services/sessionService');

/**
 * Pure helper: Check if user is email-verified or exempt
 * Super_admin and admin roles are exempt per plan.
 * Returns true if exempt or is_email_verified is truthy, false otherwise.
 */
function isVerifiedOrExempt(user) {
  if (!user) return false;
  if (['super_admin', 'admin'].includes(user.role)) {
    return true;
  }
  return Boolean(user.is_email_verified);
}

/**
 * Middleware: Require authenticated session
 */
async function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.ods_session;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  try {
    const user = await resolveSession(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
    }
    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session.' });
  }
}

/**
 * Middleware: Require one or more specific roles
 * @param  {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions.',
      });
    }

    return next();
  };
}

/**
 * Middleware: Require verified email or exempt role
 */
function requireVerifiedEmail(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (!isVerifiedOrExempt(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required to access this resource.',
      code: 'EMAIL_VERIFICATION_REQUIRED',
    });
  }

  return next();
}

module.exports = {
  requireAuth,
  requireRole,
  isVerifiedOrExempt,
  requireVerifiedEmail,
};

