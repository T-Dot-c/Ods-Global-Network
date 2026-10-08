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
 * Middleware: Verify ods_session HttpOnly cookie
 */
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.ods_session;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
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

module.exports = {
  requireAuth,
  requireRole,
};
