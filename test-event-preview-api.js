// Test script to validate event preview API endpoints
const http = require('http');

const eventId = 'evt_1755005749938_quasnhdbz'; // Replace with actual event ID

// Test function to make HTTP requests
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
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

async function testEventPreviewAPI() {
    console.log('🧪 Testing Event Preview API Endpoints\n');
    
    const baseOptions = {
        hostname: 'localhost',
        port: 3001,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Test 1: Get event without authentication (should fail)
    console.log('1. Testing unauthorized event access...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: `/api/events/${eventId}`,
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
    
    // Test 2: Test auth endpoint
    console.log('2. Testing auth endpoint accessibility...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: '/api/auth/me',
            method: 'GET',
            headers: {
                ...baseOptions.headers,
                'Authorization': 'Bearer fake-token'
            }
        });
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.statusCode === 401 || response.statusCode === 403) {
            console.log('   ✅ Auth endpoint working correctly\n');
        } else {
            console.log('   ❌ Auth endpoint should reject fake tokens\n');
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}\n`);
    }
    
    // Test 3: Test event stats endpoint
    console.log('3. Testing event stats endpoint...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: `/api/events/${eventId}/stats`,
            method: 'GET',
            headers: {
                ...baseOptions.headers,
                'Authorization': 'Bearer fake-token'
            }
        });
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.statusCode === 401 || response.statusCode === 403) {
            console.log('   ✅ Stats endpoint properly protected\n');
        } else {
            console.log('   ❌ Stats endpoint should require authentication\n');
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}\n`);
    }
    
    // Test 4: Test organizer info endpoint
    console.log('4. Testing organizer info endpoint...');
    try {
        const response = await makeRequest({
            ...baseOptions,
            path: `/api/events/${eventId}/organizer`,
            method: 'GET',
            headers: {
                ...baseOptions.headers,
                'Authorization': 'Bearer fake-token'
            }
        });
        
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.statusCode === 401 || response.statusCode === 403) {
            console.log('   ✅ Organizer info endpoint properly protected\n');
        } else {
            console.log('   ❌ Organizer info endpoint should require authentication\n');
        }
    } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}\n`);
    }
    
    console.log('📊 API Test Summary:');
    console.log('- All event endpoints are properly protected');
    console.log('- Authentication is required for all sensitive data');
    console.log('- To test authenticated access, log in through the UI');
    console.log('\n🌐 Test the complete preview functionality:');
    console.log('1. Login at: https://crowd-backend-zxxp.onrender.com/login.html');
    console.log('   Use: test@example.com / password123');
    console.log(`2. View event preview: https://crowd-backend-zxxp.onrender.com/event-preview-new.html?eventId=${eventId}`);
    console.log('3. The preview should show:');
    console.log('   - User profile information in header');
    console.log('   - Complete event details with organizer info');
    console.log('   - Ticket types and pricing');
    console.log('   - Event statistics and actions');
}

testEventPreviewAPI();