const express = require('express');
const router = express.Router();
const { authenticateToken, requireOrganizer } = require('../middleware/auth');
const FinancialAccount = require('../models/FinancialAccount');
const Joi = require('joi');

const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';

// Validation schemas
const accountSchema = Joi.object({
  accountType: Joi.string().valid('bank', 'card', 'paypal', 'stripe', 'wallet').required(),
  accountName: Joi.string().required().trim(),
  bankDetails: Joi.object({
    accountNumber: Joi.string(),
    routingNumber: Joi.string(),
    bankName: Joi.string(),
    accountType: Joi.string().valid('checking', 'savings')
  }).optional(),
  cardDetails: Joi.object({
    lastFourDigits: Joi.string().length(4),
    expiryMonth: Joi.number().min(1).max(12),
    expiryYear: Joi.number().min(new Date().getFullYear()),
    cardType: Joi.string().valid('visa', 'mastercard', 'amex', 'discover', 'other'),
    cardholderName: Joi.string()
  }).optional(),
  paypalDetails: Joi.object({
    email: Joi.string().email(),
    merchantId: Joi.string()
  }).optional(),
  currency: Joi.string().default('USD'),
  isDefault: Joi.boolean().default(false)
});

const transactionSchema = Joi.object({
  type: Joi.string().valid('credit', 'debit', 'transfer', 'refund', 'fee').required(),
  amount: Joi.number().positive().required(),
  currency: Joi.string().default('USD'),
  description: Joi.string().required(),
  relatedEventId: Joi.string().optional(),
  metadata: Joi.object().optional()
});

// Get all financial accounts for user
router.get('/accounts', authenticateToken, async (req, res) => {
  try {
    const accounts = await FinancialAccount.find({ 
      userId: req.user._id, 
      isActive: true 
    });
    
    const publicAccounts = accounts.map(account => account.getPublicData());
    
    res.json({
      success: true,
      data: publicAccounts,
      meta: {
        total: publicAccounts.length,
        apiEndpoint: `${baseUrl}/api/finance/accounts`,
        userEndpoint: `${baseUrl}/api/users/${req.user._id}/finance`
      }
    });
  } catch (error) {
    console.error('Error fetching financial accounts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching financial accounts' 
    });
  }
});

// Get specific financial account
router.get('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const account = await FinancialAccount.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Financial account not found',
        availableAccounts: `${baseUrl}/api/finance/accounts`
      });
    }

    res.json({
      success: true,
      data: account.getPublicData(),
      links: {
        transactions: `${baseUrl}/api/finance/accounts/${account._id}/transactions`,
        update: `${baseUrl}/api/finance/accounts/${account._id}`,
        delete: `${baseUrl}/api/finance/accounts/${account._id}`
      }
    });
  } catch (error) {
    console.error('Error fetching financial account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching financial account' 
    });
  }
});

// Create new financial account
router.post('/accounts', authenticateToken, async (req, res) => {
  try {
    const { error, value } = accountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        details: error.details 
      });
    }

    const accountData = {
      ...value,
      userId: req.user._id
    };

    const account = new FinancialAccount(accountData);
    await account.save();

    res.status(201).json({
      success: true,
      message: 'Financial account created successfully',
      data: account.getPublicData(),
      links: {
        account: `${baseUrl}/api/finance/accounts/${account._id}`,
        allAccounts: `${baseUrl}/api/finance/accounts`
      }
    });
  } catch (error) {
    console.error('Error creating financial account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating financial account' 
    });
  }
});

// Update financial account
router.put('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const account = await FinancialAccount.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Financial account not found' 
      });
    }

    const { error, value } = accountSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        details: error.details 
      });
    }

    Object.assign(account, value);
    await account.save();

    res.json({
      success: true,
      message: 'Financial account updated successfully',
      data: account.getPublicData()
    });
  } catch (error) {
    console.error('Error updating financial account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating financial account' 
    });
  }
});

// Delete financial account
router.delete('/accounts/:id', authenticateToken, async (req, res) => {
  try {
    const account = await FinancialAccount.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Financial account not found' 
      });
    }

    account.isActive = false;
    await account.save();

    res.json({
      success: true,
      message: 'Financial account deleted successfully',
      redirectTo: `${baseUrl}/api/finance/accounts`
    });
  } catch (error) {
    console.error('Error deleting financial account:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting financial account' 
    });
  }
});

// Get transactions for an account
router.get('/accounts/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const account = await FinancialAccount.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Financial account not found' 
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const transactions = account.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    res.json({
      success: true,
      data: transactions,
      meta: {
        page,
        limit,
        total: account.transactions.length,
        hasMore: (skip + limit) < account.transactions.length
      },
      links: {
        account: `${baseUrl}/api/finance/accounts/${account._id}`,
        addTransaction: `${baseUrl}/api/finance/accounts/${account._id}/transactions`
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching transactions' 
    });
  }
});

// Add transaction to account
router.post('/accounts/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const account = await FinancialAccount.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: 'Financial account not found' 
      });
    }

    const { error, value } = transactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error', 
        details: error.details 
      });
    }

    await account.addTransaction(value);

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      links: {
        transactions: `${baseUrl}/api/finance/accounts/${account._id}/transactions`,
        account: `${baseUrl}/api/finance/accounts/${account._id}`
      }
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding transaction' 
    });
  }
});

// Get financial dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const accounts = await FinancialAccount.find({ 
      userId: req.user._id, 
      isActive: true 
    });

    const totalBalance = accounts.reduce((sum, account) => sum + account.totalBalance, 0);
    const totalPending = accounts.reduce((sum, account) => sum + account.balance.pending, 0);
    const totalAvailable = accounts.reduce((sum, account) => sum + account.balance.available, 0);

    const recentTransactions = accounts
      .flatMap(account => account.transactions.map(tx => ({
        ...tx.toObject(),
        accountName: account.accountName,
        accountId: account._id
      })))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json({
      success: true,
      data: {
        summary: {
          totalBalance,
          totalPending,
          totalAvailable,
          totalAccounts: accounts.length,
          verifiedAccounts: accounts.filter(acc => acc.isVerified).length
        },
        accounts: accounts.map(account => account.getPublicData()),
        recentTransactions
      },
      links: {
        accounts: `${baseUrl}/api/finance/accounts`,
        addAccount: `${baseUrl}/api/finance/accounts`,
        profile: `${baseUrl}/api/users/${req.user._id}`
      }
    });
  } catch (error) {
    console.error('Error fetching financial dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching financial dashboard' 
    });
  }
});

// Health check for finance API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Finance API',
    timestamp: new Date().toISOString(),
    endpoints: {
      accounts: `${baseUrl}/api/finance/accounts`,
      dashboard: `${baseUrl}/api/finance/dashboard`,
      health: `${baseUrl}/api/finance/health`
    }
  });
});

module.exports = router;