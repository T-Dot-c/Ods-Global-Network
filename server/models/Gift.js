const { pool } = require("../config/db");

const Gift = {
  // Create a new gift
  create: async (data) => {
    const {
      title,
      category,
      occasion,
      receiverType,
      description,
      imageUrl,
      tags,
      isActive,
      senderName,
      recipient_id,
      service_id,
      provider_id,
      code,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO gifts
      (title, category, occasion, receiver_type, description, image_url, tags, is_active,
       sender_name, recipient_id, service_id, provider_id, code, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        category,
        occasion || null,
        receiverType || null,
        description || null,
        imageUrl || null,
        tags ? JSON.stringify(tags) : null,
        isActive !== undefined ? isActive : true,
        senderName || null,
        recipient_id || null,
        service_id || null,
        provider_id,
        code || null,
      ]
    );
    return result.insertId;
  },

  // Find by ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT * FROM gifts WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  // Update gift
  update: async (id, data) => {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      if (key === "tags") params.push(JSON.stringify(value));
      else params.push(value);
    }
    params.push(id);

    await pool.query(
      `UPDATE gifts SET ${fields.join(", ")}, updated_at = NOW() WHERE id = ?`,
      params
    );
  },

  // Delete gift
  delete: async (id) => {
    const [result] = await pool.query(`DELETE FROM gifts WHERE id = ?`, [id]);
    return result.affectedRows;
  },

  // Fetch all gifts
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT g.*, s.title AS service_title, s.category AS service_category 
       FROM gifts g
       LEFT JOIN services s ON g.service_id = s.id
       ORDER BY g.created_at DESC`
    );
    return rows;
  },
};

module.exports = Gift;


