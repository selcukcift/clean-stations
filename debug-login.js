// Debug script to test login functionality
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with direct axios call...');
    
    const response = await axios.post('http://localhost:3004/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3005'
      },
      timeout: 5000
    });

    console.log('✅ Login successful!');
    console.log('Status:', response.status);
    console.log('Token:', response.data.token ? 'Present' : 'Missing');
    console.log('User:', response.data.user);
    
  } catch (error) {
    console.log('❌ Login failed!');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error || error.message);
    console.log('Full error:', error.message);
  }
}

testLogin();
