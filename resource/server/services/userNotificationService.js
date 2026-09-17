const { pool } = require("../config/db");

const NOTIFICATION_TYPES = {
  SERVICE_REQUEST_SUBMITTED_ADMIN: "service_request_submitted_admin",
  SERVICE_REQUEST_SUBMITTED_PROVIDER: "service_request_submitted_provider",
  SERVICE_REQUEST_ACCEPTED_USER: "service_request_accepted_user",
};

let emitToUserFn = () => {};

function setNotificationEmitter(fn) {
  emitToUserFn = typeof fn === "function" ? fn : () => {};
}

async function ensureUserNotificationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(64) NOT NULL,
      is_read TINYINT(1) NOT NULL DEFAULT 0,
      metadata JSON NULL,
      dedupe_key VARCHAR(191) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_dedupe (dedupe_key),
      INDEX idx_user_notifications_user (user_id, created_at),
      CONSTRAINT fk_un_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

function parseMetadata(row) {
  if (!row) return row;
  let meta = row.metadata;
  if (meta && typeof meta === "string") {
    try {
      meta = JSON.parse(meta);
    } catch {
      meta = null;
    }
  }
  return { ...row, metadata: meta };
}

/**
 * Inserts one notification per recipient. dedupeKey must be unique per recipient (include user id).
 * Returns rows with inserted flag for socket fan-out (only emit when inserted).
 */
async function createNotificationsForUsers(recipients, { message, type, metadata, dedupeKeyForUser }) {
  const results = [];
  for (const userId of recipients) {
    if (!userId) continue;
    const dedupeKey = dedupeKeyForUser(userId);
    try {
      const [insertResult] = await pool.query(
        `INSERT INTO user_notifications (user_id, message, type, is_read, metadata, dedupe_key)
         VALUES (?, ?, ?, 0, ?, ?)`,
        [userId, message, type, metadata ? JSON.stringify(metadata) : null, dedupeKey]
      );
      const row = {
        id: insertResult.insertId,
        user_id: userId,
        message,
        type,
        is_read: 0,
        metadata,
        created_at: new Date(),
      };
      results.push({ ...row, inserted: true });
      emitToUserFn(userId, "notification", row);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        const [existing] = await pool.query(
          `SELECT id, user_id, message, type, is_read, metadata, created_at
           FROM user_notifications WHERE dedupe_key = ? LIMIT 1`,
          [dedupeKey]
        );
        results.push({ ...parseMetadata(existing[0]), inserted: false });
        continue;
      }
      throw err;
    }
  }
  return results;
}

async function listForUser(userId, { unreadOnly = false, limit = 50, offset = 0 } = {}) {
  const lim = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const off = Math.max(Number(offset) || 0, 0);
  let sql = `
    SELECT id, user_id, message, type, is_read, metadata, created_at
    FROM user_notifications
    WHERE user_id = ?
  `;
  const params = [userId];
  if (unreadOnly) {
    sql += " AND is_read = 0";
  }
  sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
  params.push(lim, off);
  const [rows] = await pool.query(sql, params);
  return rows.map(parseMetadata);
}

async function markRead(userId, notificationId) {
  const [result] = await pool.query(
    `UPDATE user_notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

async function markAllRead(userId) {
  await pool.query(`UPDATE user_notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [userId]);
}

module.exports = {
  NOTIFICATION_TYPES,
  ensureUserNotificationsTable,
  createNotificationsForUsers,
  listForUser,
  markRead,
  markAllRead,
  setNotificationEmitter,
};
