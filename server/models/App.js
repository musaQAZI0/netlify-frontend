const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  
  // Developer Information
  developerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  developerName: String,
  developerEmail: String,
  developerWebsite: String,
  
  // App Details
  category: {
    type: String,
    required: true,
    enum: ['Marketing', 'Analytics', 'Payment', 'Communication', 'Design', 'Productivity', 'Integration', 'Other']
  },
  subcategory: String,
  version: {
    type: String,
    default: '1.0.0'
  },
  
  // Images and Media
  icon: {
    type: String,
    required: true
  },
  screenshots: [String],
  bannerImage: String,
  
  // Pricing
  pricing: {
    type: {
      type: String,
      enum: ['free', 'paid', 'freemium', 'subscription'],
      default: 'free'
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    billingCycle: {
      type: String,
      enum: ['one-time', 'monthly', 'yearly'],
      default: 'one-time'
    },
    trialPeriod: {
      days: Number,
      description: String
    }
  },
  
  // Technical Details
  technical: {
    apiVersion: String,
    webhookUrl: String,
    redirectUrls: [String],
    permissions: [{
      name: String,
      description: String,
      required: {
        type: Boolean,
        default: false
      }
    }],
    integrationMethod: {
      type: String,
      enum: ['api', 'webhook', 'iframe', 'redirect'],
      default: 'api'
    },
    supportedEvents: [String]
  },
  
  // Status and Availability
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'rejected', 'suspended', 'deprecated'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Installation and Usage
  installations: {
    type: Number,
    default: 0
  },
  activeUsers: {
    type: Number,
    default: 0
  },
  
  // Reviews and Ratings
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    },
    distribution: {
      five: { type: Number, default: 0 },
      four: { type: Number, default: 0 },
      three: { type: Number, default: 0 },
      two: { type: Number, default: 0 },
      one: { type: Number, default: 0 }
    }
  },
  
  reviews: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userName: String,
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    title: String,
    comment: String,
    helpful: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Documentation
  documentation: {
    setupGuide: String,
    apiDocs: String,
    changelog: String,
    faq: String,
    supportEmail: String,
    supportUrl: String
  },
  
  // Compliance and Security
  compliance: {
    gdprCompliant: {
      type: Boolean,
      default: false
    },
    hipaaCompliant: {
      type: Boolean,
      default: false
    },
    soc2Compliant: {
      type: Boolean,
      default: false
    },
    privacyPolicy: String,
    termsOfService: String
  },
  
  // SEO and Discovery
  tags: [String],
  slug: String,
  metaTitle: String,
  metaDescription: String,
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  publishedAt: Date,
  lastUpdated: Date,
  reviewedAt: Date,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Virtual for app URL
appSchema.virtual('appUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/apps/${this.slug || this._id}`;
});

// Virtual for API endpoint
appSchema.virtual('apiEndpoint').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/api/apps/${this._id}`;
});

// Virtual for installation URL
appSchema.virtual('installUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/api/apps/${this._id}/install`;
});

// Pre-save middleware
appSchema.pre('save', function(next) {
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Set published date when status changes to approved
  if (this.isModified('status') && this.status === 'approved' && !this.publishedAt) {
    this.publishedAt = new Date();
    this.isPublic = true;
  }
  
  // Update lastUpdated
  this.lastUpdated = new Date();
  
  next();
});

// Method to add review
appSchema.methods.addReview = function(reviewData) {
  // Check if user already reviewed
  const existingReview = this.reviews.find(
    review => review.userId.toString() === reviewData.userId.toString()
  );
  
  if (existingReview) {
    // Update existing review
    existingReview.rating = reviewData.rating;
    existingReview.title = reviewData.title;
    existingReview.comment = reviewData.comment;
  } else {
    // Add new review
    this.reviews.push({
      userId: reviewData.userId,
      userName: reviewData.userName,
      rating: reviewData.rating,
      title: reviewData.title,
      comment: reviewData.comment
    });
  }
  
  // Recalculate rating
  this.calculateRating();
  
  return this.save();
};

// Method to calculate average rating
appSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating.average = 0;
    this.rating.count = 0;
    return;
  }
  
  const ratings = this.reviews.map(review => review.rating);
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  
  this.rating.average = Math.round((sum / ratings.length) * 10) / 10;
  this.rating.count = ratings.length;
  
  // Update distribution
  this.rating.distribution = {
    five: ratings.filter(r => r === 5).length,
    four: ratings.filter(r => r === 4).length,
    three: ratings.filter(r => r === 3).length,
    two: ratings.filter(r => r === 2).length,
    one: ratings.filter(r => r === 1).length
  };
};

// Method to get public app data
appSchema.methods.getPublicData = function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    shortDescription: this.shortDescription,
    developerId: this.developerId,
    developerName: this.developerName,
    category: this.category,
    subcategory: this.subcategory,
    version: this.version,
    icon: this.icon,
    screenshots: this.screenshots,
    bannerImage: this.bannerImage,
    pricing: this.pricing,
    status: this.status,
    isPublic: this.isPublic,
    isFeatured: this.isFeatured,
    installations: this.installations,
    rating: this.rating,
    tags: this.tags,
    views: this.views,
    publishedAt: this.publishedAt,
    lastUpdated: this.lastUpdated,
    createdAt: this.createdAt,
    appUrl: `${baseUrl}/apps/${this.slug || this._id}`,
    apiEndpoint: `${baseUrl}/api/apps/${this._id}`,
    installUrl: `${baseUrl}/api/apps/${this._id}/install`
  };
};

// Static method to find public apps
appSchema.statics.findPublic = function() {
  return this.find({ status: 'approved', isPublic: true });
};

// Static method to find featured apps
appSchema.statics.findFeatured = function() {
  return this.find({ status: 'approved', isPublic: true, isFeatured: true });
};

// Static method to search apps
appSchema.statics.searchApps = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    status: 'approved',
    isPublic: true
  });
};

// Indexes
appSchema.index({ name: 'text', description: 'text' });
appSchema.index({ category: 1 });
appSchema.index({ status: 1 });
appSchema.index({ rating: -1 });
appSchema.index({ installations: -1 });
appSchema.index({ slug: 1 }, { unique: true, sparse: true });
appSchema.index({ developerId: 1 });

module.exports = mongoose.model('App', appSchema);