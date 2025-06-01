// Test script for protected routes
async function testProtectedRoute() {
  try {
    console.log('Testing protected admin route...');
    
    // First login to get token
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData.error);
      return;
    }
    
    console.log('✅ Login successful, testing protected route...');
    
    // Test protected admin endpoint
    const protectedResponse = await fetch('http://localhost:3002/api/admin/test', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json',
      },
    });

    const protectedData = await protectedResponse.json();
    
    console.log('Protected route status:', protectedResponse.status);
    console.log('Protected route data:', JSON.stringify(protectedData, null, 2));
    
    if (protectedResponse.ok) {
      console.log('✅ Protected route access successful!');
    } else {
      console.log('❌ Protected route access failed:', protectedData.error);
    }
    
  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

testProtectedRoute();
