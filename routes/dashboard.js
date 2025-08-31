const express = require('express');
const router = express.Router();
const { authenticateToken, requireOrganizer } = require('../middleware/auth');
const Event = require('../models/Event');
const User = require('../models/User');
const App = require('../models/App');
const FinancialAccount = require('../models/FinancialAccount');

const baseUrl = process.env.NODE_ENV === 'production' ? 'https://yourdomain.com' : 'http://localhost:3001';

// Get user dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    // Get user's events (attending or organized)
    let userEvents = [];
    if (userRole === 'organizer' || userRole === 'admin') {
      userEvents = await Event.find({ organizerId: userId })
        .sort({ startDate: -1 })
        .limit(5);
    }

    // Get recent events user might be interested in
    const recentEvents = await Event.find({
      status: 'published',
      isPublic: true,
      startDate: { $gte: new Date() }
    })
    .sort({ createdAt: -1 })
    .limit(10);

    // Get user's financial summary (if applicable)
    let financialSummary = null;
    if (userRole === 'organizer' || userRole === 'admin') {
      const financialAccounts = await FinancialAccount.find({ 
        userId: userId, 
        isActive: true 
      });
      
      if (financialAccounts.length > 0) {
        const totalBalance = financialAccounts.reduce((sum, acc) => sum + acc.totalBalance, 0);
        const totalPending = financialAccounts.reduce((sum, acc) => sum + acc.balance.pending, 0);
        
        financialSummary = {
          totalBalance,
          totalPending,
          accountsCount: financialAccounts.length,
          verifiedAccounts: financialAccounts.filter(acc => acc.isVerified).length
        };
      }
    }

    // Get installed apps count
    const installedApps = await App.countDocuments({ 
      status: 'approved',
      isPublic: true 
    });

    // Get user activity stats
    const activityStats = {
      eventsOrganized: userRole === 'organizer' || userRole === 'admin' ? 
        await Event.countDocuments({ organizerId: userId }) : 0,
      totalViews: userRole === 'organizer' || userRole === 'admin' ?
        (await Event.aggregate([
          { $match: { organizerId: userId } },
          { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]))[0]?.totalViews || 0 : 0,
      profileViews: 0 // This would be tracked separately
    };

    const dashboardData = {
      user: {
        ...req.user.getPublicProfile(),
        lastActivity: req.user.authStatus.lastActivity
      },
      stats: {
        myEvents: userEvents.length,
        totalEvents: recentEvents.length,
        installedApps,
        ...activityStats
      },
      myEvents: userEvents.map(event => event.getPublicData()),
      recentEvents: recentEvents.slice(0, 5).map(event => event.getPublicData()),
      financialSummary,
      quickActions: {
        createEvent: userRole === 'organizer' || userRole === 'admin' ? 
          `${baseUrl}/create-event` : null,
        browseEvents: `${baseUrl}/events`,
        marketplace: `${baseUrl}/apps`,
        profile: `${baseUrl}/profile`,
        settings: `${baseUrl}/settings`
      },
      notifications: [],
      links: {
        events: `${baseUrl}/api/events`,
        myEvents: `${baseUrl}/api/events?organizerId=${userId}`,
        apps: `${baseUrl}/api/apps`,
        profile: `${baseUrl}/api/users/${userId}`,
        finance: `${baseUrl}/api/finance/dashboard`
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      timestamp: new Date().toISOString(),
      links: {
        dashboard: `${baseUrl}/dashboard`,
        api: `${baseUrl}/api/dashboard`,
        refresh: `${baseUrl}/api/dashboard?refresh=true`
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching dashboard data',
      helpUrl: `${baseUrl}/help/dashboard`
    });
  }
});

// Get organizer dashboard data
router.get('/organizer', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get organizer's events with detailed stats
    const events = await Event.find({ organizerId: userId })
      .sort({ createdAt: -1 });

    // Calculate event statistics
    const eventStats = {
      total: events.length,
      published: events.filter(e => e.status === 'published').length,
      draft: events.filter(e => e.status === 'draft').length,
      upcoming: events.filter(e => e.startDate > new Date()).length,
      past: events.filter(e => e.startDate <= new Date()).length,
      totalViews: events.reduce((sum, e) => sum + (e.views || 0), 0),
      totalLikes: events.reduce((sum, e) => sum + (e.likes || 0), 0),
      totalTicketsSold: events.reduce((sum, e) => sum + (e.ticketsSold || 0), 0)
    };

    // Get recent ticket sales and revenue
    const revenueData = await calculateRevenueData(userId);

    // Get financial summary
    const financialAccounts = await FinancialAccount.find({ 
      userId: userId, 
      isActive: true 
    });

    const financialSummary = {
      totalBalance: financialAccounts.reduce((sum, acc) => sum + acc.totalBalance, 0),
      pendingPayouts: financialAccounts.reduce((sum, acc) => sum + acc.balance.pending, 0),
      accountsCount: financialAccounts.length,
      verifiedAccounts: financialAccounts.filter(acc => acc.isVerified).length,
      recentTransactions: financialAccounts
        .flatMap(acc => acc.transactions.slice(-5))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
    };

    // Get performance insights
    const insights = await generateOrganizerInsights(events);

    const organizerDashboard = {
      organizer: req.user.getPublicProfile(),
      stats: eventStats,
      revenue: revenueData,
      financial: financialSummary,
      recentEvents: events.slice(0, 5).map(event => event.getPublicData()),
      upcomingEvents: events
        .filter(e => e.startDate > new Date())
        .slice(0, 3)
        .map(event => event.getPublicData()),
      insights,
      quickActions: {
        createEvent: `${baseUrl}/create-event`,
        manageEvents: `${baseUrl}/organizer/events`,
        analytics: `${baseUrl}/organizer/analytics`,
        payouts: `${baseUrl}/organizer/payouts`,
        settings: `${baseUrl}/organizer/settings`
      },
      links: {
        allEvents: `${baseUrl}/api/events?organizerId=${userId}`,
        analytics: `${baseUrl}/api/dashboard/organizer/analytics`,
        revenue: `${baseUrl}/api/dashboard/organizer/revenue`,
        finance: `${baseUrl}/api/finance/dashboard`
      }
    };

    res.json({
      success: true,
      data: organizerDashboard,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching organizer dashboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching organizer dashboard data' 
    });
  }
});

// Get analytics data for organizer
router.get('/organizer/analytics', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const userId = req.user._id;
    const timeRange = req.query.range || '30days'; // 7days, 30days, 90days, 1year

    const events = await Event.find({ organizerId: userId });
    
    // Generate analytics based on time range
    const analytics = await generateAnalytics(events, timeRange);

    res.json({
      success: true,
      data: analytics,
      meta: {
        timeRange,
        eventsAnalyzed: events.length,
        generatedAt: new Date().toISOString()
      },
      links: {
        dashboard: `${baseUrl}/api/dashboard/organizer`,
        revenue: `${baseUrl}/api/dashboard/organizer/revenue`,
        export: `${baseUrl}/api/dashboard/organizer/analytics/export`
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics data' 
    });
  }
});

// Get revenue data for organizer
router.get('/organizer/revenue', authenticateToken, requireOrganizer, async (req, res) => {
  try {
    const userId = req.user._id;
    const period = req.query.period || 'monthly'; // daily, weekly, monthly, yearly

    const revenueData = await calculateDetailedRevenue(userId, period);

    res.json({
      success: true,
      data: revenueData,
      meta: {
        period,
        currency: 'USD',
        generatedAt: new Date().toISOString()
      },
      links: {
        dashboard: `${baseUrl}/api/dashboard/organizer`,
        analytics: `${baseUrl}/api/dashboard/organizer/analytics`,
        payouts: `${baseUrl}/api/finance/dashboard`
      }
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching revenue data' 
    });
  }
});

// Helper function to calculate revenue data
async function calculateRevenueData(userId) {
  try {
    const events = await Event.find({ organizerId: userId });
    
    // This is a simplified calculation - in a real app, you'd have a proper orders/transactions system
    const totalRevenue = events.reduce((sum, event) => {
      const eventRevenue = event.ticketTypes?.reduce((ticketSum, ticket) => {
        return ticketSum + (ticket.sold || 0) * (ticket.price || 0);
      }, 0) || 0;
      return sum + eventRevenue;
    }, 0);

    return {
      totalRevenue,
      thisMonth: totalRevenue * 0.3, // Placeholder calculation
      lastMonth: totalRevenue * 0.25,
      growth: 20, // Placeholder percentage
      topEvent: events.sort((a, b) => (b.ticketsSold || 0) - (a.ticketsSold || 0))[0]?.title || 'N/A'
    };
  } catch (error) {
    console.error('Error calculating revenue:', error);
    return {
      totalRevenue: 0,
      thisMonth: 0,
      lastMonth: 0,
      growth: 0,
      topEvent: 'N/A'
    };
  }
}

// Helper function to generate organizer insights
async function generateOrganizerInsights(events) {
  const insights = [];

  if (events.length === 0) {
    insights.push({
      type: 'tip',
      title: 'Get Started',
      message: 'Create your first event to start tracking analytics!',
      action: `${baseUrl}/create-event`
    });
  } else {
    const avgViews = events.reduce((sum, e) => sum + (e.views || 0), 0) / events.length;
    if (avgViews < 10) {
      insights.push({
        type: 'suggestion',
        title: 'Increase Visibility',
        message: 'Your events are getting low views. Try improving your event descriptions and images.',
        action: `${baseUrl}/help/marketing`
      });
    }

    const publishedEvents = events.filter(e => e.status === 'published').length;
    const draftEvents = events.filter(e => e.status === 'draft').length;
    
    if (draftEvents > publishedEvents) {
      insights.push({
        type: 'warning',
        title: 'Unpublished Events',
        message: `You have ${draftEvents} draft events. Consider publishing them to start selling tickets.`,
        action: `${baseUrl}/organizer/events?status=draft`
      });
    }
  }

  return insights;
}

// Helper function to generate detailed analytics
async function generateAnalytics(events, timeRange) {
  // This would contain more sophisticated analytics logic
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const filteredEvents = events.filter(e => new Date(e.createdAt) >= startDate);

  return {
    eventsCreated: filteredEvents.length,
    totalViews: filteredEvents.reduce((sum, e) => sum + (e.views || 0), 0),
    totalTicketsSold: filteredEvents.reduce((sum, e) => sum + (e.ticketsSold || 0), 0),
    avgTicketsPerEvent: filteredEvents.length > 0 ? 
      filteredEvents.reduce((sum, e) => sum + (e.ticketsSold || 0), 0) / filteredEvents.length : 0,
    topCategories: getTopCategories(filteredEvents),
    performanceMetrics: calculatePerformanceMetrics(filteredEvents)
  };
}

// Helper function to calculate detailed revenue
async function calculateDetailedRevenue(userId, period) {
  const events = await Event.find({ organizerId: userId });
  
  // Simplified revenue calculation - in reality, you'd query actual transaction data
  const revenue = events.reduce((sum, event) => {
    const eventRevenue = event.ticketTypes?.reduce((ticketSum, ticket) => {
      return ticketSum + (ticket.sold || 0) * (ticket.price || 0);
    }, 0) || 0;
    return sum + eventRevenue;
  }, 0);

  return {
    totalRevenue: revenue,
    revenueByPeriod: [], // Would contain time-series data
    topRevenueEvents: events
      .sort((a, b) => {
        const aRevenue = a.ticketTypes?.reduce((sum, t) => sum + (t.sold || 0) * (t.price || 0), 0) || 0;
        const bRevenue = b.ticketTypes?.reduce((sum, t) => sum + (t.sold || 0) * (t.price || 0), 0) || 0;
        return bRevenue - aRevenue;
      })
      .slice(0, 5)
      .map(event => ({
        id: event._id,
        title: event.title,
        revenue: event.ticketTypes?.reduce((sum, t) => sum + (t.sold || 0) * (t.price || 0), 0) || 0
      }))
  };
}

// Helper functions for analytics
function getTopCategories(events) {
  const categories = {};
  events.forEach(event => {
    categories[event.category] = (categories[event.category] || 0) + 1;
  });
  
  return Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function calculatePerformanceMetrics(events) {
  return {
    avgViewsPerEvent: events.length > 0 ? 
      events.reduce((sum, e) => sum + (e.views || 0), 0) / events.length : 0,
    avgLikesPerEvent: events.length > 0 ? 
      events.reduce((sum, e) => sum + (e.likes || 0), 0) / events.length : 0,
    conversionRate: events.length > 0 ? 
      (events.filter(e => (e.ticketsSold || 0) > 0).length / events.length) * 100 : 0
  };
}

// Health check for dashboard API
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Dashboard API',
    timestamp: new Date().toISOString(),
    endpoints: {
      userDashboard: `${baseUrl}/api/dashboard`,
      organizerDashboard: `${baseUrl}/api/dashboard/organizer`,
      analytics: `${baseUrl}/api/dashboard/organizer/analytics`,
      revenue: `${baseUrl}/api/dashboard/organizer/revenue`
    }
  });
});

module.exports = router;