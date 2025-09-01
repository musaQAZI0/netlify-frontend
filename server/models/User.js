const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password required only if not Google OAuth user
    }
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  location: {
    city: String,
    state: String,
    country: String
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    eventReminders: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  loginMethod: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  authStatus: {
    isOnline: {
      type: Boolean,
      default: false
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    activeTokens: [{
      token: String,
      createdAt: {
        type: Date,
        default: Date.now
      },
      userAgent: String,
      ipAddress: String,
      lastUsed: {
        type: Date,
        default: Date.now
      }
    }],
    sessionCount: {
      type: Number,
      default: 0
    },
    lastLogout: Date,
    loginHistory: [{
      loginAt: Date,
      logoutAt: Date,
      ipAddress: String,
      userAgent: String,
      loginMethod: {
        type: String,
        enum: ['local', 'google']
      }
    }]
  }
}, {
  timestamps: true
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to set name field
userSchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.name = `${this.firstName} ${this.lastName}`;
  }
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to update authentication status on login
userSchema.methods.recordLogin = function(tokenData) {
  this.lastLogin = new Date();
  this.authStatus.isOnline = true;
  this.authStatus.lastActivity = new Date();
  this.authStatus.sessionCount += 1;
  
  // Add token to active tokens
  this.authStatus.activeTokens.push({
    token: tokenData.hashedToken || tokenData.token,
    userAgent: tokenData.userAgent,
    ipAddress: tokenData.ipAddress,
    lastUsed: new Date()
  });
  
  // Add to login history
  this.authStatus.loginHistory.push({
    loginAt: new Date(),
    ipAddress: tokenData.ipAddress,
    userAgent: tokenData.userAgent,
    loginMethod: this.loginMethod
  });
  
  // Keep only last 10 login history entries
  if (this.authStatus.loginHistory.length > 10) {
    this.authStatus.loginHistory = this.authStatus.loginHistory.slice(-10);
  }
  
  return this.save();
};

// Method to update authentication status on logout
userSchema.methods.recordLogout = function(token) {
  this.authStatus.isOnline = false;
  this.authStatus.lastLogout = new Date();
  this.authStatus.sessionCount = Math.max(0, this.authStatus.sessionCount - 1);
  
  // Remove token from active tokens
  if (token) {
    this.authStatus.activeTokens = this.authStatus.activeTokens.filter(
      activeToken => activeToken.token !== token
    );
  }
  
  // Update last login history entry with logout time
  if (this.authStatus.loginHistory.length > 0) {
    const lastLogin = this.authStatus.loginHistory[this.authStatus.loginHistory.length - 1];
    if (!lastLogin.logoutAt) {
      lastLogin.logoutAt = new Date();
    }
  }
  
  return this.save();
};

// Method to update last activity
userSchema.methods.updateActivity = function() {
  this.authStatus.lastActivity = new Date();
  return this.save();
};

// Method to clean expired tokens
userSchema.methods.cleanExpiredTokens = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  this.authStatus.activeTokens = this.authStatus.activeTokens.filter(
    token => token.lastUsed > oneDayAgo
  );
  return this.save();
};

// Method to get authentication status
userSchema.methods.getAuthStatus = function() {
  return {
    isOnline: this.authStatus.isOnline,
    lastActivity: this.authStatus.lastActivity,
    lastLogin: this.lastLogin,
    lastLogout: this.authStatus.lastLogout,
    sessionCount: this.authStatus.sessionCount,
    activeTokensCount: this.authStatus.activeTokens.length
  };
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    firstName: this.firstName,
    lastName: this.lastName,
    role: this.role,
    profilePicture: this.profilePicture,
    location: this.location,
    isVerified: this.isVerified,
    createdAt: this.createdAt,
    loginMethod: this.loginMethod,
    authStatus: this.getAuthStatus(),
    profileUrl: `${baseUrl}/profile/${this._id}`,
    apiEndpoint: `${baseUrl}/api/users/${this._id}`
  };
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// Indexes are handled by unique: true in schema fields

module.exports = mongoose.model('User', userSchema);