const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token with status tracking
const generateToken = async (user, req) => {
  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'your-jwt-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  // Record login with token information
  await user.recordLogin({
    token: token,
    userAgent: req.get('User-Agent') || 'Unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
  });

  return token;
};

// Generate JWT token (legacy function for backward compatibility)
const generateTokenSimple = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-jwt-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
};

// Authentication middleware with status tracking
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account deactivated' });
    }

    // Check if token is in active tokens list
    const hasActiveToken = user.authStatus.activeTokens.some(activeToken => 
      activeToken.token === token
    );

    if (!hasActiveToken) {
      return res.status(401).json({ message: 'Token not found in active sessions' });
    }

    // Update last activity and token usage
    await updateTokenActivity(user, token);
    
    // Clean expired tokens periodically
    await user.cleanExpiredTokens();

    req.user = user;
    req.currentToken = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Helper function to update token activity
const updateTokenActivity = async (user, token) => {
  const tokenIndex = user.authStatus.activeTokens.findIndex(
    activeToken => activeToken.token === token
  );
  
  if (tokenIndex !== -1) {
    user.authStatus.activeTokens[tokenIndex].lastUsed = new Date();
    user.authStatus.lastActivity = new Date();
    await user.save();
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Role-based authorization middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

// Organizer authorization middleware
const requireOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!['organizer', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      message: 'Access denied. Organizer privileges required.' 
    });
  }

  next();
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Admin privileges required.' 
    });
  }

  next();
};

// Check if user is authenticated (for passport sessions)
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Please log in to continue' });
};

// Logout function to handle status tracking
const logoutUser = async (user, token) => {
  try {
    await user.recordLogout(token);
    return true;
  } catch (error) {
    console.error('Error during logout:', error);
    return false;
  }
};

// Get authentication status for a user
const getUserAuthStatus = async (userId) => {
  try {
    const user = await User.findById(userId).select('authStatus lastLogin');
    if (!user) {
      return null;
    }
    const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
    return {
      ...user.getAuthStatus(),
      profileUrl: `${baseUrl}/profile/${userId}`,
      apiEndpoint: `${baseUrl}/api/users/${userId}`
    };
  } catch (error) {
    console.error('Error getting auth status:', error);
    return null;
  }
};

// Get all active sessions for a user
const getActiveSessions = async (userId) => {
  try {
    const user = await User.findById(userId).select('authStatus');
    if (!user) {
      return [];
    }
    return user.authStatus.activeTokens.map(token => ({
      createdAt: token.createdAt,
      lastUsed: token.lastUsed,
      userAgent: token.userAgent,
      ipAddress: token.ipAddress
    }));
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
};

// Revoke all sessions for a user
const revokeAllSessions = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    
    user.authStatus.activeTokens = [];
    user.authStatus.isOnline = false;
    user.authStatus.sessionCount = 0;
    user.authStatus.lastLogout = new Date();
    
    await user.save();
    return true;
  } catch (error) {
    console.error('Error revoking sessions:', error);
    return false;
  }
};

module.exports = {
  generateToken,
  generateTokenSimple,
  verifyToken,
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOrganizer,
  requireAdmin,
  ensureAuthenticated,
  logoutUser,
  getUserAuthStatus,
  getActiveSessions,
  revokeAllSessions,
  updateTokenActivity
};