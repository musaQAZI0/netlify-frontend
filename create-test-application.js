const mongoose = require('mongoose');
const PartnershipApplication = require('./server/database/models/PartnershipApplication');
const User = require('./server/database/models/User');

async function createTestApplication() {
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

        // Create test influencer application
        const influencerApp = new PartnershipApplication({
            userId: testUser._id,
            applicationType: 'influencer',
            contactInfo: {
                fullName: 'Test Influencer Creator',
                email: 'test@example.com',
                phone: '+1-555-0123'
            },
            businessInfo: {
                businessName: 'Creator Studios Inc',
                website: 'https://creatorstudios.com',
                businessRegistration: 'REG123456',
                taxId: 'TAX789012'
            },
            influencerDetails: {
                niche: 'lifestyle',
                followers: {
                    instagram: 25000,
                    tiktok: 15000,
                    youtube: 5000
                },
                engagementRate: 4.2,
                previousBrands: ['Nike', 'Adidas', 'Apple'],
                contentTypes: ['photos', 'videos', 'stories'],
                ratesAndPackages: {
                    postRate: 500,
                    storyRate: 200,
                    videoRate: 1000
                }
            },
            status: 'pending'
        });

        await influencerApp.save();
        console.log('✅ Created test influencer application:', influencerApp._id);

        // Create test venue application
        const venueApp = new PartnershipApplication({
            userId: testUser._id,
            applicationType: 'venue',
            contactInfo: {
                fullName: 'Mike Venue Owner',
                email: 'test@example.com',
                phone: '+1-555-0456'
            },
            businessInfo: {
                businessName: 'The Downtown Event Space',
                website: 'https://downtownspace.com',
                businessRegistration: 'VEN654321',
                taxId: 'TAX345678'
            },
            venueDetails: {
                venueType: 'event_hall',
                capacity: 200,
                location: {
                    address: '123 Main Street',
                    city: 'New York',
                    state: 'NY',
                    zipCode: '10001',
                    country: 'USA'
                },
                amenities: ['sound_system', 'lighting', 'catering_kitchen', 'parking'],
                availability: {
                    daysAvailable: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
                    timeSlots: [
                        { start: '09:00', end: '23:00' }
                    ]
                },
                pricing: {
                    hourlyRate: 150,
                    dailyRate: 1000,
                    packageDeals: true
                },
                insurance: {
                    provider: 'VenueCare Insurance',
                    policyNumber: 'POL123456',
                    coverage: 2000000
                }
            },
            status: 'under_review'
        });

        await venueApp.save();
        console.log('✅ Created test venue application:', venueApp._id);

        // Create another application with different status
        const approvedApp = new PartnershipApplication({
            userId: testUser._id,
            applicationType: 'influencer',
            contactInfo: {
                fullName: 'Approved Influencer',
                email: 'approved@example.com',
                phone: '+1-555-0789'
            },
            businessInfo: {
                businessName: 'Approved Creator LLC',
                website: 'https://approved.com'
            },
            influencerDetails: {
                niche: 'fitness',
                followers: {
                    instagram: 50000
                },
                engagementRate: 5.1
            },
            status: 'approved'
        });

        await approvedApp.save();
        console.log('✅ Created approved application:', approvedApp._id);

        console.log('\n📊 Application Summary:');
        const stats = await PartnershipApplication.aggregate([
            {
                $group: {
                    _id: {
                        type: '$applicationType',
                        status: '$status'
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
        
        stats.forEach(stat => {
            console.log(`${stat._id.type} (${stat._id.status}): ${stat.count}`);
        });

    } catch (error) {
        console.error('Error creating test applications:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Test applications created successfully!');
        console.log('You can now test the admin dashboard at: https://crowd-backend-zxxp.onrender.com/admin-applications.html');
    }
}

createTestApplication();