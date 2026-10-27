/**
 * ODS Global Network — Administrative Audit Logging Service (Batch 10)
 *
 * Provides transactional append-only logging of all administrative actions.
 * Writes must occur within the same database transaction as the state mutation.
 * If the audit log insert fails, the outer transaction rolls back.
 */
'use strict';

const pool = require('../db');

/**
 * Extracts client IP address safely from request headers
 */
function getClientIp(req) {
  if (!req) return null;
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
}

/**
 * Logs an administrative state mutation within an active SQL transaction.
 *
 * @param {import('pg').PoolClient|import('pg').Pool} client - Database client with active transaction
 * @param {Object} params
 * @param {string} params.actorUserId - UUID of the admin performing the action
 * @param {string} params.permissionKey - Permission verified for this action
 * @param {string} params.action - Action identifier (e.g., 'USER_SUSPEND', 'KYC_APPROVE')
 * @param {string} params.targetType - Type of entity modified ('user', 'booking', 'service', etc.)
 * @param {string} params.targetId - ID/reference of the target entity
 * @param {Object} [params.summary={}] - Before/after summary diff or key metadata (never secrets)
 * @param {string} [params.reason=null] - Mandatory or optional administrative reason
 * @param {import('express').Request} [params.req=null] - Express request for IP & User-Agent capture
 */
async function logAdminAction(client, {
  actorUserId,
  permissionKey,
  action,
  targetType,
  targetId,
  summary = {},
  reason = null,
  req = null,
}) {
  const ipAddress = getClientIp(req);
  const userAgent = req?.headers ? req.headers['user-agent'] : null;

  // Sanitize summary to ensure no sensitive fields are logged
  const sanitizedSummary = { ...summary };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'cvv', 'card_number'];
  for (const key of Object.keys(sanitizedSummary)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitizedSummary[key] = '[REDACTED]';
    }
  }

  const query = `
    INSERT INTO admin_audit_log (
      actor_user_id,
      permission_key,
      action,
      target_type,
      target_id,
      summary,
      reason,
      ip_address,
      user_agent
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, created_at;
  `;

  const values = [
    actorUserId,
    permissionKey,
    action,
    targetType,
    String(targetId),
    JSON.stringify(sanitizedSummary),
    reason,
    ipAddress,
    userAgent ? String(userAgent).substring(0, 500) : null,
  ];

  const result = await client.query(query, values);
  return result.rows[0];
}

/**
 * Queries the append-only admin audit log with filters and pagination.
 */
async function queryAdminAuditLogs({
  actorUserId,
  action,
  targetType,
  targetId,
  dateFrom,
  dateTo,
  limit = 50,
  offset = 0,
}) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (actorUserId) {
    conditions.push(`l.actor_user_id = $${idx++}`);
    values.push(actorUserId);
  }
  if (action) {
    conditions.push(`l.action = $${idx++}`);
    values.push(action);
  }
  if (targetType) {
    conditions.push(`l.target_type = $${idx++}`);
    values.push(targetType);
  }
  if (targetId) {
    conditions.push(`l.target_id = $${idx++}`);
    values.push(targetId);
  }
  if (dateFrom) {
    conditions.push(`l.created_at >= $${idx++}`);
    values.push(dateFrom);
  }
  if (dateTo) {
    conditions.push(`l.created_at <= $${idx++}`);
    values.push(dateTo);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) AS total FROM admin_audit_log l ${whereClause};`;
  const countResult = await pool.query(countQuery, values);
  const total = parseInt(countResult.rows[0].total, 10);

  const query = `
    SELECT 
      l.id,
      l.actor_user_id,
      u.full_name AS actor_name,
      u.email AS actor_email,
      u.role AS actor_role,
      l.permission_key,
      l.action,
      l.target_type,
      l.target_id,
      l.summary,
      l.reason,
      l.ip_address,
      l.user_agent,
      l.created_at
    FROM admin_audit_log l
    LEFT JOIN users u ON u.id = l.actor_user_id
    ${whereClause}
    ORDER BY l.created_at DESC
    LIMIT $${idx++} OFFSET $${idx++};
  `;

  values.push(limit, offset);
  const result = await pool.query(query, values);

  return {
    items: result.rows,
    total,
    limit,
    offset,
  };
}

module.exports = {
  logAdminAction,
  queryAdminAuditLogs,
  getClientIp,
};
