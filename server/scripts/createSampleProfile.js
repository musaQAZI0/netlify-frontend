const mongoose = require('mongoose');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
require('dotenv').config();

const createSampleProfile = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crowd_events');
    console.log('Connected to MongoDB');

    // Create or find Dave user
    let daveUser = await User.findOne({ email: 'dave@example.com' });
    
    if (!daveUser) {
      daveUser = new User({
        firstName: 'Dave',
        lastName: 'Wilson',
        email: 'dave@example.com',
        password: 'hashedpassword123', // In real app, this would be properly hashed
        role: 'organizer',
        name: 'Dave Wilson'
      });
      await daveUser.save();
      console.log('Created Dave user:', daveUser._id);
    } else {
      console.log('Found existing Dave user:', daveUser._id);
    }

    // Check if Dave already has an organizer profile
    let daveOrganizer = await Organizer.findOne({ userId: daveUser._id });
    
    if (daveOrganizer) {
      console.log('Dave already has an organizer profile:', daveOrganizer._id);
    } else {
      // Create Dave's organizer profile
      daveOrganizer = new Organizer({
        userId: daveUser._id,
        name: 'Dave Wilson',
        bio: 'Experienced event organizer specializing in tech conferences and music festivals. Passionate about creating memorable experiences that bring communities together.',
        website: 'https://davewilsonevents.com',
        contactEmail: 'dave@davewilsonevents.com',
        phone: '+1-555-0123',
        organizationName: 'Wilson Events Co.',
        facebookUrl: 'https://facebook.com/davewilsonevents',
        twitterHandle: '@davewilsonevents',
        instagramHandle: '@davewilsonevents',
        linkedinUrl: 'https://linkedin.com/in/davewilsonevents',
        address: {
          street: '123 Event Plaza',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'USA'
        },
        emailOptIn: true,
        eventsCount: 15,
        totalTicketsSold: 2500,
        totalRevenue: 125000
      });

      await daveOrganizer.save();
      console.log('Created Dave organizer profile:', daveOrganizer._id);
    }

    console.log('\n=== Dave Organizer Profile ===');
    console.log('User ID:', daveUser._id);
    console.log('Organizer ID:', daveOrganizer._id);
    console.log('Name:', daveOrganizer.name);
    console.log('Organization:', daveOrganizer.organizationName);
    console.log('Website:', daveOrganizer.website);
    console.log('Events Count:', daveOrganizer.eventsCount);
    console.log('Total Tickets Sold:', daveOrganizer.totalTicketsSold);
    console.log('Total Revenue: $', daveOrganizer.totalRevenue);

  } catch (error) {
    console.error('Error creating sample profile:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

createSampleProfile();