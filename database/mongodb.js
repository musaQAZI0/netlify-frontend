const mongoose = require('mongoose');

class MongoDB {
  constructor() {
    this.connection = null;
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3001';
  }

  async connect() {
    try {
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crowd_events';
      this.connection = await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log(`MongoDB connected: ${this.baseUrl}/api/health`);
      return this.connection;
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }

  getConnectionInfo() {
    return {
      status: this.isConnected() ? 'connected' : 'disconnected',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      server: this.baseUrl,
      endpoints: {
        health: `${this.baseUrl}/api/health`,
        auth: `${this.baseUrl}/api/auth`,
        users: `${this.baseUrl}/api/users`,
        events: `${this.baseUrl}/api/events`
      }
    };
  }

  // Health check
  async healthCheck() {
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const stats = {};
      
      for (const collection of collections) {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        stats[collection.name] = {
          count,
          endpoint: `${this.baseUrl}/api/${collection.name}`
        };
      }

      return {
        status: 'healthy',
        type: 'MongoDB',
        server: this.baseUrl,
        database: {
          name: mongoose.connection.name,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          readyState: mongoose.connection.readyState
        },
        collections: stats
      };
    } catch (error) {
      return {
        status: 'error',
        type: 'MongoDB',
        error: error.message
      };
    }
  }
}

module.exports = new MongoDB();