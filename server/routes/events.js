const express = require('express');
const { authenticateToken, requireOrganizer } = require('../middleware/auth');

const router = express.Router();

// Sample events data for testing
const sampleEvents = [
  {
    _id: '1',
    title: 'Tech Conference 2024',
    description: 'Join us for the biggest tech conference of the year with industry leaders and innovators.',
    date: '2024-10-15T09:00:00Z',
    location: 'San Francisco, CA',
    price: 299,
    category: 'Technology',
    imageUrl: 'https://via.placeholder.com/400x300/007bff/ffffff?text=Tech+Conference',
    featured: true
  },
  {
    _id: '2',
    title: 'Music Festival Summer',
    description: 'Experience the best live music with top artists from around the world.',
    date: '2024-09-20T18:00:00Z',
    location: 'Austin, TX',
    price: 150,
    category: 'Music',
    imageUrl: 'https://via.placeholder.com/400x300/28a745/ffffff?text=Music+Festival',
    featured: true
  },
  {
    _id: '3',
    title: 'Food & Wine Expo',
    description: 'Taste the finest cuisine and wines from local and international chefs.',
    date: '2024-09-25T12:00:00Z',
    location: 'New York, NY',
    price: 75,
    category: 'Food & Drink',
    imageUrl: 'https://via.placeholder.com/400x300/dc3545/ffffff?text=Food+%26+Wine',
    featured: false
  },
  {
    _id: '4',
    title: 'Art Gallery Opening',
    description: 'Discover contemporary art from emerging and established artists.',
    date: '2024-09-30T19:00:00Z',
    location: 'Los Angeles, CA',
    price: 0,
    category: 'Arts & Culture',
    imageUrl: 'https://via.placeholder.com/400x300/6f42c1/ffffff?text=Art+Gallery',
    featured: true
  },
  {
    _id: '5',
    title: 'Startup Pitch Night',
    description: 'Watch innovative startups pitch their ideas to top investors.',
    date: '2024-10-05T18:30:00Z',
    location: 'Seattle, WA',
    price: 50,
    category: 'Business',
    imageUrl: 'https://via.placeholder.com/400x300/17a2b8/ffffff?text=Startup+Pitch',
    featured: false
  }
];

// Get all events
router.get('/', async (req, res) => {
  try {
    const { featured, category, q, location } = req.query;
    
    let filteredEvents = [...sampleEvents];
    
    // Filter by featured
    if (featured === 'true') {
      filteredEvents = filteredEvents.filter(event => event.featured);
    }
    
    // Filter by category
    if (category) {
      filteredEvents = filteredEvents.filter(event => 
        event.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    // Search by query
    if (q) {
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(q.toLowerCase()) ||
        event.description.toLowerCase().includes(q.toLowerCase()) ||
        event.category.toLowerCase().includes(q.toLowerCase())
      );
    }
    
    // Filter by location
    if (location) {
      filteredEvents = filteredEvents.filter(event => 
        event.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    res.json(filteredEvents);
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Search events
router.get('/search', async (req, res) => {
  try {
    const { q, location } = req.query;
    
    let filteredEvents = [...sampleEvents];
    
    // Search by query
    if (q) {
      filteredEvents = filteredEvents.filter(event => 
        event.title.toLowerCase().includes(q.toLowerCase()) ||
        event.description.toLowerCase().includes(q.toLowerCase()) ||
        event.category.toLowerCase().includes(q.toLowerCase())
      );
    }
    
    // Filter by location
    if (location) {
      filteredEvents = filteredEvents.filter(event => 
        event.location.toLowerCase().includes(location.toLowerCase())
      );
    }
    
    res.json(filteredEvents);
  } catch (error) {
    console.error('Events search error:', error);
    res.status(500).json({ message: 'Failed to search events' });
  }
});

// Create event (organizer only)
router.post('/', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    // Placeholder for event creation
    res.json({
      success: true,
      message: 'Event creation endpoint ready - implement Event model and logic'
    });
  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

module.exports = router;