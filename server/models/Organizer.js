const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    default: '',
    trim: true
  },
  website: {
    type: String,
    default: '',
    trim: true
  },
  facebookUrl: {
    type: String,
    default: '',
    trim: true
  },
  twitterHandle: {
    type: String,
    default: '',
    trim: true
  },
  instagramHandle: {
    type: String,
    default: '',
    trim: true
  },
  linkedinUrl: {
    type: String,
    default: '',
    trim: true
  },
  organizationName: {
    type: String,
    default: '',
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    street: {
      type: String,
      default: '',
      trim: true
    },
    city: {
      type: String,
      default: '',
      trim: true
    },
    state: {
      type: String,
      default: '',
      trim: true
    },
    zipCode: {
      type: String,
      default: '',
      trim: true
    },
    country: {
      type: String,
      default: '',
      trim: true
    }
  },
  profileImage: {
    type: String,
    default: ''
  },
  emailOptIn: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  eventsCount: {
    type: Number,
    default: 0
  },
  totalTicketsSold: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create compound index for userId (one organizer profile per user)
organizerSchema.index({ userId: 1 }, { unique: true });

// Method to get public profile
organizerSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    bio: this.bio,
    website: this.website,
    organizationName: this.organizationName,
    profileImage: this.profileImage,
    eventsCount: this.eventsCount,
    totalTicketsSold: this.totalTicketsSold,
    socialLinks: {
      facebook: this.facebookUrl,
      twitter: this.twitterHandle,
      instagram: this.instagramHandle,
      linkedin: this.linkedinUrl
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Method to get full profile (for owner/admin)
organizerSchema.methods.getFullProfile = function() {
  return {
    id: this._id,
    userId: this.userId,
    name: this.name,
    bio: this.bio,
    website: this.website,
    contactEmail: this.contactEmail,
    phone: this.phone,
    address: this.address,
    organizationName: this.organizationName,
    profileImage: this.profileImage,
    socialLinks: {
      facebook: this.facebookUrl,
      twitter: this.twitterHandle,
      instagram: this.instagramHandle,
      linkedin: this.linkedinUrl
    },
    emailOptIn: this.emailOptIn,
    isActive: this.isActive,
    stats: {
      eventsCount: this.eventsCount,
      totalTicketsSold: this.totalTicketsSold,
      totalRevenue: this.totalRevenue
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Virtual for full name
organizerSchema.virtual('displayName').get(function() {
  return this.organizationName || this.name;
});

module.exports = mongoose.model('Organizer', organizerSchema);