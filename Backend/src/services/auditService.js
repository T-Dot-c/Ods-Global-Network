/**
 * ODS Global Network — Audit Logging Service
 * Records structured authentication and profile modification events.
 */
'use strict';

const pool = require('../db');

/**
 * Logs a security event to the audit_logs table.
 *
 * @param {Object} params
 * @param {string} [params.userId]
 * @param {string} params.action - e.g. 'LOGIN_SUCCESS', 'KYC_APPROVAL', 'COMPLIANCE_RESET'
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 * @param {Object} [params.details]
 * @param {import('pg').PoolClient} [client] - Optional: pass an active pg client to include
 *   this audit entry inside an existing transaction. When omitted, uses the shared pool.
 */
async function logAuditEvent({ userId = null, action, ip = null, userAgent = null, details = {} }, client) {
  const executor = client || pool;
  try {
    await executor.query(
      `INSERT INTO audit_logs (user_id, action, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, ip, (userAgent || '').slice(0, 255), JSON.stringify(details)]
    );
  } catch (err) {
    // Non-blocking when called without a client: audit failure should not crash the primary operation.
    // When called with a client inside a transaction, the error propagates to trigger ROLLBACK.
    if (client) throw err;
    console.error('[auditService] Failed to record audit log:', err.message);
  }
}

module.exports = {
  logAuditEvent,
};
