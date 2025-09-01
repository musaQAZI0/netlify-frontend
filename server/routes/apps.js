const express = require('express');
const router = express.Router();
const { authenticateToken, requireOrganizer, requireAdmin } = require('../middleware/auth');
const App = require('../models/App');
const Joi = require('joi');

const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';

// Validation schemas
const appSchema = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().required(),
  shortDescription: Joi.string().max(200),
  category: Joi.string().valid('Marketing', 'Analytics', 'Payment', 'Communication', 'Design', 'Productivity', 'Integration', 'Other').required(),
  subcategory: Joi.string().optional(),
  icon: Joi.string().uri().required(),
  screenshots: Joi.array().items(Joi.string().uri()).optional(),
  bannerImage: Joi.string().uri().optional(),
  pricing: Joi.object({
    type: Joi.string().valid('free', 'paid', 'freemium', 'subscription').default('free'),
    price: Joi.number().min(0).default(0),
    currency: Joi.string().default('USD'),
    billingCycle: Joi.string().valid('one-time', 'monthly', 'yearly').default('one-time')
  }).optional(),
  technical: Joi.object({
    apiVersion: Joi.string(),
    webhookUrl: Joi.string().uri(),
    redirectUrls: Joi.array().items(Joi.string().uri()),
    permissions: Joi.array().items(Joi.object({
      name: Joi.string(),
      description: Joi.string(),
      required: Joi.boolean().default(false)
    })),
    integrationMethod: Joi.string().valid('api', 'webhook', 'iframe', 'redirect').default('api'),
    supportedEvents: Joi.array().items(Joi.string())
  }).optional(),
  documentation: Joi.object({
    setupGuide: Joi.string(),
    apiDocs: Joi.string(),
    supportEmail: Joi.string().email(),
    supportUrl: Joi.string().uri()
  }).optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

const reviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().optional(),
  comment: Joi.string().optional()
});

// Get all public apps (marketplace)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const category = req.query.category;
    const search = req.query.search;
    const featured = req.query.featured === 'true';

    let query = { status: 'approved', isPublic: true };
    
    if (category) {
      query.category = category;
    }
    
    if (featured) {
      query.isFeatured = true;
    }

    let apps;
    if (search) {
      apps = await App.searchApps(search);
    } else {
      apps = await App.find(query)
        .sort({ rating: -1, installations: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const totalApps = await App.countDocuments(query);
    const publicApps = apps.map(app => app.getPublicData());

    res.json({
      success: true,
      data: publicApps,
      meta: {
        page,
        limit,
        total: totalApps,
        hasMore: (page * limit) < totalApps,
        filters: {
          category: category || 'all',
          search: search || null,
          featured
        }
      },
      links: {
        marketplace: `${baseUrl}/apps`,
        api: `${baseUrl}/api/apps`,
        categories: `${baseUrl}/api/apps/categories`,
        featured: `${baseUrl}/api/apps?featured=true`
      }
    });
  } catch (error) {
    console.error('Error fetching apps:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching apps' 
    });
  }
});

// Get featured apps
router.get('/featured', async (req, res) => {
  try {
    const apps = await App.findFeatured();
    const publicApps = apps.map(app => app.getPublicData());

    res.json({
      success: true,
      data: publicApps,
      meta: {
        total: publicApps.length
      },
      links: {
        allApps: `${baseUrl}/api/apps`,
        marketplace: `${baseUrl}/apps`
      }
    });
  } catch (error) {
    console.error('Error fetching featured apps:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching featured apps' 
    });
  }
});

// Get app categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await App.aggregate([
      { $match: { status: 'approved', isPublic: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: categories.map(cat => ({
        name: cat._id,
        count: cat.count,
        url: `${baseUrl}/api/apps?category=${encodeURIComponent(cat._id)}`
      })),
      links: {
        apps: `${baseUrl}/api/apps`,
        marketplace: `${baseUrl}/apps`
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching categories' 
    });
  }
});

// Get specific app by ID
router.get('/:id', async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    
    if (!app || (app.status !== 'approved' && !app.isPublic)) {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found',
        availableApps: `${baseUrl}/api/apps`
      });
    }

    // Increment view count
    app.views += 1;
    await app.save();

    res.json({
      success: true,
      data: app.getPublicData(),
      links: {
        install: `${baseUrl}/api/apps/${app._id}/install`,
        reviews: `${baseUrl}/api/apps/${app._id}/reviews`,
        developer: `${baseUrl}/api/users/${app.developerId}`,
        marketplace: `${baseUrl}/apps`
      }
    });
  } catch (error) {
    console.error('Error fetching app:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching app' 
    });
  }
});

// Create new app (requires organizer or admin)
router.post('/', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const { error, value } = appSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        details: error.details 
      });
    }

    const appData = {
      ...value,
      developerId: req.user._id,
      developerName: req.user.name,
      developerEmail: req.user.email
    };

    const app = new App(appData);
    await app.save();

    res.status(201).json({
      success: true,
      message: 'App created successfully',
      data: app.getPublicData(),
      links: {
        app: `${baseUrl}/api/apps/${app._id}`,
        edit: `${baseUrl}/api/apps/${app._id}`,
        myApps: `${baseUrl}/api/apps/developer/${req.user._id}`
      }
    });
  } catch (error) {
    console.error('Error creating app:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating app' 
    });
  }
});

// Update app (developer or admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    
    if (!app) {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found' 
      });
    }

    // Check permissions
    if (app.developerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const { error, value } = appSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        details: error.details 
      });
    }

    Object.assign(app, value);
    await app.save();

    res.json({
      success: true,
      message: 'App updated successfully',
      data: app.getPublicData()
    });
  } catch (error) {
    console.error('Error updating app:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating app' 
    });
  }
});

// Install app (authenticated users only)
router.post('/:id/install', authenticateToken, async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    
    if (!app || app.status !== 'approved') {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found or not approved' 
      });
    }

    // Increment installation count
    app.installations += 1;
    app.activeUsers += 1;
    await app.save();

    // Here you would typically create an installation record
    // and handle any app-specific setup

    res.json({
      success: true,
      message: 'App installed successfully',
      data: {
        appId: app._id,
        appName: app.name,
        installationDate: new Date(),
        status: 'active'
      },
      links: {
        app: `${baseUrl}/api/apps/${app._id}`,
        uninstall: `${baseUrl}/api/apps/${app._id}/uninstall`,
        myApps: `${baseUrl}/api/users/${req.user._id}/apps`
      }
    });
  } catch (error) {
    console.error('Error installing app:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error installing app' 
    });
  }
});

// Add review to app
router.post('/:id/reviews', authenticateToken, async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    
    if (!app || app.status !== 'approved') {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found or not approved' 
      });
    }

    const { error, value } = reviewSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        details: error.details 
      });
    }

    const reviewData = {
      ...value,
      userId: req.user._id,
      userName: req.user.name
    };

    await app.addReview(reviewData);

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      links: {
        app: `${baseUrl}/api/apps/${app._id}`,
        reviews: `${baseUrl}/api/apps/${app._id}/reviews`
      }
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding review' 
    });
  }
});

// Get app reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const app = await App.findById(req.params.id);
    
    if (!app) {
      return res.status(404).json({ 
        success: false, 
        message: 'App not found' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = app.reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    res.json({
      success: true,
      data: reviews,
      meta: {
        page,
        limit,
        total: app.reviews.length,
        hasMore: (skip + limit) < app.reviews.length,
        rating: app.rating
      },
      links: {
        app: `${baseUrl}/api/apps/${app._id}`,
        addReview: `${baseUrl}/api/apps/${app._id}/reviews`
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching reviews' 
    });
  }
});

// Get apps by developer
router.get('/developer/:developerId', async (req, res) => {
  try {
    const apps = await App.find({ 
      developerId: req.params.developerId,
      status: 'approved',
      isPublic: true
    });

    const publicApps = apps.map(app => app.getPublicData());

    res.json({
      success: true,
      data: publicApps,
      meta: {
        total: publicApps.length,
        developerId: req.params.developerId
      },
      links: {
        developer: `${baseUrl}/api/users/${req.params.developerId}`,
        allApps: `${baseUrl}/api/apps`
      }
    });
  } catch (error) {
    console.error('Error fetching developer apps:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching developer apps' 
    });
  }
});

// Health check for apps API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Apps API',
    timestamp: new Date().toISOString(),
    endpoints: {
      marketplace: `${baseUrl}/api/apps`,
      featured: `${baseUrl}/api/apps/featured`,
      categories: `${baseUrl}/api/apps/categories`,
      install: `${baseUrl}/api/apps/:id/install`,
      reviews: `${baseUrl}/api/apps/:id/reviews`
    }
  });
});

module.exports = router;