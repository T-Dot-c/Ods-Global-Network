const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// Create connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'wanaw_db'
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  
  console.log("✅ Connected to database!");
  
  // Drop the foreign key constraint if it exists
  const dropForeignKey = `
    ALTER TABLE users 
    DROP FOREIGN KEY IF EXISTS users_ibfk_1
  `;
  
  connection.query(dropForeignKey, (err) => {
    if (err) {
      console.log("ℹ️  Foreign key constraint doesn't exist or already dropped");
    } else {
      console.log("✅ Foreign key constraint dropped");
    }
    
    // Update referredBy column to allow NULL values
    const updateColumn = `
      ALTER TABLE users 
      MODIFY COLUMN referredBy INT DEFAULT NULL
    `;
    
    connection.query(updateColumn, (err) => {
      if (err) {
        console.error("❌ Error updating referredBy column:", err.message);
      } else {
        console.log("✅ referredBy column updated to allow NULL values");
      }
      
      connection.end();
      console.log("🎉 Migration complete!");
    });
  });
});





















