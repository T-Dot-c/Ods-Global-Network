// models/Subscriber.js
const { pool } = require("../config/db");

class Subscriber {
  constructor(data) {
    this.email = data.email;
  }

  // Save new subscriber
  async save() {
    const query = `
      INSERT INTO subscribers (email)
      VALUES (?)
    `;
    try {
      const [result] = await pool.query(query, [this.email]);
      this.id = result.insertId;
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Find a subscriber by email
  static async findOne({ email }) {
    const query = `SELECT * FROM subscribers WHERE email = ?`;
    const [rows] = await pool.query(query, [email]);
    return rows.length ? rows[0] : null;
  }

  // Get all subscribers
  static async getAll() {
    const query = `SELECT * FROM subscribers ORDER BY createdAt DESC`;
    const [rows] = await pool.query(query);
    return rows;
  }
}

module.exports = Subscriber;


