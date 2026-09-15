// server/models/Service.js
const { pool } = require("../config/db"); // your mysql2 pool connection

class Purchase {
  // Create a new purchase
  static async create(data) {
    const {
      itemType,
      itemId,
      providerId,
      buyerName,
      buyerEmail,
      amount,
      deliveryDate,
      extraInfo,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO purchases 
       (itemType, itemId, providerId, buyerName, buyerEmail, amount, deliveryDate, extraInfo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        itemType,
        itemId,
        providerId,
        buyerName,
        buyerEmail,
        amount,
        deliveryDate || null,
        JSON.stringify(extraInfo || {}),
      ]
    );

    return result.insertId;
  }

  // Find all purchases for a provider
  static async findByProvider(providerId) {
    const [rows] = await pool.query(
      `SELECT * FROM purchases WHERE providerId = ? ORDER BY purchaseDate DESC`,
      [providerId]
    );
    return rows;
  }

  // Find a purchase by ID
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT * FROM purchases WHERE id = ?`,
      [id]
    );
    return rows[0];
  }

  // Update delivery date
  static async updateDeliveryDate(id, deliveryDate) {
    await pool.query(
      `UPDATE purchases SET deliveryDate = ? WHERE id = ?`,
      [deliveryDate, id]
    );
  }

  // Update any field (generic)
  static async update(id, fields) {
    const keys = Object.keys(fields);
    const values = Object.values(fields);

    const setString = keys.map((key) => `${key} = ?`).join(", ");
    await pool.query(`UPDATE purchases SET ${setString} WHERE id = ?`, [...values, id]);
  }
}

module.exports = Purchase;


