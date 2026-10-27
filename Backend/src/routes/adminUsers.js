/**
 * ODS Global Network — User Administration API (Batch 10)
 *
 * Provides comprehensive staff management of customer, merchant, and provider accounts:
 * - Search, filter, and inspect user profiles and associated entities
 * - Suspend / reactivate accounts with mandatory reasons
 * - Global session invalidation (force sign-out)
 * - Administrative password reset and email verification
 * - Internal administrative notes
 * - Super admin role changes with step-up password verification
 */
'use strict';

const express = require('express');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requirePermission, verifyStepUpPassword } = require('../middleware/adminRbac');
const { logAdminAction } = require('../services/adminAuditService');
const { revokeUserSessions } = require('../services/sessionService');

const router = express.Router();
router.use(requireAuth);

/**
 * GET /api/admin/users
 * Search and filter platform users.
 * Permission: users.view
 */
router.get('/', requirePermission('users.view'), async (req, res) => {
  try {
    const {
      search,
      role,
      status, // 'active', 'suspended'
      is_email_verified,
      date_from,
      date_to,
      page = 1,
      limit = 20,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (search && search.trim()) {
      conditions.push(`(u.email ILIKE $${idx} OR u.full_name ILIKE $${idx} OR u.phone ILIKE $${idx})`);
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (role && role.trim()) {
      conditions.push(`u.role = $${idx++}`);
      values.push(role.trim());
    }

    if (status === 'active') {
      conditions.push(`u.is_active = TRUE`);
    } else if (status === 'suspended') {
      conditions.push(`u.is_active = FALSE`);
    }

    if (is_email_verified !== undefined && is_email_verified !== '') {
      conditions.push(`u.is_email_verified = $${idx++}`);
      values.push(is_email_verified === 'true');
    }

    if (date_from) {
      conditions.push(`u.created_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`u.created_at <= $${idx++}`);
      values.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const countQuery = `SELECT COUNT(*) AS total FROM users u ${whereClause};`;
    const countRes = await pool.query(countQuery, values);
    const total = parseInt(countRes.rows[0].total, 10);

    const query = `
      SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.role,
        u.is_active,
        u.is_email_verified,
        u.created_at,
        u.last_login_at,
        m.approval_status AS merchant_approval_status,
        p.approval_status AS provider_approval_status
      FROM users u
      LEFT JOIN merchants m ON m.user_id = u.id AND u.role = 'merchant'
      LEFT JOIN providers p ON p.user_id = u.id AND u.role = 'provider'
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    values.push(limitNum, offset);
    const result = await pool.query(query, values);

    return res.json({
      success: true,
      data: {
        users: result.rows,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    console.error('[adminUsers] Error fetching users list:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve users.' });
  }
});

/**
 * GET /api/admin/users/:id
 * Retrieve detailed profile and historical associations for a user.
 * Permission: users.view
 */
router.get('/:id', requirePermission('users.view'), async (req, res) => {
  try {
    const userId = req.params.id;

    // 1. Fetch User Record (Strict allowlist - NO password hashes or tokens)
    const userRes = await pool.query(
      `SELECT 
        u.id, u.email, u.full_name, u.phone, u.role, u.is_active, 
        u.is_email_verified, u.token_version, u.created_at, u.updated_at, u.last_login_at,
        a.admin_level,
        m.id AS merchant_id, m.business_name, m.approval_status AS merchant_approval_status,
        p.id AS provider_id, p.provider_name, p.approval_status AS provider_approval_status
       FROM users u
       LEFT JOIN admins a ON a.user_id = u.id AND u.role = 'admin'
       LEFT JOIN merchants m ON m.user_id = u.id AND u.role = 'merchant'
       LEFT JOIN providers p ON p.user_id = u.id AND u.role = 'provider'
       WHERE u.id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = userRes.rows[0];

    // 2. Fetch Internal Admin Notes
    const notesRes = await pool.query(
      `SELECT n.id, n.note, n.created_at, author.full_name AS author_name, author.email AS author_email
       FROM user_admin_notes n
       JOIN users author ON author.id = n.author_user_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC`,
      [userId]
    );

    // 3. Fetch Recent Associated Activity Counters
    let bookingsCount = 0;
    try {
      const bRes = await pool.query(
        `SELECT COUNT(*) AS total FROM bookings WHERE customer_user_id = $1 OR provider_user_id = $1`,
        [userId]
      );
      bookingsCount = parseInt(bRes.rows[0].total, 10);
    } catch {
      // Ignore if table not present in early tests
    }

    let transactionsCount = 0;
    try {
      const tRes = await pool.query(`SELECT COUNT(*) AS total FROM transactions WHERE user_id = $1`, [userId]);
      transactionsCount = parseInt(tRes.rows[0].total, 10);
    } catch {
      // Ignore
    }

    // 4. Fetch Recent Audit Logs involving this user
    const auditRes = await pool.query(
      `SELECT id, action, permission_key, reason, summary, created_at
       FROM admin_audit_log
       WHERE target_type = 'user' AND target_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    return res.json({
      success: true,
      data: {
        user: userData,
        notes: notesRes.rows,
        stats: {
          bookings_count: bookingsCount,
          transactions_count: transactionsCount,
        },
        audit_history: auditRes.rows,
      },
    });
  } catch (err) {
    console.error('[adminUsers] Error fetching user detail:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to retrieve user details.' });
  }
});

/**
 * POST /api/admin/users/:id/suspend
 * Suspend a user account and immediately invalidate all active sessions.
 * Permission: users.suspend
 */
router.post('/:id/suspend', requirePermission('users.suspend'), async (req, res) => {
  const targetUserId = req.params.id;
  const { reason } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'Suspension reason is required.' });
  }

  // Prevent self-suspension
  if (targetUserId === req.user.id) {
    return res.status(400).json({ success: false, message: 'Administrators cannot suspend their own account.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check target existence and role
    const targetCheck = await client.query(
      `SELECT id, role, is_active, full_name, email FROM users WHERE id = $1 FOR UPDATE`,
      [targetUserId]
    );

    if (targetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const targetUser = targetCheck.rows[0];

    // Regular admin cannot suspend a super_admin
    if (targetUser.role === 'super_admin' || (targetUser.role === 'admin' && req.user.role !== 'super_admin')) {
      await client.query('ROLLBACK');
      return res.status(403).json({ success: false, message: 'Cannot suspend a super administrator or peer admin.' });
    }

    // 1. Suspend account and increment token_version for immediate session invalidation
    await client.query(
      `UPDATE users 
       SET is_active = FALSE, token_version = token_version + 1, updated_at = NOW()
       WHERE id = $1`,
      [targetUserId]
    );

    // 2. If provider: auto-unpublish published services
    let unpublishedServicesCount = 0;
    if (targetUser.role === 'provider' || targetUser.role === 'merchant') {
      const unpubRes = await client.query(
        `UPDATE services 
         SET status = 'unpublished', updated_at = NOW()
         WHERE owner_user_id = $1 AND status = 'published'
         RETURNING id`,
        [targetUserId]
      );
      unpublishedServicesCount = unpubRes.rowCount;
    }

    // 3. Log audit event atomically within transaction
    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'users.suspend',
      action: 'USER_SUSPEND',
      targetType: 'user',
      targetId: targetUserId,
      summary: {
        user_email: targetUser.email,
        previous_status: targetUser.is_active ? 'active' : 'inactive',
        services_unpublished: unpublishedServicesCount,
      },
      reason: String(reason).trim(),
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `User ${targetUser.email} suspended successfully. All active sessions terminated.`,
      unpublished_services_count: unpublishedServicesCount,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminUsers] Error suspending user:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to suspend user.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/users/:id/reactivate
 * Reactivate a suspended user account.
 * Permission: users.suspend
 */
router.post('/:id/reactivate', requirePermission('users.suspend'), async (req, res) => {
  const targetUserId = req.params.id;
  const { reason } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetCheck = await client.query(
      `SELECT id, is_active, email FROM users WHERE id = $1 FOR UPDATE`,
      [targetUserId]
    );

    if (targetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const targetUser = targetCheck.rows[0];

    await client.query(
      `UPDATE users SET is_active = TRUE, updated_at = NOW() WHERE id = $1`,
      [targetUserId]
    );

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'users.suspend',
      action: 'USER_REACTIVATE',
      targetType: 'user',
      targetId: targetUserId,
      summary: { user_email: targetUser.email },
      reason: reason ? String(reason).trim() : 'Administrative reactivation',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `User ${targetUser.email} reactivated successfully.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminUsers] Error reactivating user:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to reactivate user.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/users/:id/force-signout
 * Force session invalidation across all devices by bumping token_version.
 * Permission: users.force_signout
 */
router.post('/:id/force-signout', requirePermission('users.force_signout'), async (req, res) => {
  const targetUserId = req.params.id;
  const { reason } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetCheck = await client.query(
      `SELECT id, email, token_version FROM users WHERE id = $1 FOR UPDATE`,
      [targetUserId]
    );

    if (targetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const targetUser = targetCheck.rows[0];
    const newVersion = await revokeUserSessions(targetUserId, client);

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'users.force_signout',
      action: 'USER_FORCE_SIGNOUT',
      targetType: 'user',
      targetId: targetUserId,
      summary: {
        user_email: targetUser.email,
        old_token_version: targetUser.token_version,
        new_token_version: newVersion,
      },
      reason: reason ? String(reason).trim() : 'Administrative force sign-out',
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `All sessions for ${targetUser.email} have been revoked immediately.`,
      token_version: newVersion,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminUsers] Error forcing signout:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to revoke user sessions.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/users/:id/notes
 * Add internal administrative note to a user.
 * Permission: users.notes_add
 */
router.post('/:id/notes', requirePermission('users.notes_add'), async (req, res) => {
  const targetUserId = req.params.id;
  const { note } = req.body;

  if (!note || !String(note).trim()) {
    return res.status(400).json({ success: false, message: 'Note text cannot be empty.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetCheck = await client.query(`SELECT id, email FROM users WHERE id = $1`, [targetUserId]);
    if (targetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const noteRes = await client.query(
      `INSERT INTO user_admin_notes (user_id, author_user_id, note)
       VALUES ($1, $2, $3)
       RETURNING id, note, created_at`,
      [targetUserId, req.user.id, String(note).trim()]
    );

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'users.notes_add',
      action: 'ADD_USER_NOTE',
      targetType: 'user',
      targetId: targetUserId,
      summary: { note_id: noteRes.rows[0].id },
      reason: 'Administrative internal note attached',
      req,
    });

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Internal note saved.',
      data: noteRes.rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminUsers] Error saving note:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to save note.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/users/:id/verify-email
 * Administratively mark user's email as verified.
 * Permission: users.manage
 */
router.post('/:id/verify-email', requirePermission('users.manage'), async (req, res) => {
  const targetUserId = req.params.id;
  const { reason } = req.body;

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'Mandatory reason required to manually verify email.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetCheck = await client.query(
      `SELECT id, email, is_email_verified FROM users WHERE id = $1 FOR UPDATE`,
      [targetUserId]
    );

    if (targetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const targetUser = targetCheck.rows[0];

    await client.query(
      `UPDATE users 
       SET is_email_verified = TRUE, email_verification_token = NULL, updated_at = NOW()
       WHERE id = $1`,
      [targetUserId]
    );

    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'users.manage',
      action: 'ADMIN_VERIFY_EMAIL',
      targetType: 'user',
      targetId: targetUserId,
      summary: { user_email: targetUser.email, previous_verified: targetUser.is_email_verified },
      reason: String(reason).trim(),
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Email for ${targetUser.email} marked as verified.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminUsers] Error marking email verified:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update email verification.' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/users/:id/change-role
 * Change a user's system role. Restricted to super_admin + step-up password.
 * Permission: users.change_role
 */
router.post('/:id/change-role', requirePermission('users.change_role'), async (req, res) => {
  // Enforce super_admin role check
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ success: false, message: 'Changing system roles requires Super Administrator role.' });
  }

  const targetUserId = req.params.id;
  const { new_role, current_password, reason } = req.body;

  const validRoles = ['customer', 'merchant', 'provider', 'admin', 'super_admin'];
  if (!new_role || !validRoles.includes(new_role)) {
    return res.status(400).json({ success: false, message: `Invalid new_role. Must be one of: ${validRoles.join(', ')}` });
  }

  if (!reason || !String(reason).trim()) {
    return res.status(400).json({ success: false, message: 'Reason is required for role modification.' });
  }

  // Step-up authentication
  const isPasswordValid = await verifyStepUpPassword(req.user.id, current_password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Step-up authentication failed: invalid current password.' });
  }

  // Prevent self-demotion
  if (targetUserId === req.user.id && new_role !== 'super_admin') {
    return res.status(400).json({ success: false, message: 'Super administrators cannot demote their own account.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const targetCheck = await client.query(
      `SELECT u.id, u.email, u.role, a.admin_level 
       FROM users u 
       LEFT JOIN admins a ON a.user_id = u.id
       WHERE u.id = $1 FOR UPDATE OF u`,
      [targetUserId]
    );

    if (targetCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    const targetUser = targetCheck.rows[0];

    // Guard: Prevent removing the last super admin
    if ((targetUser.role === 'super_admin' || targetUser.admin_level === 'super_admin') && new_role !== 'super_admin') {
      const superAdminCountRes = await client.query(
        `SELECT COUNT(*) AS total FROM users u
         LEFT JOIN admins a ON a.user_id = u.id
         WHERE (u.role = 'super_admin' OR a.admin_level = 'super_admin') AND u.is_active = TRUE`
      );
      const activeSuperAdmins = parseInt(superAdminCountRes.rows[0].total, 10);
      if (activeSuperAdmins <= 1) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Cannot demote the last active Super Administrator on the platform.',
        });
      }
    }

    // Determine DB role and admin_level
    const dbRole = (new_role === 'super_admin') ? 'admin' : new_role;
    const adminLevel = (new_role === 'super_admin') ? 'super_admin' : 'staff';

    // 1. Update user role and increment token_version for immediate session refresh
    await client.query(
      `UPDATE users 
       SET role = $1, token_version = token_version + 1, updated_at = NOW() 
       WHERE id = $2`,
      [dbRole, targetUserId]
    );

    // 2. Manage admins table entry
    if (new_role === 'admin' || new_role === 'super_admin') {
      await client.query(
        `INSERT INTO admins (user_id, admin_level) 
         VALUES ($1, $2)
         ON CONFLICT (user_id) DO UPDATE SET admin_level = EXCLUDED.admin_level`,
        [targetUserId, adminLevel]
      );
    } else {
      await client.query(`DELETE FROM admins WHERE user_id = $1`, [targetUserId]);
      await client.query(`DELETE FROM admin_user_groups WHERE user_id = $1`, [targetUserId]);
      await client.query(`DELETE FROM admin_user_permissions WHERE user_id = $1`, [targetUserId]);
    }

    // 3. Record audit entry
    await logAdminAction(client, {
      actorUserId: req.user.id,
      permissionKey: 'users.change_role',
      action: 'USER_ROLE_CHANGE',
      targetType: 'user',
      targetId: targetUserId,
      summary: {
        user_email: targetUser.email,
        previous_role: targetUser.role,
        previous_admin_level: targetUser.admin_level,
        new_role,
      },
      reason: String(reason).trim(),
      req,
    });

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: `Role for ${targetUser.email} updated to '${new_role}'. All active sessions refreshed.`,
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[adminUsers] Error changing user role:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update user role.' });
  } finally {
    client.release();
  }
});

module.exports = router;
