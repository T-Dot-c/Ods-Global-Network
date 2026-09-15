const { pool } = require("../config/db");

const addOccasionNameColumn = async () => {
  try {
    console.log("🔧 Checking if occasion_name column exists in gift_notifications table...");
    
    // Check if the column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'gift_notifications' 
      AND COLUMN_NAME = 'occasion_name'
    `);
    
    if (columns.length === 0) {
      console.log("📝 Adding occasion_name column to gift_notifications table...");
      await pool.query(`
        ALTER TABLE gift_notifications 
        ADD COLUMN occasion_name VARCHAR(255) NULL 
        AFTER occasion_id
      `);
      console.log("✅ occasion_name column added successfully!");
    } else {
      console.log("✅ occasion_name column already exists!");
    }
    
    // Also check if we need to add provider information columns
    const [providerColumns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'gift_notifications' 
      AND COLUMN_NAME IN ('provider_name', 'service_location')
    `);
    
    const existingProviderColumns = providerColumns.map(col => col.COLUMN_NAME);
    
    if (!existingProviderColumns.includes('provider_name')) {
      console.log("📝 Adding provider_name column...");
      await pool.query(`
        ALTER TABLE gift_notifications 
        ADD COLUMN provider_name VARCHAR(255) NULL
      `);
      console.log("✅ provider_name column added!");
    }
    
    if (!existingProviderColumns.includes('service_location')) {
      console.log("📝 Adding service_location column...");
      await pool.query(`
        ALTER TABLE gift_notifications 
        ADD COLUMN service_location VARCHAR(255) NULL
      `);
      console.log("✅ service_location column added!");
    }
    
    console.log("🎉 Database migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  addOccasionNameColumn()
    .then(() => {
      console.log("✅ Migration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration failed:", error);
      process.exit(1);
    });
}

module.exports = addOccasionNameColumn;
