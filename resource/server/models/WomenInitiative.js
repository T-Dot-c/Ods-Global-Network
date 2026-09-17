const { pool } = require("../config/db");

const createWomenInitiative = async (data) => {
  try {
    const sql = `
      INSERT INTO women_initiatives
      (name, age, email, phone, whatsapp, telegram, location, city, id_or_passport, photo, certificates)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      data.name,
      Number(data.age) || 0,
      data.email,
      data.phone || null,
      data.whatsapp || null,
      data.telegram || null,
      data.location || null,
      data.city || null,
      data.idOrPassport || null,
      data.photo || null,
      data.certificates || null,
    ];

    const [results] = await pool.query(sql, values);
    console.log("✅ Women Initiative created successfully:", results.insertId);
    return results;
  } catch (err) {
    console.error("❌ MySQL insert error:", err.sqlMessage || err.message);
    console.error("❌ Query was:", sql);
    console.error("❌ Values:", values);
    throw err;
  }
};

module.exports = { createWomenInitiative };
