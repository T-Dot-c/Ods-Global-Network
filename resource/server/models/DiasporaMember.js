// models/DiasporaMember.js
const { pool } = require("../config/db");

class DiasporaMember {
  constructor({
    name,
    email,
    phone = null,
    location = null,
    country = null,
    plan = null,    // kept for future use
    price = null,   // kept for future use
    cadence = null, // kept for future use
  }) {
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.location = location;
    this.country = country;
    this.plan = plan;
    this.price = price;
    this.cadence = cadence;
  }

  async save() {
    // Try to save with subscription fields, fallback to basic fields if columns don't exist
    try {
      const [result] = await pool.query(
        `INSERT INTO diaspora_members (name, email, phone, location, country, plan, price, cadence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          this.name,
          this.email,
          this.phone,
          this.location,
          this.country,
          this.plan,
          this.price,
          this.cadence,
        ]
      );
      return result.insertId;
    } catch (error) {
      // If columns don't exist, try without subscription fields
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log("⚠️ Subscription columns not found, saving without plan/price/cadence");
        const [result] = await pool.query(
          `INSERT INTO diaspora_members (name, email, phone, location, country)
           VALUES (?, ?, ?, ?, ?)`,
          [
            this.name,
            this.email,
            this.phone,
            this.location,
            this.country,
          ]
        );
        return result.insertId;
      }
      throw error;
    }
  }

  static async getAll() {
    const [rows] = await pool.query(
      `SELECT * FROM diaspora_members ORDER BY createdAt DESC`
    );
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM diaspora_members WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = DiasporaMember;
