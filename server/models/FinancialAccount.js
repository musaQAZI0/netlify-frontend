const mongoose = require('mongoose');

const financialAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  accountType: {
    type: String,
    enum: ['bank', 'card', 'paypal', 'stripe', 'wallet'],
    required: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Bank Account Details
  bankDetails: {
    accountNumber: {
      type: String,
      select: false // Don't include by default for security
    },
    routingNumber: {
      type: String,
      select: false
    },
    bankName: String,
    accountType: {
      type: String,
      enum: ['checking', 'savings']
    }
  },
  
  // Card Details
  cardDetails: {
    lastFourDigits: String,
    expiryMonth: Number,
    expiryYear: Number,
    cardType: {
      type: String,
      enum: ['visa', 'mastercard', 'amex', 'discover', 'other']
    },
    cardholderName: String
  },
  
  // PayPal Details
  paypalDetails: {
    email: String,
    merchantId: String
  },
  
  // Stripe Details
  stripeDetails: {
    accountId: String,
    customerId: String,
    paymentMethodId: String
  },
  
  // General Account Info
  currency: {
    type: String,
    default: 'USD'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // Balance and Transactions
  balance: {
    available: {
      type: Number,
      default: 0
    },
    pending: {
      type: Number,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0
    }
  },
  
  // Transaction History
  transactions: [{
    transactionId: String,
    type: {
      type: String,
      enum: ['credit', 'debit', 'transfer', 'refund', 'fee']
    },
    amount: Number,
    currency: String,
    description: String,
    relatedEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Verification Status
  verification: {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified'
    },
    documents: [{
      type: {
        type: String,
        enum: ['bank_statement', 'id', 'address_proof', 'other']
      },
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
    }],
    verifiedAt: Date,
    notes: String
  },
  
  // Security
  encryptionKeys: {
    keyId: String,
    algorithm: String
  },
  
  // Metadata
  metadata: {
    createdBy: String,
    source: String,
    tags: [String]
  },
  
  // API Endpoints
  apiEndpoint: String,
  webhookUrl: String
}, {
  timestamps: true
});

// Virtual for total balance
financialAccountSchema.virtual('totalBalance').get(function() {
  return this.balance.available + this.balance.pending;
});

// Virtual for API endpoint
financialAccountSchema.virtual('accountApiEndpoint').get(function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return `${baseUrl}/api/finance/accounts/${this._id}`;
});

// Pre-save middleware
financialAccountSchema.pre('save', function(next) {
  // Set API endpoint
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  this.apiEndpoint = `${baseUrl}/api/finance/accounts/${this._id}`;
  
  // Ensure only one default account per user per account type
  if (this.isDefault && this.isModified('isDefault')) {
    this.constructor.updateMany(
      { userId: this.userId, accountType: this.accountType, _id: { $ne: this._id } },
      { isDefault: false }
    ).exec();
  }
  
  next();
});

// Method to add transaction
financialAccountSchema.methods.addTransaction = function(transactionData) {
  const transaction = {
    transactionId: transactionData.transactionId || this.generateTransactionId(),
    type: transactionData.type,
    amount: transactionData.amount,
    currency: transactionData.currency || this.currency,
    description: transactionData.description,
    relatedEventId: transactionData.relatedEventId,
    status: transactionData.status || 'pending',
    metadata: transactionData.metadata
  };
  
  this.transactions.push(transaction);
  
  // Update balance based on transaction type
  if (transaction.type === 'credit') {
    this.balance.pending += transaction.amount;
  } else if (transaction.type === 'debit') {
    this.balance.available -= transaction.amount;
  }
  
  return this.save();
};

// Method to complete transaction
financialAccountSchema.methods.completeTransaction = function(transactionId) {
  const transaction = this.transactions.id(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }
  
  transaction.status = 'completed';
  transaction.completedAt = new Date();
  
  // Update balance
  if (transaction.type === 'credit') {
    this.balance.pending -= transaction.amount;
    this.balance.available += transaction.amount;
  }
  
  return this.save();
};

// Method to generate transaction ID
financialAccountSchema.methods.generateTransactionId = function() {
  return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Method to get public account data
financialAccountSchema.methods.getPublicData = function() {
  const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';
  return {
    id: this._id,
    accountType: this.accountType,
    accountName: this.accountName,
    currency: this.currency,
    isDefault: this.isDefault,
    isActive: this.isActive,
    isVerified: this.isVerified,
    balance: {
      available: this.balance.available,
      pending: this.balance.pending,
      total: this.totalBalance
    },
    verification: {
      status: this.verification.status,
      verifiedAt: this.verification.verifiedAt
    },
    createdAt: this.createdAt,
    apiEndpoint: `${baseUrl}/api/finance/accounts/${this._id}`
  };
};

// Static method to find user's default account
financialAccountSchema.statics.findUserDefault = function(userId, accountType) {
  return this.findOne({ userId, accountType, isDefault: true, isActive: true });
};

// Indexes
financialAccountSchema.index({ userId: 1 });
financialAccountSchema.index({ userId: 1, accountType: 1 });
financialAccountSchema.index({ userId: 1, isDefault: 1 });
financialAccountSchema.index({ 'transactions.transactionId': 1 });

module.exports = mongoose.model('FinancialAccount', financialAccountSchema);