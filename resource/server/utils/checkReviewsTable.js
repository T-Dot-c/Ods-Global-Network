// server/utils/checkReviewsTable.js
// Utility to check if reviews table exists and create it if needed
const { pool } = require("../config/db");

async function checkAndCreateReviewsTable() {
  try {
    console.log("🔍 Checking if reviews table exists...");
    
    // Check if reviews table exists
    const [tables] = await pool.query(
      `SELECT TABLE_NAME 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'reviews'`
    );

    if (tables.length === 0) {
      console.log("⚠️ Reviews table does not exist. Creating it now...");
      
      // Create reviews table
      await pool.query(`
        CREATE TABLE reviews (
          id INT AUTO_INCREMENT PRIMARY KEY,
          serviceId INT NOT NULL,
          userId INT NULL,
          userName VARCHAR(255) NOT NULL,
          userEmail VARCHAR(255) NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT NULL,
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_serviceId (serviceId),
          INDEX idx_userId (userId),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE CASCADE,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      
      console.log("✅ Reviews table created successfully!");
    } else {
      console.log("✅ Reviews table already exists");
    }

    // Check if rating and reviewCount columns exist in services table
    const [ratingCol] = await pool.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'services' 
       AND COLUMN_NAME = 'rating'`
    );

    const [reviewCountCol] = await pool.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'services' 
       AND COLUMN_NAME = 'reviewCount'`
    );

    if (ratingCol.length === 0) {
      console.log("⚠️ Adding rating column to services table...");
      await pool.query(`ALTER TABLE services ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00`);
      console.log("✅ Rating column added");
    }

    if (reviewCountCol.length === 0) {
      console.log("⚠️ Adding reviewCount column to services table...");
      await pool.query(`ALTER TABLE services ADD COLUMN reviewCount INT DEFAULT 0`);
      console.log("✅ ReviewCount column added");
    }

    console.log("✅ Database setup for reviews is complete!");
    return true;
  } catch (err) {
    console.error("❌ Error checking/creating reviews table:", err);
    console.error("❌ Error details:", {
      code: err.code,
      message: err.message,
      sqlState: err.sqlState
    });
    
    // If it's a foreign key constraint error, try creating without foreign keys
    if (err.code === 'ER_CANNOT_ADD_FOREIGN' || err.message.includes('foreign key')) {
      console.log("⚠️ Foreign key constraint issue. Creating table without foreign keys...");
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            serviceId INT NOT NULL,
            userId INT NULL,
            userName VARCHAR(255) NOT NULL,
            userEmail VARCHAR(255) NULL,
            rating INT NOT NULL,
            comment TEXT NULL,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_serviceId (serviceId),
            INDEX idx_userId (userId),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log("✅ Reviews table created without foreign keys");
        return true;
      } catch (fallbackErr) {
        console.error("❌ Failed to create table even without foreign keys:", fallbackErr);
        return false;
      }
    }
    
    return false;
  }
}

module.exports = { checkAndCreateReviewsTable };






















































