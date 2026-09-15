// models/Message.js
const { pool } = require('../config/db');

class Message {
  constructor({ id, conversationId, role, content, createdAt, updatedAt }) {
    this.id = id;
    this.conversationId = conversationId;
    this.role = role;
    this.content = content;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Create a new message
  static async create({ conversationId, role, content }) {
    const [result] = await pool.query(
      'INSERT INTO messages (conversationId, role, content) VALUES (?, ?, ?)',
      [conversationId, role, content]
    );
    return new Message({ id: result.insertId, conversationId, role, content });
  }

  // Find messages by conversationId
  static async findByConversationId(conversationId, limit = 40) {
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC LIMIT ?',
      [conversationId, limit]
    );
    return rows.map(row => new Message(row));
  }
}

module.exports = Message;
