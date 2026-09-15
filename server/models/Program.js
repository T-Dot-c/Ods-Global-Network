// models/Program.js
const { pool } = require("../config/db");

class Program {
  constructor(data) {
    this.title = data.title;
    this.category = data.category;
    this.image = data.image || null;
    this.services = data.services || [];
  }

  // Save new program
  async save() {
    const query = `
      INSERT INTO programs (title, category, image, services)
      VALUES (?, ?, ?, ?)
    `;
    const params = [
      this.title,
      this.category,
      this.image,
      JSON.stringify(this.services), // store array as JSON
    ];

    const [result] = await pool.query(query, params);
    this.id = result.insertId;
    return this;
  }

  // Fetch all programs
  static async getAll() {
    const query = `SELECT * FROM programs ORDER BY createdAt DESC`;
    const [rows] = await pool.query(query);
    return rows.map(row => ({
      ...row,
      services: row.services ? JSON.parse(row.services) : [],
    }));
  }

  // Fetch single program by ID
  static async getById(id) {
    const query = `SELECT * FROM programs WHERE id = ?`;
    const [rows] = await pool.query(query, [id]);
    if (!rows.length) return null;
    const row = rows[0];
    return { ...row, services: row.services ? JSON.parse(row.services) : [] };
  }
}

module.exports = Program;
