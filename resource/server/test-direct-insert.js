const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function testDirectInsert() {
  console.log('🧪 Testing direct database insert...');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'wanaw_db'
    });

    console.log('✅ Database connected successfully!');

    // Test the exact query and values that are failing
    const query = `
      INSERT INTO users
        (fullName, email, password, role, membership, membershipId, companyName, serviceType, phone, whatsapp, telegram, city, location, tin, branches, banks, businessStatus, idFile, license, tradeRegistration, servicePhotos, video, priceList, referralCode, referredBy, referralClicks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      'Test Company', 'test@example.com', 'hashedpassword', 'provider', 'Basic Provider', 'MEM123456',
      'Test Company', 'Test Service', '+1234567890', '+1234567890', '@test', 'Addis Ababa', 'Test Location',
      null, JSON.stringify([]), JSON.stringify([]), JSON.stringify([]),
      null, null, null, JSON.stringify([]), null, null,
      'REF-TEST123', null, 0
    ];

    console.log('🔍 Query placeholders:', (query.match(/\?/g) || []).length);
    console.log('🔍 Values array length:', values.length);
    console.log('🔍 Values array:', values);

    const [result] = await connection.execute(query, values);
    console.log('✅ Direct insert successful! ID:', result.insertId);

    await connection.end();
    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Direct insert failed:', error.message);
    console.error('Error details:', error);
  }
}

testDirectInsert();
