const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// Create connection without specifying database first
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 3306,
});

// Connect and create database if it doesn't exist
connection.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
  
  console.log("✅ Connected to MySQL server!");
  
  // Create database if it doesn't exist
  const dbName = process.env.DB_NAME || 'wanaw_db';
  connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`, (err) => {
    if (err) {
      console.error("❌ Error creating database:", err.message);
      process.exit(1);
    }
    
    console.log(`✅ Database '${dbName}' ready!`);
    
    // Use the database
    connection.query(`USE ${dbName}`, (err) => {
      if (err) {
        console.error("❌ Error using database:", err.message);
        process.exit(1);
      }
      
      console.log(`✅ Using database '${dbName}'`);
      
      // Create users table if it doesn't exist
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fullName VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          role ENUM('individual', 'provider', 'corporate', 'diaspora', 'admin', 'super_admin', 'marketing_admin', 'customer_support_admin', 'standard_agent', 'elite_agent') DEFAULT 'individual',
          membership VARCHAR(100) DEFAULT 'Standard Member',
          membershipId VARCHAR(50),
          companyName VARCHAR(255),
          serviceType VARCHAR(255),
          phone VARCHAR(20),
          whatsapp VARCHAR(20),
          telegram VARCHAR(50),
          city VARCHAR(100),
          location TEXT,
          tin VARCHAR(50),
          branches JSON,
          banks JSON,
          businessStatus JSON,
          idFile VARCHAR(500),
          license VARCHAR(500),
          tradeRegistration VARCHAR(500),
          servicePhotos JSON,
          video VARCHAR(500),
          priceList VARCHAR(500),
          insuranceProfile VARCHAR(500),
          referralCode VARCHAR(50),
          referredBy INT DEFAULT NULL,
          referralClicks INT DEFAULT 0,
          googleId VARCHAR(255),
          resetToken VARCHAR(255),
          tokenExpire BIGINT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      
      connection.query(createUsersTable, (err) => {
        if (err) {
          console.error("❌ Error creating users table:", err.message);
          process.exit(1);
        }
        
        console.log("✅ Users table ready!");
        connection.end();
        console.log("🎉 Database setup complete!");
      });
    });
  });
});




