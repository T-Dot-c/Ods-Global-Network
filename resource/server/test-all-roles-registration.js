const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function testAllRoles() {
  console.log('🧪 Testing registration for all roles...\n');

  const timestamp = Date.now();

  // Test 1: Individual registration
  console.log('1️⃣ Testing Individual Registration...');
  try {
    const individualData = {
      fullName: `Test Individual ${timestamp}`,
      email: `test.individual.${timestamp}@example.com`,
      password: 'password123',
      role: 'individual',
      phone: '1234567890',
      membership: 'Standard Member'
    };

    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(individualData)
    });

    const result = await response.json();
    if (response.status === 201) {
      console.log('✅ Individual registration: SUCCESS -', result.msg);
    } else {
      console.log('❌ Individual registration: FAILED -', response.status, result.msg || result.error);
    }
  } catch (error) {
    console.log('❌ Individual registration: ERROR -', error.message);
  }

  // Test 2: Provider registration
  console.log('\n2️⃣ Testing Provider Registration...');
  try {
    const providerData = {
      fullName: `Test Provider ${timestamp}`,
      companyName: `Test Provider Company ${timestamp}`,
      serviceType: 'Healthcare',
      email: `test.provider.${timestamp}@example.com`,
      password: 'password123',
      role: 'provider',
      phone: '1234567890',
      city: 'Addis Ababa',
      location: 'Test Location',
      membership: 'Basic Provider',
      branches: JSON.stringify([{city: 'Addis Ababa', location: 'Test Branch'}]),
      banks: JSON.stringify([{bankName: 'Test Bank', accountNumber: '123456'}]),
      businessStatus: JSON.stringify(['Active'])
    };

    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(providerData)
    });

    const result = await response.json();
    if (response.status === 201) {
      console.log('✅ Provider registration: SUCCESS -', result.msg);
    } else {
      console.log('❌ Provider registration: FAILED -', response.status, result.msg || result.error);
    }
  } catch (error) {
    console.log('❌ Provider registration: ERROR -', error.message);
  }

  // Test 3: Corporate registration
  console.log('\n3️⃣ Testing Corporate Registration...');
  try {
    const corporateData = {
      fullName: `Test Corporate ${timestamp}`,
      companyName: `Test Corporate Company ${timestamp}`,
      serviceType: 'Corporate Services',
      email: `test.corporate.${timestamp}@example.com`,
      password: 'password123',
      role: 'corporate',
      phone: '1234567890',
      city: 'Addis Ababa',
      location: 'Test Location',
      membership: 'Standard Member',
      branches: JSON.stringify([{city: 'Addis Ababa', location: 'Test Branch'}]),
      banks: JSON.stringify([{bankName: 'Test Bank', accountNumber: '123456'}]),
      businessStatus: JSON.stringify(['Active'])
    };

    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corporateData)
    });

    const result = await response.json();
    if (response.status === 201) {
      console.log('✅ Corporate registration: SUCCESS -', result.msg);
    } else {
      console.log('❌ Corporate registration: FAILED -', response.status, result.msg || result.error);
    }
  } catch (error) {
    console.log('❌ Corporate registration: ERROR -', error.message);
  }

  // Test 4: Diaspora registration
  console.log('\n4️⃣ Testing Diaspora Registration...');
  try {
    const diasporaData = {
      fullName: `Test Diaspora ${timestamp}`,
      email: `test.diaspora.${timestamp}@example.com`,
      password: 'password123',
      role: 'diaspora',
      phone: '1234567890',
      membership: 'Standard Member'
    };

    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(diasporaData)
    });

    const result = await response.json();
    if (response.status === 201) {
      console.log('✅ Diaspora registration: SUCCESS -', result.msg);
    } else {
      console.log('❌ Diaspora registration: FAILED -', response.status, result.msg || result.error);
    }
  } catch (error) {
    console.log('❌ Diaspora registration: ERROR -', error.message);
  }

  console.log('\n🎉 Registration testing complete!');
}

// Run the test
testAllRoles().catch(console.error);



