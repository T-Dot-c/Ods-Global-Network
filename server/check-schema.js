const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

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
  
  // Get the schema for the users table
  const query = "DESCRIBE users";
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error("❌ Error getting schema:", err.message);
      process.exit(1);
    }
    
    console.log("\n📋 Users table schema:");
    console.log("=".repeat(80));
    results.forEach((col, index) => {
      console.log(`${index + 1}. ${col.Field.padEnd(20)} | ${col.Type.padEnd(20)} | ${col.Null} | ${col.Key} | ${col.Default}`);
    });
    console.log("=".repeat(80));
    
    connection.end();
  });
});




