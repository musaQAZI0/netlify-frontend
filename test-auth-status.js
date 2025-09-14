const axios = require('axios');

// Test configuration
const BASE_URL = 'https://crowd-backend-zxxp.onrender.com/api/auth';
const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'testpass123',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = '';

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      data,
      headers: {}
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test functions
async function testRegister() {
  console.log('\n🔄 Testing user registration...');
  const result = await apiCall('POST', '/register', testUser);
  
  if (result.success) {
    console.log('✅ Registration successful');
    console.log('   User:', result.data.user.name);
    console.log('   Auth Status:', result.data.user.authStatus);
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ Registration failed:', result.error);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔄 Testing login...');
  const result = await apiCall('POST', '/login', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success) {
    console.log('✅ Login successful');
    console.log('   User:', result.data.user.name);
    console.log('   Auth Status:', result.data.user.authStatus);
    authToken = result.data.token;
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function testAuthStatus() {
  console.log('\n🔄 Testing authentication status...');
  const result = await apiCall('GET', '/auth-status', null, authToken);
  
  if (result.success) {
    console.log('✅ Auth status retrieved');
    console.log('   Status:', JSON.stringify(result.data.authStatus, null, 2));
    return true;
  } else {
    console.log('❌ Auth status failed:', result.error);
    return false;
  }
}

async function testActiveSessions() {
  console.log('\n🔄 Testing active sessions...');
  const result = await apiCall('GET', '/sessions', null, authToken);
  
  if (result.success) {
    console.log('✅ Active sessions retrieved');
    console.log(`   Sessions count: ${result.data.sessions.length}`);
    result.data.sessions.forEach((session, index) => {
      console.log(`   Session ${index + 1}:`, {
        createdAt: session.createdAt,
        lastUsed: session.lastUsed,
        userAgent: session.userAgent?.substring(0, 50) + '...'
      });
    });
    return true;
  } else {
    console.log('❌ Active sessions failed:', result.error);
    return false;
  }
}

async function testProfile() {
  console.log('\n🔄 Testing profile with auth status...');
  const result = await apiCall('GET', '/profile', null, authToken);
  
  if (result.success) {
    console.log('✅ Profile retrieved');
    console.log('   Auth Status in Profile:', result.data.user.authStatus);
    return true;
  } else {
    console.log('❌ Profile failed:', result.error);
    return false;
  }
}

async function testLogout() {
  console.log('\n🔄 Testing logout...');
  const result = await apiCall('POST', '/logout', null, authToken);
  
  if (result.success) {
    console.log('✅ Logout successful');
    console.log('   Message:', result.data.message);
    return true;
  } else {
    console.log('❌ Logout failed:', result.error);
    return false;
  }
}

async function testRevokeAllSessions() {
  console.log('\n🔄 Testing revoke all sessions...');
  
  // First login again to have a session
  await testLogin();
  
  const result = await apiCall('POST', '/revoke-all-sessions', null, authToken);
  
  if (result.success) {
    console.log('✅ All sessions revoked');
    console.log('   Message:', result.data.message);
    return true;
  } else {
    console.log('❌ Revoke sessions failed:', result.error);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Authentication Status Tests');
  console.log('=====================================');
  
  try {
    // Try to register or login
    let authenticated = await testRegister();
    
    if (!authenticated) {
      console.log('\n🔄 Registration failed, trying login instead...');
      authenticated = await testLogin();
    }
    
    if (!authenticated) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Run authenticated tests
    await testAuthStatus();
    await testActiveSessions();
    await testProfile();
    await testLogout();
    await testRevokeAllSessions();
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n💥 Test runner error:', error.message);
  }
}

// Handle process termination
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run tests
if (require.main === module) {
  runTests();
}

module.exports = { runTests };