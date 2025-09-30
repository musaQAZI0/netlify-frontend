// Seed events script for MongoDB
const mongoose = require('mongoose');
const Event = require('./server/models/Event');
const User = require('./server/models/User');
require('dotenv').config();

// Sample events data (realistic like Eventbrite)
const sampleEvents = [
  {
    title: 'Tech Conference 2024: AI & Machine Learning Summit',
    description: 'Join industry leaders, researchers, and innovators for a comprehensive exploration of artificial intelligence and machine learning. This two-day conference features keynote presentations, hands-on workshops, and networking opportunities with experts from Google, Microsoft, OpenAI, and leading startups. Learn about the latest breakthroughs in generative AI, computer vision, natural language processing, and ethical AI development.',
    category: 'Technology',
    subcategory: 'Artificial Intelligence',
    startDate: new Date('2024-11-15T09:00:00Z'),
    endDate: new Date('2024-11-16T17:00:00Z'),
    timezone: 'America/Los_Angeles',
    location: {
      type: 'physical',
      venue: 'San Francisco Convention Center',
      address: {
        street: '747 Howard St',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94103',
        coordinates: {
          lat: 37.7849,
          lng: -122.4094
        }
      }
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'Tech Conference AI Summit',
      isPrimary: true
    }],
    primaryImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ticketTypes: [
      {
        name: 'Early Bird',
        description: 'Limited time offer - save $100',
        price: 299,
        quantity: 100,
        sold: 85,
        maxPerOrder: 5,
        saleStart: new Date('2024-09-01T00:00:00Z'),
        saleEnd: new Date('2024-10-01T23:59:59Z'),
        isActive: true
      },
      {
        name: 'Regular',
        description: 'Standard conference ticket',
        price: 399,
        quantity: 500,
        sold: 120,
        maxPerOrder: 10,
        isActive: true
      },
      {
        name: 'VIP',
        description: 'Includes exclusive networking dinner',
        price: 799,
        quantity: 50,
        sold: 12,
        maxPerOrder: 2,
        isActive: true
      }
    ],
    isFree: false,
    totalCapacity: 650,
    ticketsSold: 217,
    status: 'published',
    isPublic: true,
    isFeatured: true,
    tags: ['AI', 'Machine Learning', 'Technology', 'Conference', 'Networking'],
    ageRestriction: {
      minAge: 18,
      description: 'Professional conference for adults'
    },
    views: 2847,
    likes: 156,
    shares: 43,
    publishedAt: new Date('2024-09-03T10:00:00Z')
  },
  {
    title: 'Summer Music Festival 2024',
    description: 'Experience three days of incredible live music featuring top artists from around the world. This outdoor festival includes multiple stages with genres ranging from rock and pop to electronic and indie. Food trucks, art installations, and camping options available. Headliners include major international and local artists.',
    category: 'Music',
    subcategory: 'Festival',
    startDate: new Date('2024-07-12T14:00:00Z'),
    endDate: new Date('2024-07-14T23:00:00Z'),
    timezone: 'America/Chicago',
    location: {
      type: 'physical',
      venue: 'Zilker Park',
      address: {
        street: '2100 Barton Springs Rd',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        postalCode: '78746',
        coordinates: {
          lat: 30.2672,
          lng: -97.7431
        }
      }
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'Summer Music Festival',
      isPrimary: true
    }],
    primaryImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ticketTypes: [
      {
        name: '3-Day Pass',
        description: 'Access to all three days',
        price: 199,
        quantity: 5000,
        sold: 3200,
        maxPerOrder: 6,
        isActive: true
      },
      {
        name: 'VIP Weekend',
        description: 'Premium viewing area + artist meet & greets',
        price: 449,
        quantity: 500,
        sold: 320,
        maxPerOrder: 4,
        isActive: true
      }
    ],
    isFree: false,
    totalCapacity: 8000,
    ticketsSold: 3520,
    status: 'published',
    isPublic: true,
    isFeatured: true,
    tags: ['Music', 'Festival', 'Outdoor', 'Live Music', 'Austin'],
    views: 8934,
    likes: 567,
    shares: 234,
    publishedAt: new Date('2024-04-15T09:00:00Z')
  },
  {
    title: 'Food & Wine Expo: Culinary Excellence',
    description: 'A gourmet experience showcasing the finest cuisine and wines from renowned chefs and vintners. Attend cooking demonstrations, wine tastings, and exclusive dinners. Featured chefs include James Beard Award winners and Michelin-starred talent. Perfect for food enthusiasts and culinary professionals.',
    category: 'Food & Drink',
    subcategory: 'Tasting',
    startDate: new Date('2024-10-25T11:00:00Z'),
    endDate: new Date('2024-10-25T20:00:00Z'),
    timezone: 'America/New_York',
    location: {
      type: 'physical',
      venue: 'Jacob K. Javits Convention Center',
      address: {
        street: '655 W 34th St',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10001',
        coordinates: {
          lat: 40.7589,
          lng: -74.0021
        }
      }
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'Food and Wine Expo',
      isPrimary: true
    }],
    primaryImage: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ticketTypes: [
      {
        name: 'General Admission',
        description: 'Access to expo floor and tastings',
        price: 85,
        quantity: 800,
        sold: 456,
        maxPerOrder: 8,
        isActive: true
      },
      {
        name: 'VIP Experience',
        description: 'Includes exclusive chef dinners',
        price: 225,
        quantity: 150,
        sold: 89,
        maxPerOrder: 4,
        isActive: true
      }
    ],
    isFree: false,
    totalCapacity: 950,
    ticketsSold: 545,
    status: 'published',
    isPublic: true,
    isFeatured: false,
    tags: ['Food', 'Wine', 'Culinary', 'Tasting', 'Gourmet'],
    views: 1823,
    likes: 94,
    shares: 28,
    publishedAt: new Date('2024-08-20T14:00:00Z')
  },
  {
    title: 'Contemporary Art Gallery Opening: "Digital Dreams"',
    description: 'Join us for the exclusive opening of our new contemporary art exhibition featuring digital and interactive installations by emerging and established artists. The exhibition explores the intersection of technology and creativity, featuring augmented reality experiences, digital sculptures, and interactive media art.',
    category: 'Arts',
    subcategory: 'Gallery Opening',
    startDate: new Date('2024-10-18T18:00:00Z'),
    endDate: new Date('2024-10-18T22:00:00Z'),
    timezone: 'America/Los_Angeles',
    location: {
      type: 'physical',
      venue: 'Museum of Contemporary Art',
      address: {
        street: '250 S Grand Ave',
        city: 'Los Angeles',
        state: 'CA',
        country: 'USA',
        postalCode: '90012',
        coordinates: {
          lat: 34.0522,
          lng: -118.2437
        }
      }
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'Contemporary Art Gallery',
      isPrimary: true
    }],
    primaryImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ticketTypes: [],
    isFree: true,
    totalCapacity: 200,
    ticketsSold: 0,
    status: 'published',
    isPublic: true,
    isFeatured: true,
    tags: ['Art', 'Gallery', 'Contemporary', 'Digital Art', 'Opening'],
    views: 675,
    likes: 38,
    shares: 12,
    publishedAt: new Date('2024-09-01T16:00:00Z')
  },
  {
    title: 'Startup Pitch Night: Innovation Showcase',
    description: 'Watch the next generation of entrepreneurs pitch their innovative ideas to top investors and industry experts. This monthly event features 10 carefully selected startups presenting their business plans, followed by Q&A sessions and networking. Great opportunity for investors, entrepreneurs, and anyone interested in the startup ecosystem.',
    category: 'Business',
    subcategory: 'Networking',
    startDate: new Date('2024-10-08T18:30:00Z'),
    endDate: new Date('2024-10-08T21:30:00Z'),
    timezone: 'America/Los_Angeles',
    location: {
      type: 'hybrid',
      venue: 'TechCrunch Headquarters',
      address: {
        street: '410 Townsend St',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        postalCode: '94107',
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      },
      onlineDetails: {
        platform: 'Zoom',
        link: 'https://zoom.us/j/startup-pitch-night',
        instructions: 'Link will be sent 24 hours before the event'
      }
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'Startup Pitch Night',
      isPrimary: true
    }],
    primaryImage: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ticketTypes: [
      {
        name: 'In-Person',
        description: 'Attend the event in person',
        price: 25,
        quantity: 100,
        sold: 67,
        maxPerOrder: 3,
        isActive: true
      },
      {
        name: 'Virtual',
        description: 'Join online via Zoom',
        price: 15,
        quantity: 200,
        sold: 143,
        maxPerOrder: 5,
        isActive: true
      }
    ],
    isFree: false,
    totalCapacity: 300,
    ticketsSold: 210,
    status: 'published',
    isPublic: true,
    isFeatured: false,
    tags: ['Startup', 'Pitch', 'Investors', 'Networking', 'Business'],
    views: 1234,
    likes: 67,
    shares: 19,
    publishedAt: new Date('2024-08-15T12:00:00Z')
  },
  {
    title: 'Health & Wellness Summit: Mind, Body, Spirit',
    description: 'A comprehensive wellness event featuring renowned speakers, fitness classes, meditation sessions, and health screenings. Learn from experts about nutrition, mental health, fitness, and holistic wellness approaches. Includes yoga sessions, healthy cooking demonstrations, and wellness product expo.',
    category: 'Health',
    subcategory: 'Wellness',
    startDate: new Date('2024-11-22T08:00:00Z'),
    endDate: new Date('2024-11-22T18:00:00Z'),
    timezone: 'America/Denver',
    location: {
      type: 'physical',
      venue: 'Colorado Convention Center',
      address: {
        street: '700 14th St',
        city: 'Denver',
        state: 'CO',
        country: 'USA',
        postalCode: '80202',
        coordinates: {
          lat: 39.7392,
          lng: -104.9903
        }
      }
    },
    images: [{
      url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'Health and Wellness Summit',
      isPrimary: true
    }],
    primaryImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    ticketTypes: [
      {
        name: 'Full Day Pass',
        description: 'Access to all sessions and activities',
        price: 89,
        quantity: 500,
        sold: 287,
        maxPerOrder: 6,
        isActive: true
      },
      {
        name: 'Premium Package',
        description: 'Includes lunch and wellness kit',
        price: 149,
        quantity: 200,
        sold: 98,
        maxPerOrder: 4,
        isActive: true
      }
    ],
    isFree: false,
    totalCapacity: 700,
    ticketsSold: 385,
    status: 'published',
    isPublic: true,
    isFeatured: true,
    tags: ['Health', 'Wellness', 'Fitness', 'Nutrition', 'Mental Health'],
    views: 2156,
    likes: 128,
    shares: 45,
    publishedAt: new Date('2024-09-10T11:00:00Z')
  }
];

async function seedEvents() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowd_events');
    console.log('📦 Connected to MongoDB');

    // Drop and recreate the database to avoid index conflicts
    await mongoose.connection.db.dropDatabase();
    console.log('🗑️  Dropped database');

    // Create a default organizer user
    const organizer = new User({
      firstName: 'Event',
      lastName: 'Organizer',
      name: 'Event Organizer',
      email: 'organizer@crowdevents.com',
      password: 'password123', // This will be hashed automatically
      role: 'organizer',
      isVerified: true
    });
    await organizer.save();
    console.log('👤 Created default organizer user');

    // Add organizer info to events and save them one by one
    const createdEvents = [];
    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = {
        ...sampleEvents[i],
        organizerId: organizer._id,
        organizerName: organizer.name,
        organizerEmail: organizer.email
      };
      const event = new Event(eventData);
      const savedEvent = await event.save();
      createdEvents.push(savedEvent);
    }
    console.log(`✅ Successfully created ${createdEvents.length} events`);

    // Display summary
    const eventStats = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📊 Events by Category:');
    eventStats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} events`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n🔗 API Endpoints to test:');
    console.log('   GET /api/events - List all events');
    console.log('   GET /api/events?featured=true - Featured events');
    console.log('   GET /api/events/categories - Event categories');
    console.log('   GET /api/events/search?q=tech - Search events');
    console.log('   GET /api/events/[eventId] - Get specific event');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seeding
if (require.main === module) {
  seedEvents();
}

module.exports = { seedEvents, sampleEvents };