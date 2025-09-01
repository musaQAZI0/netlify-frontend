const User = require('../models/User');
const Event = require('../models/Event');
const FinancialAccount = require('../models/FinancialAccount');
const App = require('../models/App');
const Collection = require('../models/Collection');

class MongoDatabase {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3001';
  }

  // User operations
  async createUser(userData) {
    const user = new User({
      ...userData,
      profileUrl: `${this.baseUrl}/profile/${userData.id || userData._id}`,
      apiEndpoint: `${this.baseUrl}/api/users/${userData.id || userData._id}`
    });
    return await user.save();
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  async updateUser(id, updates) {
    return await User.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteUser(id) {
    return await User.findByIdAndDelete(id);
  }

  async getAllUsers() {
    return await User.find({});
  }

  // Event operations
  async createEvent(eventData) {
    const event = new Event({
      ...eventData,
      eventUrl: `${this.baseUrl}/event/${eventData.id || eventData._id}`,
      apiEndpoint: `${this.baseUrl}/api/events/${eventData.id || eventData._id}`
    });
    return await event.save();
  }

  async findEventById(id) {
    return await Event.findById(id);
  }

  async findEventsByOrganizer(organizerId) {
    return await Event.find({ organizerId });
  }

  async updateEvent(id, updates) {
    return await Event.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteEvent(id) {
    return await Event.findByIdAndDelete(id);
  }

  async getAllEvents() {
    return await Event.find({});
  }

  async searchEvents(query) {
    const searchRegex = new RegExp(query, 'i');
    return await Event.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { location: searchRegex }
      ]
    });
  }

  // Financial Account operations
  async createFinancialAccount(accountData) {
    const account = new FinancialAccount(accountData);
    return await account.save();
  }

  async findFinancialAccountsByUser(userId) {
    return await FinancialAccount.find({ userId });
  }

  async updateFinancialAccount(id, updates) {
    return await FinancialAccount.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteFinancialAccount(id) {
    return await FinancialAccount.findByIdAndDelete(id);
  }

  // App operations
  async createApp(appData) {
    const app = new App({
      ...appData,
      appUrl: `${this.baseUrl}/app/${appData.id || appData._id}`,
      apiEndpoint: `${this.baseUrl}/api/apps/${appData.id || appData._id}`
    });
    return await app.save();
  }

  async findAppById(id) {
    return await App.findById(id);
  }

  async getAllApps() {
    return await App.find({});
  }

  async updateApp(id, updates) {
    return await App.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteApp(id) {
    return await App.findByIdAndDelete(id);
  }

  // Collection operations
  async createCollection(collectionData) {
    const collection = new Collection(collectionData);
    return await collection.save();
  }

  async findCollectionById(id) {
    return await Collection.findById(id);
  }

  async getAllCollections() {
    return await Collection.find({});
  }

  async updateCollection(id, updates) {
    return await Collection.findByIdAndUpdate(id, updates, { new: true });
  }

  async deleteCollection(id) {
    return await Collection.findByIdAndDelete(id);
  }

  // Health check
  async healthCheck() {
    try {
      const stats = {
        users: await User.countDocuments(),
        events: await Event.countDocuments(),
        financialAccounts: await FinancialAccount.countDocuments(),
        apps: await App.countDocuments(),
        collections: await Collection.countDocuments()
      };

      return {
        status: 'healthy',
        type: 'MongoDB with Mongoose',
        server: this.baseUrl,
        endpoints: {
          users: `${this.baseUrl}/api/users`,
          events: `${this.baseUrl}/api/events`,
          finance: `${this.baseUrl}/api/finance`,
          apps: `${this.baseUrl}/api/apps`,
          dashboard: `${this.baseUrl}/api/dashboard`
        },
        collections: stats
      };
    } catch (error) {
      return {
        status: 'error',
        type: 'MongoDB with Mongoose',
        error: error.message
      };
    }
  }
}

module.exports = new MongoDatabase();