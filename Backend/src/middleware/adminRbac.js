/**
 * ODS Global Network — Admin RBAC & Granular Permission Middleware (Batch 10)
 *
 * Enforces per-request named permission authorization for administrative routes.
 * Super admin role automatically inherits all permissions.
 * Other admin users inherit permissions from their assigned permission groups
 * and any explicit direct grants/revocations in admin_user_permissions.
 */
'use strict';

const bcrypt = require('bcryptjs');
const pool = require('../db');
const { logAdminAction } = require('../services/adminAuditService');

/**
 * Resolves the active list of granted permission keys for an admin user fresh from the database.
 *
 * @param {string} userId - User UUID
 * @param {import('pg').Pool|import('pg').PoolClient} [client=pool]
 * @returns {Promise<string[]>} Array of permission keys
 */
async function resolveAdminPermissions(userId, client = pool) {
  const query = `
    WITH group_perms AS (
      SELECT DISTINCT p.key
      FROM admin_user_groups ug
      JOIN admin_group_permissions gp ON gp.group_id = ug.group_id
      JOIN admin_permissions p ON p.id = gp.permission_id
      WHERE ug.user_id = $1
    ),
    direct_grants AS (
      SELECT p.key, up.is_granted
      FROM admin_user_permissions up
      JOIN admin_permissions p ON p.id = up.permission_id
      WHERE up.user_id = $1
    )
    SELECT key FROM group_perms
    WHERE key NOT IN (SELECT key FROM direct_grants WHERE is_granted = FALSE)
    UNION
    SELECT key FROM direct_grants WHERE is_granted = TRUE;
  `;

  const result = await client.query(query, [userId]);
  return result.rows.map(r => r.key);
}

/**
 * Middleware factory requiring a specific named permission.
 *
 * @param {string} permissionKey - e.g. 'users.suspend', 'kyc.decide'
 */
function requirePermission(permissionKey) {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Role check: Only admin and super_admin may access admin routes
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'ACCESS_DENIED',
        message: 'Access denied: administrator privileges required.',
      });
    }

    // Super admin inherently holds all permissions
    if (req.user.role === 'super_admin') {
      req.userPermissions = ['*'];
      return next();
    }

    try {
      const permissions = await resolveAdminPermissions(req.user.id);
      req.userPermissions = permissions;

      if (!permissions.includes(permissionKey)) {
        // Log unauthorized attempt to audit log
        try {
          await logAdminAction(pool, {
            actorUserId: req.user.id,
            permissionKey,
            action: 'PERMISSION_DENIED',
            targetType: 'endpoint',
            targetId: req.originalUrl,
            summary: { attemptedPermission: permissionKey, method: req.method },
            reason: 'User lacks required administrative permission',
            req,
          });
        } catch (auditErr) {
          console.error('[adminRbac] Error logging permission denial:', auditErr.message);
        }

        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `Access denied: missing required permission '${permissionKey}'.`,
        });
      }

      return next();
    } catch (err) {
      console.error('[adminRbac] Error resolving permissions:', err.message);
      return res.status(500).json({ success: false, message: 'Internal authorization error.' });
    }
  };
}

/**
 * Validates step-up password re-entry for high-risk operations.
 *
 * @param {string} userId - Admin user UUID
 * @param {string} password - Raw password entered in request
 * @param {import('pg').Pool|import('pg').PoolClient} [client=pool]
 * @returns {Promise<boolean>} True if valid
 */
async function verifyStepUpPassword(userId, password, client = pool) {
  if (!password || typeof password !== 'string') {
    return false;
  }

  const result = await client.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) {
    return false;
  }

  return bcrypt.compare(password, result.rows[0].password_hash);
}

module.exports = {
  resolveAdminPermissions,
  requirePermission,
  verifyStepUpPassword,
};
