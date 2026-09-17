// models/Conversation.js
const { pool } = require('../config/db');

class Conversation {
  constructor({ id, title, createdAt, updatedAt }) {
    this.id = id;
    this.title = title || 'New chat';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Create a new conversation
  static async create({ title }) {
    const [result] = await pool.query(
      'INSERT INTO conversations (title) VALUES (?)',
      [title || 'New chat']
    );
    return new Conversation({ id: result.insertId, title: title || 'New chat' });
  }

  // Find by ID
  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM conversations WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new Conversation(rows[0]);
  }

  // List conversations
  static async findAll(limit = 50) {
    const [rows] = await pool.query(
      'SELECT * FROM conversations ORDER BY updatedAt DESC LIMIT ?',
      [limit]
    );
    return rows.map(row => new Conversation(row));
  }
}

module.exports = Conversation;
