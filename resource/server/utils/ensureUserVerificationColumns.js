const { pool } = require("../config/db");

const ensureUserVerificationColumns = async () => {
  try {
    // Check if isVerified column exists
    const [isVerifiedCol] = await pool.query(
      `SHOW COLUMNS FROM users LIKE 'isVerified'`
    );
    
    if (!isVerifiedCol.length) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN isVerified TINYINT(1) DEFAULT 0`
      );
      console.log("✅ Added isVerified column to users table");
    }

    // Check if verifiedAt column exists
    const [verifiedAtCol] = await pool.query(
      `SHOW COLUMNS FROM users LIKE 'verifiedAt'`
    );
    
    if (!verifiedAtCol.length) {
      await pool.query(
        `ALTER TABLE users ADD COLUMN verifiedAt DATETIME NULL`
      );
      console.log("✅ Added verifiedAt column to users table");
    }
  } catch (err) {
    console.error("❌ Error ensuring user verification columns:", err);
  }
};

module.exports = ensureUserVerificationColumns;


