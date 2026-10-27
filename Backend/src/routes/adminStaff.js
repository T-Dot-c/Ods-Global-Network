/**
 * ODS Global Network — Admin Staff Accounts & Platform Settings Router (Batch 10)
 *
 * Provides super-admin management of administrative staff, granular permission groups,
 * typed platform settings store, and read-only notification templates catalog.
 */
'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission, verifyStepUpPassword, resolveAdminPermissions } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');
const { revokeUserSessions } = require('../services/sessionService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/admin/my-permissions
 * Returns resolved permissions and role for the active admin user.
 */
router.get('/my-permissions', async (req, res) => {
  try {
    if (!['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const isSuperAdmin = req.user.role === 'super_admin';
    const permissions = isSuperAdmin ? ['*'] : await resolveAdminPermissions(req.user.id);
    return res.json({
      success: true,
      data: {
        role: req.user.role,
        isSuperAdmin,
        permissions,
      },
    });
  } catch (err) {
    console.error('[adminStaff] Error getting my permissions:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve permissions.' });
  }
});

/**
 * GET /api/admin/staff
 * List all administrative staff accounts, assigned groups, and access state.
 * Permission: admins.manage
 */
router.get('/staff', requirePermission('admins.manage'), async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.role,
        a.admin_level,
        u.is_active,
        u.must_change_password,
        u.created_at,
        u.last_login_at,
        COALESCE(
          json_agg(
            json_build_object('id', g.id, 'name', g.name, 'description', g.description)
          ) FILTER (WHERE g.id IS NOT NULL),
          '[]'::json
        ) AS groups
      FROM users u
      LEFT JOIN admins a ON a.user_id = u.id
      LEFT JOIN admin_user_groups ug ON ug.user_id = u.id
      LEFT JOIN admin_permission_groups g ON g.id = ug.group_id
      WHERE u.role IN ('admin', 'super_admin')
      GROUP BY u.id, u.email, u.full_name, u.phone, u.role, a.admin_level, u.is_active, u.must_change_password, u.created_at, u.last_login_at
      ORDER BY u.created_at ASC;
    `;

    const result = await pool.query(query);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (err) {
    console.error('[adminStaff] Error listing staff:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve staff accounts.' });
  }
});

/**
 * POST /api/admin/staff
 * Provision a new administrative staff account with temporary credentials and assigned groups.
 * Permission: admins.manage (Requires step-up password)
 */
router.post('/staff', requirePermission('admins.manage'), async (req, res) => {
  const {
    email,
    full_name,
    phone,
    role = 'admin',
    admin_level = 'staff', // 'staff', 'super_admin'
    group_ids = [],
    temporary_password,
    current_password,
  } = req.body;

  if (!email || !full_name || !temporary_password) {
    return res.status(400).json({ success: false, message: 'Email, full name, and temporary password are required.' });
  }

  if (temporary_password.length < 8) {
    return res.status(400).json({ success: false, message: 'Temporary password must be at least 8 characters.' });
  }

  // Step-up verification for account provisioning
  const isPasswordValid = await verifyStepUpPassword(req.user.id, current_password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Step-up authentication failed: invalid current password.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check duplicate email
    const dupCheck = await client.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
    if (dupCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'A user with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(temporary_password, 12);
    const dbRole = (admin_level === 'super_admin') ? 'admin' : role;

    // 1. Insert user with must_change_password = true
    const userRes = await client.query(
      `INSERT INTO users (
        email, password_hash, full_name, phone, role, is_active, is_email_verified, must_change_password
      ) VALUES ($1, $2, $3, $4, $5, TRUE, TRUE, TRUE)
      RETURNING id, email, full_name, role, created_at`,
      [cleanEmail, passwordHash, full_name.trim(), phone ? phone.trim() : null, dbRole]
    );

    const newStaffUser = userRes.rows[0];

    // 2. Insert into admins table
    await client.query(
      `INSERT INTO admins (user_id, admin_level) VALUES ($1, $2)`,
      [newStaffUser.id, admin_level]
    );

    // 3. Assign permission groups
    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const gid of group_ids) {
        await client.query(
          `INSERT INTO admin_user_groups (user_id, group_id, assigned_by)
           VALUES ($1, $2, $3)
           ON CONFLICT DO NOTHING`,
          [newStaffUser.id, gid, req.user.id]
        );
      }
    }

    // 4. Atomic audit log
    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'admins.manage',
      action: 'ADMIN_ACCOUNT_CREATE',
      targetType: 'user',
      targetId: newStaffUser.id,
      summary: {
        email: cleanEmail,
        role: dbRole,
        admin_level,
        assigned_groups_count: group_ids.length,
      },
      reason: 'Staff administrator account provisioned',
      req,
    });

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: `Staff account provisioned successfully for ${cleanEmail}. Temporary password must be changed upon first login.`,
      data: newStaffUser,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminStaff] Error provisioning staff account:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to provision staff account.' });
  } finally {
    client.release();
  }
});

/**
 * PUT /api/admin/staff/:id/groups
 * Update assigned permission groups for a staff member.
 * Permission: admins.manage
 */
router.put('/staff/:id/groups', requirePermission('admins.manage'), async (req, res) => {
  const targetUserId = req.params.id;
  const { group_ids = [] } = req.body;

  // Prevent modifying own permissions
  if (targetUserId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Administrators cannot modify their own permission groups.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query('SELECT id, email, role FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    const staffUser = userCheck.rows[0];

    // Clear existing groups and re-assign
    await client.query('DELETE FROM admin_user_groups WHERE user_id = $1', [targetUserId]);

    if (Array.isArray(group_ids) && group_ids.length > 0) {
      for (const gid of group_ids) {
        await client.query(
          `INSERT INTO admin_user_groups (user_id, group_id, assigned_by)
           VALUES ($1, $2, $3)`,
          [targetUserId, gid, req.user.id]
        );
      }
    }

    // Bump token_version to refresh active permissions
    await revokeUserSessions(targetUserId, client);

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'admins.manage',
      action: 'ADMIN_GROUPS_UPDATE',
      targetType: 'user',
      targetId: targetUserId,
      summary: { user_email: staffUser.email, new_group_ids: group_ids },
      reason: 'Staff permission groups updated',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Permission groups for ${staffUser.email} updated successfully.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminStaff] Error updating staff groups:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update permission groups.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/staff/:id/deactivate
 * Deactivate a staff account.
 * Permission: admins.manage
 */
router.post('/staff/:id/deactivate', requirePermission('admins.manage'), async (req, res) => {
  const targetUserId = req.params.id;

  if (targetUserId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Administrators cannot deactivate their own account.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userCheck = await client.query(
      `SELECT u.id, u.email, u.role, a.admin_level 
       FROM users u 
       LEFT JOIN admins a ON a.user_id = u.id 
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Staff user not found.' });
    }

    const staffUser = userCheck.rows[0];

    // Prevent deactivating the last active super admin
    if (staffUser.role === 'super_admin' || staffUser.admin_level === 'super_admin') {
      const countRes = await client.query(
        `SELECT COUNT(*) AS total FROM users u
         LEFT JOIN admins a ON a.user_id = u.id
         WHERE (u.role = 'super_admin' OR a.admin_level = 'super_admin') AND u.is_active = TRUE`
      );
      if (parseInt(countRes.rows[0].total, 10) <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Cannot deactivate the last active Super Administrator.' });
      }
    }

    await client.query(
      `UPDATE users SET is_active = FALSE, token_version = token_version + 1, updated_at = NOW() WHERE id = $1`,
      [targetUserId]
    );

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'admins.manage',
      action: 'ADMIN_DEACTIVATE',
      targetType: 'user',
      targetId: targetUserId,
      summary: { user_email: staffUser.email },
      reason: 'Staff administrator account deactivated',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Staff account ${staffUser.email} has been deactivated.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminStaff] Error deactivating staff:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to deactivate staff account.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/permissions
 * List all available permission groups and permissions.
 */
router.get('/permissions', requirePermission('admins.manage'), async (req, res) => {
  try {
    const groupsRes = await pool.query(`SELECT id, name, description FROM admin_permission_groups ORDER BY name`);
    const permsRes = await pool.query(`SELECT id, key, category, description FROM admin_permissions ORDER BY category, key`);
    const mappingsRes = await pool.query(`SELECT group_id, permission_id FROM admin_group_permissions`);

    return res.json({
      success: true,
      data: {
        groups: groupsRes.rows,
        permissions: permsRes.rows,
        mappings: mappingsRes.rows,
      },
    });
  } catch (err) {
    console.error('[adminStaff] Error listing permissions:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve permissions.' });
  }
});

/**
 * GET /api/admin/settings
 * List all platform settings.
 * Permission: settings.manage
 */
router.get('/settings', requirePermission('settings.manage'), async (req, res) => {
  try {
    const result = await pool.query(`SELECT key, value, value_type, description, updated_at FROM platform_settings ORDER BY key`);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[adminStaff] Error retrieving settings:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve settings.' });
  }
});

/**
 * PUT /api/admin/settings
 * Update platform configuration settings.
 * Permission: settings.manage
 */
router.put('/settings', requirePermission('settings.manage'), async (req, res) => {
  const { settings = [] } = req.body; // Array of { key, value }

  if (!Array.isArray(settings) || settings.length === 0) {
    return res.status(400).json({ success: false, message: 'Settings array is required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const updated = [];
    for (const item of settings) {
      if (!item.key) continue;

      const currentRes = await client.query('SELECT key, value, value_type FROM platform_settings WHERE key = $1', [item.key]);
      if (currentRes.rows.length === 0) continue;

      const current = currentRes.rows[0];
      let val = item.value;

      // Validate based on value_type
      if (current.value_type === 'integer') {
        val = parseInt(val, 10);
        if (isNaN(val)) throw new Error(`Setting '${item.key}' must be a valid integer.`);
      } else if (current.value_type === 'boolean') {
        val = Boolean(val);
      }

      await client.query(
        `UPDATE platform_settings 
         SET value = $1::jsonb, updated_by = $2, updated_at = NOW()
         WHERE key = $3`,
        [JSON.stringify(val), req.user.id, item.key]
      );

      updated.push({ key: item.key, previous_value: current.value, new_value: val });
    }

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'settings.manage',
      action: 'PLATFORM_SETTINGS_UPDATE',
      targetType: 'settings',
      targetId: 'global',
      summary: { changes: updated },
      reason: 'Administrative platform settings modified',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Platform settings updated successfully.',
      data: updated,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminStaff] Error updating settings:', err.message);
    return res.status(400).json({ success: false, message: err.message || 'Failed to update settings.' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/templates
 * Read-only list of active email notification templates (preparing for Batch 11).
 * Permission: settings.manage or support.view
 */
router.get('/templates', requirePermission('users.view'), async (_req, res) => {
  // Read-only catalog of system notification templates
  const templates = [
    { id: 'auth_verification', name: 'Email Address Verification', category: 'auth', description: 'Dispatched on registration with verification link', channels: ['email'] },
    { id: 'auth_password_reset', name: 'Password Reset Request', category: 'auth', description: 'Dispatched on forgot password with one-time reset link', channels: ['email'] },
    { id: 'auth_security_alert', name: 'Security Notice / Password Changed', category: 'auth', description: 'Dispatched when user password or session credentials change', channels: ['email'] },
    { id: 'booking_confirmation', name: 'Appointment Booking Confirmed', category: 'booking', description: 'Sent to customer and provider with appointment details', channels: ['email', 'sms'] },
    { id: 'booking_cancellation', name: 'Appointment Booking Cancelled', category: 'booking', description: 'Sent upon customer or provider cancellation with refund summary', channels: ['email'] },
    { id: 'booking_rescheduled', name: 'Appointment Rescheduled', category: 'booking', description: 'Sent when appointment time slot is modified', channels: ['email'] },
    { id: 'gifting_voucher_delivery', name: 'Digital Gift Voucher Presentation', category: 'gifting', description: 'Sent to gift recipient with digital voucher and QR code', channels: ['email'] },
    { id: 'kyc_decision_notice', name: 'KYC Accreditation Decision', category: 'compliance', description: 'Sent to merchant or provider on approval, rejection, or info request', channels: ['email'] }
  ];

  return res.json({
    success: true,
    data: templates,
  });
});

module.exports = router;
