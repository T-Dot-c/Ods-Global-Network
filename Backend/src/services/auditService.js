/**
 * ODS Global Network — Audit Logging Service
 * Records structured authentication and profile modification events.
 */
'use strict';

const pool = require('../db');

/**
 * Logs a security event to the audit_logs table
 * @param {Object} params
 * @param {string} [params.userId]
 * @param {string} params.action - e.g. 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PROFILE_UPDATE'
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 * @param {Object} [params.details]
 */
async function logAuditEvent({ userId = null, action, ip = null, userAgent = null, details = {} }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, ip, (userAgent || '').slice(0, 255), JSON.stringify(details)]
    );
  } catch (err) {
    // Non-blocking: audit log failure should not crash primary transaction, but is logged to stderr
    console.error('[auditService] Failed to record audit log:', err.message);
  }
}

module.exports = {
  logAuditEvent,
};
