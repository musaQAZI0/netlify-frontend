const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  
  // Collection Details
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creatorName: String,
  
  // Collection Type
  type: {
    type: String,
    enum: ['curated', 'automated', 'user_generated'],
    default: 'curated'
  },
  
  // Events in Collection
  events: [{
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    position: {
      type: Number,
      default: 0
    }
  }],
  
  // Collection Settings
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    autoUpdate: {
      type: Boolean,
      default: false
    },
    criteria: {
      categories: [String],
      tags: [String],
      dateRange: {
        start: Date,
        end: Date
      },
      location: {
        city: String,
        state: String,
        country: String,
        radius: Number
      },
      priceRange: {
        min: Number,
        max: Number
      }
    }
  },
  
  // Visual Elements
  image: String,
  color: {
    type: String,
    default: '#1a73e8'
  },
  
  // Stats
  stats: {
    views: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    follows: {
      type: Number,
      default: 0
    },
    totalEvents: {
      type: Number,
      default: 0
    }
  },
  
  // SEO
  slug: String,
  metaTitle: String,
  metaDescription: String,
  
  // Tags
  tags: [String],
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active'
  },
  
  // Followers
  followers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    followedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Last Update
  lastUpdated: Date,
  lastAutoUpdate: Date
}, {
  timestamps: true
});

// Virtual for collection URL
collectionSchema.virtual('collectionUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/collections/${this.slug || this._id}`;
});

// Virtual for API endpoint
collectionSchema.virtual('apiEndpoint').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/api/collections/${this._id}`;
});

// Pre-save middleware
collectionSchema.pre('save', function(next) {
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Update stats
  this.stats.totalEvents = this.events.length;
  this.stats.follows = this.followers.length;
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  next();
});

// Method to add event to collection
collectionSchema.methods.addEvent = function(eventId, position) {
  // Check if event already exists
  const existingEvent = this.events.find(
    event => event.eventId.toString() === eventId.toString()
  );
  
  if (!existingEvent) {
    this.events.push({
      eventId,
      position: position || this.events.length
    });
  }
  
  return this.save();
};

// Method to remove event from collection
collectionSchema.methods.removeEvent = function(eventId) {
  this.events = this.events.filter(
    event => event.eventId.toString() !== eventId.toString()
  );
  
  return this.save();
};

// Method to follow collection
collectionSchema.methods.addFollower = function(userId) {
  const existingFollower = this.followers.find(
    follower => follower.userId.toString() === userId.toString()
  );
  
  if (!existingFollower) {
    this.followers.push({ userId });
  }
  
  return this.save();
};

// Method to unfollow collection
collectionSchema.methods.removeFollower = function(userId) {
  this.followers = this.followers.filter(
    follower => follower.userId.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to get public collection data
collectionSchema.methods.getPublicData = function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    creatorId: this.creatorId,
    creatorName: this.creatorName,
    type: this.type,
    events: this.events,
    settings: {
      isPublic: this.settings.isPublic,
      isFeatured: this.settings.isFeatured
    },
    image: this.image,
    color: this.color,
    stats: this.stats,
    tags: this.tags,
    status: this.status,
    createdAt: this.createdAt,
    lastUpdated: this.lastUpdated,
    collectionUrl: `${baseUrl}/collections/${this.slug || this._id}`,
    apiEndpoint: `${baseUrl}/api/collections/${this._id}`
  };
};

// Static method to find public collections
collectionSchema.statics.findPublic = function() {
  return this.find({ 'settings.isPublic': true, status: 'active' });
};

// Static method to find featured collections
collectionSchema.statics.findFeatured = function() {
  return this.find({ 
    'settings.isPublic': true, 
    'settings.isFeatured': true, 
    status: 'active' 
  });
};

// Indexes
collectionSchema.index({ name: 'text', description: 'text' });
collectionSchema.index({ creatorId: 1 });
collectionSchema.index({ 'settings.isPublic': 1 });
collectionSchema.index({ 'settings.isFeatured': 1 });
collectionSchema.index({ slug: 1 }, { unique: true, sparse: true });
collectionSchema.index({ tags: 1 });

module.exports = mongoose.model('Collection', collectionSchema);