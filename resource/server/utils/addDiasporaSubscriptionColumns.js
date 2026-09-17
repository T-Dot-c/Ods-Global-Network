// Utility to add subscription columns to diaspora_members table if they don't exist
const { pool } = require("../config/db");

async function addDiasporaSubscriptionColumns() {
  try {
    // Check if columns exist and add them if they don't
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'diaspora_members' 
      AND COLUMN_NAME IN ('plan', 'price', 'cadence')
    `);

    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('plan')) {
      await pool.query(`
        ALTER TABLE diaspora_members 
        ADD COLUMN plan VARCHAR(50) DEFAULT NULL
      `);
      console.log("✅ Added 'plan' column to diaspora_members table");
    }

    if (!existingColumns.includes('price')) {
      await pool.query(`
        ALTER TABLE diaspora_members 
        ADD COLUMN price DECIMAL(10, 2) DEFAULT NULL
      `);
      console.log("✅ Added 'price' column to diaspora_members table");
    }

    if (!existingColumns.includes('cadence')) {
      await pool.query(`
        ALTER TABLE diaspora_members 
        ADD COLUMN cadence VARCHAR(20) DEFAULT NULL
      `);
      console.log("✅ Added 'cadence' column to diaspora_members table");
    }

    console.log("✅ Diaspora subscription columns are ready");
  } catch (error) {
    console.error("❌ Error adding diaspora subscription columns:", error);
    // Don't throw - allow the app to continue even if columns already exist
  }
}

module.exports = addDiasporaSubscriptionColumns;




