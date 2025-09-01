const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin-specific authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Admin access token required',
        adminEndpoint: `${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001'}/api/auth/admin/login`
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Admin user not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Admin account deactivated' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.',
        currentRole: user.role,
        requiredRole: 'admin'
      });
    }

    // Check if token is in active tokens list
    const hasActiveToken = user.authStatus.activeTokens.some(activeToken => 
      activeToken.token === token
    );

    if (!hasActiveToken) {
      return res.status(401).json({ message: 'Admin token not found in active sessions' });
    }

    // Update admin activity
    await updateAdminActivity(user, token, req);
    
    req.user = user;
    req.currentToken = token;
    req.isAdmin = true;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid admin token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Admin token expired' });
    }
    console.error('Admin auth middleware error:', error);
    return res.status(500).json({ message: 'Admin authentication error' });
  }
};

// Update admin activity with enhanced tracking
const updateAdminActivity = async (user, token, req) => {
  const tokenIndex = user.authStatus.activeTokens.findIndex(
    activeToken => activeToken.token === token
  );
  
  if (tokenIndex !== -1) {
    user.authStatus.activeTokens[tokenIndex].lastUsed = new Date();
    user.authStatus.lastActivity = new Date();
    
    // Log admin activity for security
    console.log(`Admin activity: ${user.email} accessed ${req.method} ${req.path} from ${req.ip} at ${new Date()}`);
    
    await user.save();
  }
};

// Super admin middleware (for most sensitive operations)
const requireSuperAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Super admin access required',
        currentRole: req.user ? req.user.role : 'none'
      });
    }

    // Check for super admin flag or specific admin level
    if (!req.user.isSuperAdmin && !process.env.SUPER_ADMIN_EMAILS?.split(',').includes(req.user.email)) {
      return res.status(403).json({ 
        message: 'Super admin privileges required for this action'
      });
    }

    next();
  } catch (error) {
    console.error('Super admin middleware error:', error);
    return res.status(500).json({ message: 'Super admin authentication error' });
  }
};

// Admin panel access middleware
const requireAdminPanel = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Admin panel access denied',
        loginUrl: `${process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001'}/admin/login`,
        currentRole: req.user ? req.user.role : 'none'
      });
    }

    // Set admin panel context
    req.adminPanelAccess = true;
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
    req.adminUrls = {
      dashboard: `${baseUrl}/admin/dashboard`,
      users: `${baseUrl}/admin/users`,
      events: `${baseUrl}/admin/events`,
      apps: `${baseUrl}/admin/apps`,
      settings: `${baseUrl}/admin/settings`
    };

    next();
  } catch (error) {
    console.error('Admin panel middleware error:', error);
    return res.status(500).json({ message: 'Admin panel authentication error' });
  }
};

// Audit trail middleware for admin actions
const auditAdminAction = (action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return next();
      }

      // Log the admin action
      const auditLog = {
        adminId: req.user._id,
        adminEmail: req.user.email,
        action: action,
        method: req.method,
        path: req.path,
        body: req.method !== 'GET' ? req.body : null,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      };

      console.log('ADMIN AUDIT:', JSON.stringify(auditLog, null, 2));
      
      // Store audit log in database if needed
      // await AuditLog.create(auditLog);

      next();
    } catch (error) {
      console.error('Audit middleware error:', error);
      next(); // Continue even if audit fails
    }
  };
};

// Rate limiting for admin endpoints
const adminRateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for admin users
  message: {
    error: 'Too many admin requests, please try again later.',
    retryAfter: '15 minutes',
    adminSupport: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com/admin/support' 
      : 'http://localhost:3001/admin/support'
  }
};

// Admin session validation
const validateAdminSession = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next();
    }

    // Check if admin session is still valid
    const user = await User.findById(req.user._id).select('authStatus isActive role');
    
    if (!user || !user.isActive || user.role !== 'admin') {
      return res.status(401).json({ 
        message: 'Admin session invalid',
        action: 'Please log in again'
      });
    }

    // Check for suspicious activity (optional)
    const lastActivity = user.authStatus.lastActivity;
    const timeSinceActivity = new Date() - new Date(lastActivity);
    const maxIdleTime = 2 * 60 * 60 * 1000; // 2 hours

    if (timeSinceActivity > maxIdleTime) {
      return res.status(401).json({ 
        message: 'Admin session expired due to inactivity',
        action: 'Please log in again'
      });
    }

    next();
  } catch (error) {
    console.error('Admin session validation error:', error);
    return res.status(500).json({ message: 'Session validation error' });
  }
};

// Get admin dashboard data
const getAdminDashboardData = async () => {
  try {
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
    
    return {
      endpoints: {
        users: `${baseUrl}/api/admin/users`,
        events: `${baseUrl}/api/admin/events`,
        apps: `${baseUrl}/api/admin/apps`,
        analytics: `${baseUrl}/api/admin/analytics`,
        settings: `${baseUrl}/api/admin/settings`
      },
      navigation: {
        dashboard: `${baseUrl}/admin`,
        userManagement: `${baseUrl}/admin/users`,
        eventManagement: `${baseUrl}/admin/events`,
        appMarketplace: `${baseUrl}/admin/apps`,
        analytics: `${baseUrl}/admin/analytics`,
        settings: `${baseUrl}/admin/settings`
      }
    };
  } catch (error) {
    console.error('Error getting admin dashboard data:', error);
    return null;
  }
};

module.exports = {
  authenticateAdmin,
  requireSuperAdmin,
  requireAdminPanel,
  auditAdminAction,
  adminRateLimit,
  validateAdminSession,
  getAdminDashboardData,
  updateAdminActivity
};