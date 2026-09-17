const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'wanaw_db'
    });

    console.log('✅ Database connected successfully!');

    // Test if users table exists and has correct structure
    const [tables] = await connection.execute("SHOW TABLES LIKE 'users'");
    if (tables.length === 0) {
      console.log('❌ Users table does not exist!');
      return;
    }

    console.log('✅ Users table exists!');

    // Check table structure
    const [columns] = await connection.execute("DESCRIBE users");
    console.log('📋 Users table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'}`);
    });

    // Test a simple query
    const [rows] = await connection.execute("SELECT COUNT(*) as count FROM users");
    console.log(`📊 Total users in database: ${rows[0].count}`);

    await connection.end();
    console.log('✅ Database test completed successfully!');

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testDatabaseConnection();
