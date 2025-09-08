const mongoose = require('mongoose');

const ticketTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  },
  maxPerOrder: {
    type: Number,
    default: 10
  },
  saleStart: Date,
  saleEnd: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['music', 'nightlife', 'arts', 'holidays', 'dating', 'hobbies', 'business', 'food', 'other']
  },
  subcategory: String,
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerName: String,
  organizerEmail: String,
  
  // Date and Time
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  
  // Location
  location: {
    type: {
      type: String,
      enum: ['physical', 'online', 'hybrid'],
      default: 'physical'
    },
    venue: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      placeId: String // Google Places API place identifier
    },
    onlineDetails: {
      platform: String,
      link: String,
      instructions: String
    }
  },
  
  // Images and Media
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  primaryImage: String,
  
  // Ticketing
  ticketTypes: [ticketTypeSchema],
  isFree: {
    type: Boolean,
    default: false
  },
  totalCapacity: {
    type: Number,
    min: 0
  },
  ticketsSold: {
    type: Number,
    default: 0
  },
  
  // Status and Visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'cancelled', 'completed', 'postponed'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Additional Information
  tags: [String],
  ageRestriction: {
    minAge: Number,
    maxAge: Number,
    description: String
  },
  
  // Good to Know Section
  goodToKnow: {
    highlights: [{
      id: String,
      type: String,
      label: String,
      content: String
    }],
    faqs: [{
      id: String,
      question: String,
      answer: String
    }]
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  
  // SEO
  slug: String,
  metaTitle: String,
  metaDescription: String,
  
  // Timestamps
  publishedAt: Date,
  lastModified: Date
}, {
  timestamps: true
});

// Virtual for event URL
eventSchema.virtual('eventUrl').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/event/${this._id}`;
});

// Virtual for API endpoint
eventSchema.virtual('apiEndpoint').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/api/events/${this._id}`;
});

// Virtual for tickets available
eventSchema.virtual('ticketsAvailable').get(function() {
  return this.totalCapacity ? this.totalCapacity - this.ticketsSold : 0;
});

// Virtual for is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.totalCapacity && this.ticketsSold >= this.totalCapacity;
});

// Pre-save middleware
eventSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title.toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
  
  // Set published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update lastModified
  this.lastModified = new Date();
  
  next();
});

// Method to get public event data
eventSchema.methods.getPublicData = function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return {
    id: this._id,
    title: this.title,
    description: this.description,
    category: this.category,
    subcategory: this.subcategory,
    organizerId: this.organizerId,
    organizerName: this.organizerName,
    startDate: this.startDate,
    endDate: this.endDate,
    timezone: this.timezone,
    location: this.location,
    primaryImage: this.primaryImage,
    images: this.images,
    ticketTypes: this.ticketTypes,
    isFree: this.isFree,
    totalCapacity: this.totalCapacity,
    ticketsSold: this.ticketsSold,
    ticketsAvailable: this.ticketsAvailable,
    isSoldOut: this.isSoldOut,
    status: this.status,
    isPublic: this.isPublic,
    isFeatured: this.isFeatured,
    tags: this.tags,
    goodToKnow: this.goodToKnow,
    views: this.views,
    likes: this.likes,
    publishedAt: this.publishedAt,
    createdAt: this.createdAt,
    eventUrl: `${baseUrl}/event/${this._id}`,
    apiEndpoint: `${baseUrl}/api/events/${this._id}`
  };
};

// Static method to find published events
eventSchema.statics.findPublished = function() {
  return this.find({ status: 'published', isPublic: true });
};

// Static method to search events
eventSchema.statics.searchEvents = function(query) {
  const searchRegex = new RegExp(query, 'i');
  return this.find({
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { category: searchRegex },
      { tags: { $in: [searchRegex] } }
    ],
    status: 'published',
    isPublic: true
  });
};

// Indexes
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ organizerId: 1 });
eventSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Event', eventSchema);