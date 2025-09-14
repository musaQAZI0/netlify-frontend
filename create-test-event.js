const mongoose = require('mongoose');
const Event = require('./server/database/models/Event');
const User = require('./server/database/models/User');

async function createTestEvent() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://jalalsherazi575:Ri7OnSoE9DOo5wqp@crowd.rmytvx2.mongodb.net/?retryWrites=true&w=majority&appName=CROWD');
        console.log('Connected to MongoDB');

        // Find test user
        const testUser = await User.findOne({ email: 'test@example.com' });
        if (!testUser) {
            console.log('Test user not found');
            return;
        }

        // Generate unique event ID
        const eventId = 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Create test event
        const testEvent = new Event({
            id: eventId,
            title: 'Summer Music Festival 2024',
            description: 'Join us for an incredible night of live music featuring top artists from around the world. This outdoor festival will showcase diverse musical genres from rock to electronic dance music.',
            category: 'Music',
            location: 'Central Park, New York, NY',
            startDate: new Date('2024-08-15T18:00:00Z'),
            endDate: new Date('2024-08-15T23:00:00Z'),
            startTime: '18:00',
            endTime: '23:00',
            timezone: 'America/New_York',
            price: 0, // Will be overridden by ticket types
            currency: 'USD',
            maxAttendees: 5000,
            currentAttendees: 1247,
            organizer: testUser.firstName && testUser.lastName 
                ? `${testUser.firstName} ${testUser.lastName}`
                : testUser.email.split('@')[0],
            organizerId: testUser._id,
            status: 'draft',
            isActive: true,
            isFeatured: false,
            imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=400&q=80',
            tags: ['music', 'festival', 'outdoor', 'summer', 'live-performance'],
            attendees: [], // Will be populated with actual attendee IDs
            ticketTypes: [
                {
                    id: 'early_bird',
                    name: 'Early Bird',
                    price: 45,
                    quantity: 1000,
                    sold: 856,
                    description: 'Limited time early bird discount tickets'
                },
                {
                    id: 'general',
                    name: 'General Admission',
                    price: 65,
                    quantity: 3000,
                    sold: 234,
                    description: 'Standard festival admission with access to all stages'
                },
                {
                    id: 'vip',
                    name: 'VIP Experience',
                    price: 150,
                    quantity: 500,
                    sold: 157,
                    description: 'Premium experience with exclusive backstage access and complimentary drinks'
                }
            ],
            // Enhanced event details
            overviewDescription: 'Experience the magic of live music under the stars in one of the most beautiful venues in the city. Our Summer Music Festival brings together renowned artists and emerging talents for an unforgettable evening.',
            whyAttend: 'This festival features headlining acts you won\'t see anywhere else, food trucks with amazing local cuisine, and a chance to connect with fellow music lovers in a stunning outdoor setting.',
            howToParticipate: 'Simply purchase your tickets, arrive at the venue by 5:30 PM for early entry, and get ready to dance the night away! Bring comfortable shoes and don\'t forget to stay hydrated.',
            closingMessage: 'Don\'t miss out on this incredible musical journey! Limited tickets available - secure yours today and be part of something special.',
            organizerProfile: {
                bio: 'Passionate event organizer specializing in music festivals and cultural events. Over 10 years of experience creating memorable experiences.',
                avatar: '', // Will use initials
                socialLinks: {
                    website: 'https://festivalsnyc.com',
                    instagram: 'https://instagram.com/festivalsnyc',
                    twitter: 'https://twitter.com/festivalsnyc'
                }
            }
        });

        const savedEvent = await testEvent.save();
        console.log('✅ Created test event:', savedEvent.id);
        console.log(`📋 Event Title: ${savedEvent.title}`);
        console.log(`🎫 Ticket Types: ${savedEvent.ticketTypes.length}`);
        console.log(`👥 Current Attendees: ${savedEvent.currentAttendees}/${savedEvent.maxAttendees}`);
        console.log(`📍 Location: ${savedEvent.location}`);
        console.log(`📅 Date: ${savedEvent.startDate.toDateString()}`);
        console.log(`⏰ Time: ${savedEvent.startTime} - ${savedEvent.endTime}`);
        console.log(`🎪 Status: ${savedEvent.status}`);
        
        console.log('\n🌐 Test the event preview at:');
        console.log(`https://crowd-backend-zxxp.onrender.com/event-preview-new.html?eventId=${savedEvent.id}`);

    } catch (error) {
        console.error('Error creating test event:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Test event created successfully!');
        console.log('Login as test@example.com to view and manage this event.');
    }
}

createTestEvent();