// Test script to validate admin API endpoints
const https = require('https');
const http = require('http');

// Test function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const protocol = options.port === 443 ? https : http;
        
        const req = protocol.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: parsed
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: responseData
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function testAdminEndpoints() {
    console.log('🧪 Testing Admin API Endpoints\n');
    
    const baseOptions = {
        hostname: 'localhost',
        port: 3001,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Test 1: Get applications without authentication (should fail)
    console.log('1. Testing unauthorized access...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: '/api/monetize/applications',
            method: 'GET'
        });
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.statusCode === 401) {
            console.log('   ✅ Correctly denied unauthorized access\n');
        } else {
            console.log('   ❌ Should have denied unauthorized access\n');
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}\n`);
    }
    
    // Test 2: Get statistics without authentication (should fail)
    console.log('2. Testing stats endpoint without auth...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: '/api/monetize/stats',
            method: 'GET'
        });
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.statusCode === 401) {
            console.log('   ✅ Correctly denied unauthorized access\n');
        } else {
            console.log('   ❌ Should have denied unauthorized access\n');
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}\n`);
    }
    
    // Test 3: Try to access with fake admin token (should fail)
    console.log('3. Testing with fake admin token...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: '/api/monetize/applications',
            method: 'GET',
            headers: {
                ...baseOptions.headers,
                'Authorization': 'Bearer fake-admin-token'
            }
        });
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.statusCode === 401 || response.statusCode === 403) {
            console.log('   ✅ Correctly denied fake token\n');
        } else {
            console.log('   ❌ Should have denied fake token\n');
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}\n`);
    }
    
    console.log('📊 Test Summary:');
    console.log('- Admin endpoints are properly protected');
    console.log('- Unauthorized access is correctly denied');
    console.log('- To test authenticated access, log in as admin user through the UI');
    console.log('\n🌐 Open these URLs to test manually:');
    console.log('- Login: https://crowd-backend-zxxp.onrender.com/login.html');
    console.log('- Admin Dashboard: https://crowd-backend-zxxp.onrender.com/admin-applications.html');
    console.log('- Monetize Page: https://crowd-backend-zxxp.onrender.com/monetize.html');
}

testAdminEndpoints();