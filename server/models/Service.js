// server/models/Service.js
const { pool } = require("../config/db"); // your mysql2 pool connection

const Service = {
  create: async (data) => {
    const sql = `
      INSERT INTO services 
      (title, description, category, subcategory, price, duration, tags, imageUrl, location, status, providerId, rating, isActive)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      data.title,
      data.description || null,
      data.category,
      data.subcategory || null,
      data.price,
      data.duration || null,
      JSON.stringify(data.tags || []),
      data.imageUrl || null,
      data.location || null,
      data.status || 'pending',
      data.providerId,
      data.rating || 0,
      data.isActive !== undefined ? data.isActive : 1,
    ];
    const [result] = await pool.query(sql, params);
    return { id: result.insertId, ...data };
  },

  findAll: async (filter = {}) => {
    let sql = "SELECT * FROM services WHERE isActive = 1";
    const params = [];

    if (filter.category) {
      sql += " AND category = ?";
      params.push(filter.category);
    }
    if (filter.subcategory) {
      sql += " AND subcategory LIKE ?";
      params.push(`%${filter.subcategory}%`);
    }

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query("SELECT * FROM services WHERE id = ?", [id]);
    return rows[0] || null;
  },

  deleteById: async (id) => {
    const [result] = await pool.query("DELETE FROM services WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  updateStatus: async (id, status) => {
    const [result] = await pool.query(
      "UPDATE services SET status = ? WHERE id = ?",
      [status, id]
    );
    return result.affectedRows > 0;
  },

  getSubcategories: async (category) => {
    const [rows] = await pool.query(
      "SELECT DISTINCT subcategory FROM services WHERE category = ?",
      [category]
    );
    return rows.map(r => r.subcategory).filter(Boolean);
  },
};

module.exports = Service;

