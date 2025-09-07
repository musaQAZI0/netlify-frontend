const express = require('express');
const { authenticateToken, requireOrganizer } = require('../middleware/auth');
const Event = require('../models/Event');

const router = express.Router();

// Get all published events with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      featured, 
      category, 
      q, 
      location, 
      startDate, 
      endDate, 
      isFree, 
      minPrice, 
      maxPrice,
      page = 1, 
      limit = 20,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;
    
    // Build query object
    let query = { 
      status: 'published', 
      isPublic: true,
      startDate: { $gte: new Date() } // Only future events
    };
    
    // Filter by featured
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    // Filter by category
    if (category) {
      query.category = new RegExp(category, 'i');
    }
    
    // Search by query (title, description, tags)
    if (q) {
      query.$or = [
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } },
        { category: new RegExp(q, 'i') }
      ];
    }
    
    // Filter by location
    if (location) {
      query.$or = [
        { 'location.venue': new RegExp(location, 'i') },
        { 'location.address.city': new RegExp(location, 'i') },
        { 'location.address.state': new RegExp(location, 'i') },
        { 'location.address.country': new RegExp(location, 'i') }
      ];
    }
    
    // Filter by date range
    if (startDate) {
      query.startDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.startDate.$lte = new Date(endDate);
    }
    
    // Filter by price
    if (isFree === 'true') {
      query.isFree = true;
    } else {
      if (minPrice || maxPrice) {
        query['ticketTypes.price'] = {};
        if (minPrice) query['ticketTypes.price'].$gte = parseFloat(minPrice);
        if (maxPrice) query['ticketTypes.price'].$lte = parseFloat(maxPrice);
      }
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .sort(sortOptions)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalEvents = await Event.countDocuments(query);
    
    // Format response
    const formattedEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      description: event.description,
      category: event.category,
      subcategory: event.subcategory,
      organizer: event.organizerId ? {
        id: event.organizerId._id,
        name: event.organizerName || event.organizerId.name,
        email: event.organizerEmail || event.organizerId.email
      } : {
        id: null,
        name: event.organizerName || 'Unknown Organizer',
        email: event.organizerEmail || 'No Email'
      },
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone,
      location: {
        type: event.location.type,
        venue: event.location.venue,
        address: event.location.address,
        onlineDetails: event.location.onlineDetails
      },
      images: event.images,
      primaryImage: event.primaryImage || event.images?.[0]?.url,
      ticketTypes: event.ticketTypes,
      isFree: event.isFree,
      totalCapacity: event.totalCapacity,
      ticketsSold: event.ticketsSold,
      ticketsAvailable: event.totalCapacity - event.ticketsSold,
      isSoldOut: event.totalCapacity && event.ticketsSold >= event.totalCapacity,
      isFeatured: event.isFeatured,
      tags: event.tags,
      views: event.views,
      likes: event.likes,
      publishedAt: event.publishedAt,
      createdAt: event.createdAt,
      eventUrl: `${req.protocol}://${req.get('host')}/event/${event._id}`,
      slug: event.slug
    }));
    
    res.json({
      success: true,
      events: formattedEvents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEvents / parseInt(limit)),
        totalEvents,
        eventsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < Math.ceil(totalEvents / parseInt(limit)),
        hasPrevPage: parseInt(page) > 1
      }
    });
    
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Search events endpoint
router.get('/search', async (req, res) => {
  try {
    const { q, location, category, limit = 10 } = req.query;
    
    if (!q && !location && !category) {
      return res.status(400).json({
        success: false,
        message: 'At least one search parameter (q, location, or category) is required'
      });
    }
    
    let query = { 
      status: 'published', 
      isPublic: true,
      startDate: { $gte: new Date() }
    };
    
    const searchConditions = [];
    
    if (q) {
      searchConditions.push(
        { title: new RegExp(q, 'i') },
        { description: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } }
      );
    }
    
    if (location) {
      searchConditions.push(
        { 'location.venue': new RegExp(location, 'i') },
        { 'location.address.city': new RegExp(location, 'i') },
        { 'location.address.state': new RegExp(location, 'i') },
        { 'location.address.country': new RegExp(location, 'i') }
      );
    }
    
    if (category) {
      searchConditions.push({ category: new RegExp(category, 'i') });
    }
    
    if (searchConditions.length > 0) {
      query.$or = searchConditions;
    }
    
    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 })
      .limit(parseInt(limit));
    
    const formattedEvents = events.map(event => ({
      id: event._id,
      title: event.title,
      description: event.description,
      category: event.category,
      subcategory: event.subcategory,
      organizer: event.organizerId ? {
        id: event.organizerId._id,
        name: event.organizerName || event.organizerId.name,
        email: event.organizerEmail || event.organizerId.email
      } : {
        id: null,
        name: event.organizerName || 'Unknown Organizer',
        email: event.organizerEmail || 'No Email'
      },
      startDate: event.startDate,
      endDate: event.endDate,
      timezone: event.timezone,
      location: event.location,
      images: event.images,
      primaryImage: event.primaryImage || event.images?.[0]?.url,
      ticketTypes: event.ticketTypes,
      isFree: event.isFree,
      totalCapacity: event.totalCapacity,
      ticketsSold: event.ticketsSold,
      ticketsAvailable: event.totalCapacity - event.ticketsSold,
      isSoldOut: event.totalCapacity && event.ticketsSold >= event.totalCapacity,
      isFeatured: event.isFeatured,
      tags: event.tags,
      views: event.views,
      likes: event.likes,
      publishedAt: event.publishedAt,
      createdAt: event.createdAt,
      slug: event.slug
    }));
    
    res.json({
      success: true,
      results: formattedEvents.length,
      events: formattedEvents
    });
    
  } catch (error) {
    console.error('Events search error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to search events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get event categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Event.distinct('category', { 
      status: 'published', 
      isPublic: true 
    });
    
    const categoryStats = await Event.aggregate([
      { 
        $match: { 
          status: 'published', 
          isPublic: true,
          startDate: { $gte: new Date() }
        }
      },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          featuredCount: { 
            $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      categories: categoryStats.map(cat => ({
        name: cat._id,
        count: cat.count,
        featuredCount: cat.featuredCount
      }))
    });
    
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch categories' 
    });
  }
});

// Get single event by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const { includePrivate = false } = req.query;
    
    let query = {};
    
    // Check if it's an ObjectId or a slug
    if (idOrSlug.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = idOrSlug;
    } else {
      query.slug = idOrSlug;
    }
    
    // Add public/private filter
    if (!includePrivate) {
      query.status = 'published';
      query.isPublic = true;
    }
    
    const event = await Event.findOne(query)
      .populate('organizerId', 'name email profilePicture');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Increment view count
    await Event.findByIdAndUpdate(event._id, { $inc: { views: 1 } });
    
    res.json({
      success: true,
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory,
        organizer: {
          id: event.organizerId._id,
          name: event.organizerName || event.organizerId.name,
          email: event.organizerEmail || event.organizerId.email,
          profilePicture: event.organizerId.profilePicture
        },
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        location: event.location,
        images: event.images,
        primaryImage: event.primaryImage || event.images?.[0]?.url,
        ticketTypes: event.ticketTypes,
        isFree: event.isFree,
        totalCapacity: event.totalCapacity,
        ticketsSold: event.ticketsSold,
        ticketsAvailable: event.totalCapacity - event.ticketsSold,
        isSoldOut: event.totalCapacity && event.ticketsSold >= event.totalCapacity,
        isFeatured: event.isFeatured,
        tags: event.tags,
        goodToKnow: event.goodToKnow,
        views: event.views,
        likes: event.likes,
        publishedAt: event.publishedAt,
        createdAt: event.createdAt,
        slug: event.slug,
        eventUrl: `${req.protocol}://${req.get('host')}/event/${event._id}`
      }
    });
    
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event'
    });
  }
});

// Create event (organizer only - temporarily allow all authenticated users for testing)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizerId: req.user.id,
      organizerName: req.user.name,
      organizerEmail: req.user.email
    };
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (!eventData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }
    
    // Validate dates
    if (new Date(eventData.startDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Start date cannot be in the past'
      });
    }
    
    if (new Date(eventData.endDate) <= new Date(eventData.startDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }
    
    const event = new Event(eventData);
    await event.save();
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory,
        organizerId: event.organizerId,
        organizerName: event.organizerName,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        location: event.location,
        images: event.images,
        primaryImage: event.primaryImage || event.images?.[0]?.url,
        ticketTypes: event.ticketTypes,
        isFree: event.isFree,
        totalCapacity: event.totalCapacity,
        ticketsSold: event.ticketsSold,
        status: event.status,
        isPublic: event.isPublic,
        isFeatured: event.isFeatured,
        tags: event.tags,
        goodToKnow: event.goodToKnow,
        views: event.views,
        likes: event.likes,
        publishedAt: event.publishedAt,
        createdAt: event.createdAt,
        slug: event.slug
      }
    });
    
  } catch (error) {
    console.error('Event creation error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create event'
    });
  }
});

// Update event (owner or admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user owns this event or is admin
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }
    
    // Update event
    Object.assign(event, req.body);
    await event.save();
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory,
        organizerId: event.organizerId,
        organizerName: event.organizerName,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        location: event.location,
        images: event.images,
        primaryImage: event.primaryImage || event.images?.[0]?.url,
        ticketTypes: event.ticketTypes,
        isFree: event.isFree,
        totalCapacity: event.totalCapacity,
        ticketsSold: event.ticketsSold,
        status: event.status,
        isPublic: event.isPublic,
        isFeatured: event.isFeatured,
        tags: event.tags,
        goodToKnow: event.goodToKnow,
        views: event.views,
        likes: event.likes,
        publishedAt: event.publishedAt,
        createdAt: event.createdAt,
        slug: event.slug
      }
    });
    
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// Delete event (owner or admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user owns this event or is admin
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }
    
    // Soft delete by changing status to cancelled
    event.status = 'cancelled';
    await event.save();
    
    res.json({
      success: true,
      message: 'Event cancelled successfully'
    });
    
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

// Publish/Unpublish event
router.patch('/:id/publish', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { publish } = req.body;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if user owns this event
    if (event.organizerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this event'
      });
    }
    
    event.status = publish ? 'published' : 'draft';
    if (publish && !event.publishedAt) {
      event.publishedAt = new Date();
    }
    await event.save();
    
    res.json({
      success: true,
      message: `Event ${publish ? 'published' : 'unpublished'} successfully`,
      event: {
        id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory,
        organizerId: event.organizerId,
        organizerName: event.organizerName,
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        location: event.location,
        images: event.images,
        primaryImage: event.primaryImage || event.images?.[0]?.url,
        ticketTypes: event.ticketTypes,
        isFree: event.isFree,
        totalCapacity: event.totalCapacity,
        ticketsSold: event.ticketsSold,
        status: event.status,
        isPublic: event.isPublic,
        isFeatured: event.isFeatured,
        tags: event.tags,
        goodToKnow: event.goodToKnow,
        views: event.views,
        likes: event.likes,
        publishedAt: event.publishedAt,
        createdAt: event.createdAt,
        slug: event.slug
      }
    });
    
  } catch (error) {
    console.error('Event publish error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event status'
    });
  }
});

// Like/Unlike event
router.patch('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { like = true } = req.body;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const increment = like ? 1 : -1;
    event.likes = Math.max(0, event.likes + increment);
    await event.save();
    
    res.json({
      success: true,
      message: `Event ${like ? 'liked' : 'unliked'} successfully`,
      likes: event.likes
    });
    
  } catch (error) {
    console.error('Event like error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event likes'
    });
  }
});

// Get events by organizer
router.get('/organizer/:organizerId', async (req, res) => {
  try {
    const { organizerId } = req.params;
    const { includePrivate = false } = req.query;
    
    let query = { organizerId };
    
    if (!includePrivate) {
      query.status = 'published';
      query.isPublic = true;
    }
    
    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        category: event.category,
        subcategory: event.subcategory,
        organizer: event.organizerId ? {
          id: event.organizerId._id,
          name: event.organizerName || event.organizerId.name,
          email: event.organizerEmail || event.organizerId.email
        } : {
          id: null,
          name: event.organizerName || 'Unknown Organizer',
          email: event.organizerEmail || 'No Email'
        },
        startDate: event.startDate,
        endDate: event.endDate,
        timezone: event.timezone,
        location: event.location,
        images: event.images,
        primaryImage: event.primaryImage || event.images?.[0]?.url,
        ticketTypes: event.ticketTypes,
        isFree: event.isFree,
        totalCapacity: event.totalCapacity,
        ticketsSold: event.ticketsSold,
        ticketsAvailable: event.totalCapacity - event.ticketsSold,
        isSoldOut: event.totalCapacity && event.ticketsSold >= event.totalCapacity,
        isFeatured: event.isFeatured,
        tags: event.tags,
        views: event.views,
        likes: event.likes,
        publishedAt: event.publishedAt,
        createdAt: event.createdAt,
        slug: event.slug
      }))
    });
    
  } catch (error) {
    console.error('Organizer events fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizer events'
    });
  }
});

module.exports = router;