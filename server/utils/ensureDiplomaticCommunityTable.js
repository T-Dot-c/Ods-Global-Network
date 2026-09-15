const { pool } = require("../config/db");

async function ensureDiplomaticCommunityTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS diplomatic_community (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        alternativePhone VARCHAR(50),
        whatsapp VARCHAR(50),
        telegram VARCHAR(100),
        institution VARCHAR(100),
        institutionName VARCHAR(255),
        suggestion TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await pool.query(createTableQuery);
    console.log("✅ diplomatic_community table ready!");
  } catch (err) {
    console.error("❌ Error ensuring diplomatic_community table:", err);
    throw err;
  }
}

module.exports = ensureDiplomaticCommunityTable;



