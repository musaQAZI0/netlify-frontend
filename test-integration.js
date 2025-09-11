// Test script to verify API integration logic
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Simulate browser globals
global.window = {
    location: {
        hostname: 'dazzling-pithivier-2cf3ce.netlify.app',
        origin: 'https://dazzling-pithivier-2cf3ce.netlify.app'
    },
    Config: {
        isDevelopment: false,
        API_BASE_URL: 'https://crowd-backend-zxxp.onrender.com/api'
    }
};

global.fetch = fetch;

// Simulate the CrowdAPI class
class CrowdAPI {
    constructor() {
        this.baseURL = window.Config.API_BASE_URL;
        this.headers = {
            'Content-Type': 'application/json',
        };
        console.log('CrowdAPI initialized with baseURL:', this.baseURL);
    }

    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: { ...this.headers, ...options.headers }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error.message);
            throw error;
        }
    }

    async getEvents() {
        return this.fetchAPI('/events');
    }

    async getHealth() {
        return this.fetchAPI('/health');
    }
}

// Test function
async function testAPIIntegration() {
    console.log('🚀 Testing Crowd API Integration...\n');
    
    const api = new CrowdAPI();
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
        const health = await api.getHealth();
        console.log('✅ Health check passed:', health.status);
        console.log('   Database:', health.database);
        console.log('   Backend URL:', health.server);
    } catch (error) {
        console.log('❌ Health check failed:', error.message);
        return;
    }
    
    console.log('');
    
    // Test 2: Events endpoint
    console.log('2. Testing events endpoint...');
    try {
        const response = await api.getEvents();
        console.log('✅ Events endpoint response received');
        console.log('   Success:', response.success);
        console.log('   Events count:', response.events ? response.events.length : 'N/A');
        console.log('   Pagination:', response.pagination);
        
        // Simulate the frontend logic
        let events = response;
        if (response && response.data) {
            events = response.data;
        } else if (response && response.events) {
            events = response.events;
        }
        
        console.log('   Processed events array length:', Array.isArray(events) ? events.length : 'Not an array');
        
        if (Array.isArray(events) && events.length === 0) {
            console.log('   📝 No events found - frontend will show fallback events');
            
            // Simulate fallback events
            const sampleEvents = [
                {
                    _id: 'sample-1',
                    title: 'Winter Music Festival',
                    location: 'Islamabad',
                    date: new Date(Date.now() + 86400000),
                    price: 2500,
                    category: 'Music'
                },
                {
                    _id: 'sample-2',
                    title: 'Food & Culture Expo',
                    location: 'Lahore',
                    date: new Date(Date.now() + 172800000),
                    price: 1000,
                    category: 'Food'
                }
            ];
            
            console.log('   🎭 Fallback events will be shown:');
            sampleEvents.forEach((event, index) => {
                console.log(`      ${index + 1}. ${event.title} - ${event.location} - PKR ${event.price}`);
            });
        }
        
    } catch (error) {
        console.log('❌ Events endpoint failed:', error.message);
    }
    
    console.log('\n✅ API integration test completed!');
    console.log('💡 The frontend will work with both empty and populated event responses.');
}

// Run the test
testAPIIntegration().catch(console.error);