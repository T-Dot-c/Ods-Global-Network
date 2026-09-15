// models/DiplomaticCommunity.js
const { pool } = require("../config/db");

class DiplomaticCommunity {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    const [result] = await pool.query(
      `INSERT INTO diplomatic_community 
      (name, email, phone, alternativePhone, whatsapp, telegram, institution, institutionName, suggestion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        this.name,
        this.email,
        this.phone || null,
        this.alternativePhone || null,
        this.whatsapp || null,
        this.telegram || null,
        this.institution || null,
        this.institutionName || null,
        this.suggestion || null,
      ]
    );
    return result.insertId;
  }

  static async getAll() {
    const [rows] = await pool.query(`SELECT * FROM diplomatic_community ORDER BY createdAt DESC`);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(`SELECT * FROM diplomatic_community WHERE id = ?`, [id]);
    if (!rows.length) return null;
    return rows[0];
  }
}

module.exports = DiplomaticCommunity;



