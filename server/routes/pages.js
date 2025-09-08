const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is authenticated (optional)
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.session.token;
  
  if (token) {
    // Try to authenticate but don't require it
    authenticateToken(req, res, (err) => {
      // Continue regardless of authentication result
      next();
    });
  } else {
    next();
  }
};

// Home page
router.get('/', optionalAuth, (req, res) => {
  res.render('pages/index', {
    title: 'Crowd - Discover Events Near You',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

// Authentication pages
router.get('/login', (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('pages/login', {
    title: 'Log In - Crowd',
    layout: 'layouts/auth'
  });
});

router.get('/signup', (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('pages/signup', {
    title: 'Sign Up - Crowd',
    layout: 'layouts/auth'
  });
});

// Event pages
router.get('/events', optionalAuth, (req, res) => {
  res.render('pages/events', {
    title: 'Events - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/create-events', authenticateToken, (req, res) => {
  res.render('pages/create-events', {
    title: 'Create Events - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

router.get('/event-builder', authenticateToken, (req, res) => {
  res.render('pages/event-builder', {
    title: 'Event Builder - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

// Dashboard pages (require authentication)
router.get('/dashboard', authenticateToken, (req, res) => {
  res.render('pages/dashboard-home', {
    title: 'Dashboard - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

router.get('/organizer-dashboard', authenticateToken, (req, res) => {
  if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
    return res.redirect('/dashboard');
  }
  res.render('pages/organizer-dashboard', {
    title: 'Organizer Dashboard - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

// Profile pages
router.get('/settings', authenticateToken, (req, res) => {
  res.render('pages/settings-new', {
    title: 'Settings - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

router.get('/profile', authenticateToken, (req, res) => {
  res.render('pages/profile', {
    title: 'My Profile - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

// Event management pages
router.get('/analytics', authenticateToken, (req, res) => {
  res.render('pages/analytics', {
    title: 'Analytics - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

router.get('/finance', authenticateToken, (req, res) => {
  res.render('pages/finance', {
    title: 'Finance - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

router.get('/orders', authenticateToken, (req, res) => {
  res.render('pages/orders', {
    title: 'Orders - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

// Help and Support pages
router.get('/help-center', optionalAuth, (req, res) => {
  const template = req.user ? 'pages/help-center-logged' : 'pages/help-center';
  res.render(template, {
    title: 'Help Center - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

// Help Center specific pages
router.get('/help/buy-and-register', optionalAuth, (req, res) => {
  res.render('help/buy-and-register', {
    title: 'Buy and register for events - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/contact-organizer', optionalAuth, (req, res) => {
  res.render('help/contact-organizer', {
    title: 'Contact an event organizer - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/request-refund', optionalAuth, (req, res) => {
  res.render('help/request-refund', {
    title: 'Request a refund - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/managing-orders', optionalAuth, (req, res) => {
  res.render('help/managing-orders', {
    title: 'Managing orders - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/create-edit-tickets', optionalAuth, (req, res) => {
  res.render('help/create-edit-tickets', {
    title: 'Create and edit ticket types - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/add-images-video', optionalAuth, (req, res) => {
  res.render('help/add-images-video', {
    title: 'Add images and video to events - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/payout-methods', optionalAuth, (req, res) => {
  res.render('help/payout-methods', {
    title: 'Add and manage payout methods - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/troubleshoot-payout', optionalAuth, (req, res) => {
  res.render('help/troubleshoot-payout', {
    title: 'Troubleshoot delayed or missing payout - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/marketing-events', optionalAuth, (req, res) => {
  res.render('help/marketing-events', {
    title: 'Marketing an event - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/issue-refund', optionalAuth, (req, res) => {
  res.render('help/issue-refund', {
    title: 'Issue a full or partial refund - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/payouts-taxes', optionalAuth, (req, res) => {
  res.render('help/payouts-taxes', {
    title: 'Payouts and taxes - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/terms-policies', optionalAuth, (req, res) => {
  res.render('help/terms-policies', {
    title: 'Terms and policies - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/your-tickets', optionalAuth, (req, res) => {
  res.render('help/your-tickets', {
    title: 'Your tickets - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/buy-and-register-new', optionalAuth, (req, res) => {
  res.render('help/buy-and-register-new', {
    title: 'Buy and register for events (Updated) - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/help/terms-policies-new', optionalAuth, (req, res) => {
  res.render('help/terms-policies-new', {
    title: 'Terms and policies (Updated) - Crowd Help Center',
    layout: 'layouts/help-center',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/contact-sales', optionalAuth, (req, res) => {
  const template = req.user ? 'pages/contact-sales-logged' : 'pages/contact-sales';
  res.render(template, {
    title: 'Contact Sales - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

// Category pages
router.get('/music-events', optionalAuth, (req, res) => {
  const template = req.user ? 'pages/music-events-logged' : 'pages/music-events';
  res.render(template, {
    title: 'Music Events - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/hobbies-events', optionalAuth, (req, res) => {
  const template = req.user ? 'pages/hobbies-events-logged' : 'pages/hobbies-events';
  res.render(template, {
    title: 'Hobbies Events - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/holiday-events', optionalAuth, (req, res) => {
  const template = req.user ? 'pages/holiday-events-logged' : 'pages/holiday-events';
  res.render(template, {
    title: 'Holiday Events - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/dating', optionalAuth, (req, res) => {
  res.render('pages/dating', {
    title: 'Dating Events - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/nightlife', optionalAuth, (req, res) => {
  res.render('pages/nightlife', {
    title: 'Nightlife Events - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/performing-visual-arts', optionalAuth, (req, res) => {
  res.render('pages/performing-visual-arts', {
    title: 'Performing & Visual Arts Projects - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

// Ticket and order pages
router.get('/tickets', authenticateToken, (req, res) => {
  res.render('pages/tickets-profile', {
    title: 'My Tickets - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

router.get('/checkout', optionalAuth, (req, res) => {
  res.render('pages/checkout', {
    title: 'Checkout - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

// Business pages
router.get('/pricing', optionalAuth, (req, res) => {
  res.render('pages/pricing', {
    title: 'Pricing - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

router.get('/marketplace', optionalAuth, (req, res) => {
  res.render('pages/app-marketplace', {
    title: 'App Marketplace - Crowd',
    user: req.user,
    isAuthenticated: !!req.user
  });
});

// Admin pages (require admin role)
router.get('/admin', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('pages/error', {
      title: 'Access Denied - Crowd',
      error: { status: 403, message: 'Access denied' },
      user: req.user,
      isAuthenticated: true
    });
  }
  res.render('pages/admin-applications', {
    title: 'Admin Dashboard - Crowd',
    user: req.user,
    isAuthenticated: true
  });
});

// Error handling for non-API routes only
router.use((req, res, next) => {
  // Skip API routes - let them be handled by the API routers
  if (req.originalUrl.startsWith('/api/')) {
    return next();
  }
  
  res.status(404).render('pages/error', {
    title: 'Page Not Found - Crowd',
    error: { status: 404, message: 'Page not found' },
    user: req.user,
    isAuthenticated: !!req.user
  });
});

module.exports = router;