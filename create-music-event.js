const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:10000/api';
const FRONTEND_URL = 'http://localhost:3000'; // For frontend operations if needed

// Random music event data
const musicEventData = {
    title: "Electric Dreams Music Festival 2025",
    description: "Join us for an unforgettable night of electronic music featuring world-class DJs and immersive light shows. Experience the future of sound with cutting-edge artists from around the globe.",
    category: "music",
    eventType: "festival",
    dateTime: {
        start: new Date("2025-07-15T18:00:00Z"),
        end: new Date("2025-07-16T02:00:00Z"),
        timezone: "America/New_York"
    },
    location: {
        type: "venue",
        venue: {
            name: "Central Park Great Lawn",
            address: {
                street: "Central Park Great Lawn",
                city: "New York",
                state: "NY",
                country: "USA",
                zipCode: "10024"
            }
        }
    },
    pricing: {
        type: "paid",
        amount: 125,
        currency: "USD",
        ticketClasses: [
            {
                name: "Early Bird",
                type: "paid",
                cost: {
                    value: 8900, // $89.00 in cents
                    currency: "USD",
                    display: "USD,8900"
                },
                quantity: {
                    total: 500,
                    sold: 0,
                    reserved: 0
                },
                sales: {
                    start: new Date("2025-01-15T00:00:00Z"),
                    end: new Date("2025-03-01T23:59:59Z")
                },
                deliveryMethods: ["electronic"],
                salesChannels: ["online"]
            },
            {
                name: "General Admission",
                type: "paid",
                cost: {
                    value: 12500, // $125.00 in cents
                    currency: "USD",
                    display: "USD,12500"
                },
                quantity: {
                    total: 2000,
                    sold: 0,
                    reserved: 0
                },
                sales: {
                    start: new Date("2025-03-01T00:00:00Z"),
                    end: new Date("2025-07-15T18:00:00Z")
                },
                deliveryMethods: ["electronic"],
                salesChannels: ["online"]
            },
            {
                name: "VIP Experience",
                type: "paid",
                cost: {
                    value: 29900, // $299.00 in cents
                    currency: "USD",
                    display: "USD,29900"
                },
                quantity: {
                    total: 200,
                    sold: 0,
                    reserved: 0
                },
                sales: {
                    start: new Date("2025-01-15T00:00:00Z"),
                    end: new Date("2025-07-15T18:00:00Z")
                },
                deliveryMethods: ["electronic"],
                salesChannels: ["online"]
            }
        ]
    },
    images: [{
        url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819",
        alt: "Electric Dreams Music Festival",
        isPrimary: true
    }],
    tags: ["electronic", "music festival", "EDM", "techno", "house", "outdoor", "NYC", "summer"],
    featured: false,
    status: "draft",
    overview: "Electric Dreams is more than just a music festival - it's a journey into the future of electronic music. Featuring three stages with different electronic music genres: Main Stage (Progressive House & Techno), Underground Stage (Deep House & Tech House), and Future Stage (Experimental & Ambient). The festival includes immersive art installations, food trucks, and interactive experiences."
};


async function createMusicEvent() {
    try {
        console.log('🎵 Creating Electric Dreams Music Festival...\n');

        // Step 0: Login with sample organizer
        console.log('🔐 Step 0: Logging in with sample organizer...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'event.organizer@sample.com',
            password: 'hashedPassword123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!loginResponse.data.success) {
            throw new Error('Failed to login: ' + loginResponse.data.message);
        }

        const token = loginResponse.data.token;
        console.log('✅ Successfully logged in');

        // Step 1: Create the event
        console.log('📝 Step 1: Creating event in database...');
        const eventResponse = await axios.post(`${BASE_URL}/events`, musicEventData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!eventResponse.data.success) {
            throw new Error('Failed to create event: ' + eventResponse.data.message);
        }

        const eventId = eventResponse.data.event._id;
        console.log(`✅ Event created successfully with ID: ${eventId}`);
        console.log(`📍 Event Title: ${eventResponse.data.event.title}`);
        console.log(`📅 Event Date: ${eventResponse.data.event.dateTime?.start || 'Date not available'}`);
        console.log(`🏢 Venue: ${eventResponse.data.event.location?.venue?.name || 'Venue not available'}`);
        console.log(`🎫 Tickets: ${eventResponse.data.event.pricing?.ticketClasses?.length || 0} ticket classes created\n`);

        // Step 2: Publish the event
        console.log('📢 Step 2: Publishing event...');
        const publishResponse = await axios.put(`${BASE_URL}/events/${eventId}`, {
            status: 'published',
            featured: false
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (publishResponse.data.success) {
            console.log('✅ Event published successfully!');
            console.log(`🌐 Event can be viewed at: ${FRONTEND_URL}/event-details.html?id=${eventId}`);
        } else {
            console.log('❌ Failed to publish event:', publishResponse.data.message);
        }

        // Step 3: Verify event is in music category
        console.log('\n🔍 Step 3: Verifying event appears in music category...');
        const musicEventsResponse = await axios.get(`${BASE_URL}/events/category/music`);

        if (musicEventsResponse.data.success) {
            const musicEvents = musicEventsResponse.data.events;
            const ourEvent = musicEvents.find(event => event._id === eventId);

            if (ourEvent) {
                console.log('✅ Event successfully appears in music category!');
                console.log(`📊 Total music events: ${musicEvents.length}`);
            } else {
                console.log('❌ Event not found in music category');
            }
        }

        console.log('\n🎉 Music event creation workflow completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   Event ID: ${eventId}`);
        console.log(`   Title: ${musicEventData.title}`);
        console.log(`   Category: Music`);
        console.log(`   Status: Published`);
        console.log(`   Tickets: 3 ticket classes included`);
        console.log(`   Date: 2025-07-15 at 18:00`);

        return {
            success: true,
            eventId: eventId,
            event: eventResponse.data.event
        };

    } catch (error) {
        console.error('❌ Error creating music event:', error.response?.data || error.message);
        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

// Run the script
if (require.main === module) {
    createMusicEvent().then(result => {
        if (result.success) {
            console.log('\n🚀 Script completed successfully!');
            process.exit(0);
        } else {
            console.log('\n💥 Script failed!');
            process.exit(1);
        }
    });
}

module.exports = { createMusicEvent };