// Marketing Page Authentication Demo Script
// This demonstrates the authentication flow for the marketing page

const DEMO_USER = {
    email: 'testuser@demo.com',
    password: 'password123'
};

console.log('=== Marketing Page Authentication Demo ===\n');

// Step 1: Test login
async function demonstrateLogin() {
    console.log('1. Testing User Login...');
    try {
        const response = await fetch('https://crowd-backend-zxxp.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(DEMO_USER)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('   ✅ Login successful!');
            console.log(`   📧 User: ${data.user.firstName} ${data.user.lastName} (${data.user.email})`);
            console.log(`   🔑 Token: ${data.token.substring(0, 20)}...`);
            console.log(`   👤 Role: ${data.user.role} ${data.user.isOrganizer ? '(Organizer)' : '(Regular User)'}\n`);
            return data.token;
        } else {
            console.log('   ❌ Login failed:', data.error);
            return null;
        }
    } catch (error) {
        console.log('   ❌ Login error:', error.message);
        return null;
    }
}

// Step 2: Test getting current user
async function demonstrateGetCurrentUser(token) {
    console.log('2. Testing Get Current User...');
    try {
        const response = await fetch('https://crowd-backend-zxxp.onrender.com/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('   ✅ User data retrieved successfully!');
            console.log(`   📋 Profile: ${data.user.firstName} ${data.user.lastName}`);
            console.log(`   🆔 ID: ${data.user.id}`);
            console.log(`   📅 Created: ${new Date(data.user.createdAt).toLocaleDateString()}\n`);
            return data.user;
        } else {
            console.log('   ❌ Failed to get user data:', data.error);
            return null;
        }
    } catch (error) {
        console.log('   ❌ Get user error:', error.message);
        return null;
    }
}

// Step 3: Test marketing API endpoints
async function demonstrateMarketingAPI(token, user) {
    console.log('3. Testing Marketing API Endpoints...');
    
    // Test campaigns endpoint
    try {
        console.log('   📊 Testing marketing campaigns...');
        const campaignsResponse = await fetch('https://crowd-backend-zxxp.onrender.com/api/marketing/campaigns', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (campaignsResponse.ok) {
            const campaignsData = await campaignsResponse.json();
            console.log(`   ✅ Campaigns API: ${campaignsData.count} campaigns found`);
        } else {
            console.log(`   ❌ Campaigns API failed with status ${campaignsResponse.status}`);
        }
    } catch (error) {
        console.log('   ❌ Campaigns API error:', error.message);
    }
    
    // Test social stats endpoint
    try {
        console.log('   📱 Testing social media stats...');
        const socialResponse = await fetch('https://crowd-backend-zxxp.onrender.com/api/marketing/social-stats', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (socialResponse.ok) {
            const socialData = await socialResponse.json();
            console.log('   ✅ Social Stats API: Data loaded successfully');
            
            const stats = socialData.stats;
            if (stats) {
                console.log('   📈 Social Media Overview:');
                console.log(`      - Facebook: ${stats.facebook?.followers || 0} followers`);
                console.log(`      - Instagram: ${stats.instagram?.followers || 0} followers`);
                console.log(`      - LinkedIn: ${stats.linkedin?.followers || 0} followers`);
                console.log(`      - TikTok: ${stats.tiktok?.followers || 0} followers`);
            }
        } else {
            console.log(`   ❌ Social Stats API failed with status ${socialResponse.status}`);
        }
    } catch (error) {
        console.log('   ❌ Social Stats API error:', error.message);
    }
    
    console.log();
}

// Step 4: Show what happens in the marketing page
function demonstrateMarketingPageFlow(user) {
    console.log('4. Marketing Page Authentication Flow:');
    console.log('   🏠 When user visits marketing.html:');
    console.log('      1. Page loads and includes auth-api.js');
    console.log('      2. checkAuthentication() function runs');
    console.log('      3. getCurrentUser() checks for valid token');
    console.log('      4. If authenticated:');
    console.log(`         - User avatar shows: "${user.firstName.charAt(0)}${user.lastName.charAt(0)}"`);
    console.log(`         - User name displays: "${user.firstName} ${user.lastName}"`);
    console.log('         - User can click avatar for dropdown menu');
    console.log('         - loadUserMarketingData() fetches user campaigns');
    console.log('         - User can access all marketing features');
    console.log('      5. If not authenticated:');
    console.log('         - Redirects to login.html');
    console.log();
}

// Step 5: Demonstrate user profile features
function demonstrateUserProfileFeatures(user) {
    console.log('5. User Profile Features in Marketing Page:');
    console.log('   👤 Profile Information:');
    console.log(`      - Full Name: ${user.firstName} ${user.lastName}`);
    console.log(`      - Email: ${user.email}`);
    console.log(`      - Role: ${user.role}`);
    console.log(`      - Organizer Status: ${user.isOrganizer ? 'Yes' : 'No'}`);
    console.log(`      - Account Type: ${user.isOrganizer ? 'Event Organizer' : 'Regular User'}`);
    console.log();
    
    console.log('   🔐 Authentication Features:');
    console.log('      - Clickable user avatar in header');
    console.log('      - Dropdown menu with user details');
    console.log('      - Sign out button');
    console.log('      - Auto-redirect to login if not authenticated');
    console.log('      - Token-based API authentication');
    console.log();
    
    console.log('   📊 Marketing Data Access:');
    console.log('      - User-specific marketing campaigns');
    console.log('      - Social media statistics');
    console.log('      - Personalized dashboard experience');
    console.log();
}

// Main demo function
async function runDemo() {
    console.log('Starting authentication demo...\n');
    
    // Step 1: Login
    const token = await demonstrateLogin();
    if (!token) {
        console.log('❌ Demo stopped - unable to login');
        return;
    }
    
    // Step 2: Get current user
    const user = await demonstrateGetCurrentUser(token);
    if (!user) {
        console.log('❌ Demo stopped - unable to get user data');
        return;
    }
    
    // Step 3: Test marketing APIs
    await demonstrateMarketingAPI(token, user);
    
    // Step 4: Show marketing page flow
    demonstrateMarketingPageFlow(user);
    
    // Step 5: Show user profile features
    demonstrateUserProfileFeatures(user);
    
    console.log('✅ Demo completed successfully!');
    console.log();
    console.log('🚀 To test the marketing page:');
    console.log('   1. Open: http://localhost:3000/test-marketing.html');
    console.log('   2. Click "Login Test User"');
    console.log('   3. Click "Open Marketing Page"');
    console.log('   4. See the authenticated user profile in the header');
    console.log();
}

// Export for Node.js if being run directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runDemo };
}

// Run demo if in Node.js environment
if (typeof window === 'undefined' && typeof require !== 'undefined') {
    // We're in Node.js, but we need fetch
    const fetch = require('node-fetch');
    global.fetch = fetch;
    runDemo().catch(console.error);
}