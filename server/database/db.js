const fs = require('fs-extra');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
fs.ensureDirSync(DATA_DIR);

// Database files
const DB_FILES = {
  users: path.join(DATA_DIR, 'users.json'),
  events: path.join(DATA_DIR, 'events.json'),
  bankAccounts: path.join(DATA_DIR, 'bankAccounts.json'),
  apps: path.join(DATA_DIR, 'apps.json'),
  collections: path.join(DATA_DIR, 'collections.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  notifications: path.join(DATA_DIR, 'notifications.json')
};

// Initialize JSON files if they don't exist
Object.values(DB_FILES).forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    fs.writeJsonSync(filePath, []);
  }
});

class JSONDatabase {
  constructor() {
    this.baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3001';
  }

  // Generic CRUD operations
  async readData(collection) {
    try {
      const filePath = DB_FILES[collection];
      if (!filePath) {
        throw new Error(`Collection ${collection} not found`);
      }
      const data = await fs.readJson(filePath);
      return data;
    } catch (error) {
      console.error(`Error reading ${collection}:`, error);
      return [];
    }
  }

  async writeData(collection, data) {
    try {
      const filePath = DB_FILES[collection];
      if (!filePath) {
        throw new Error(`Collection ${collection} not found`);
      }
      await fs.writeJson(filePath, data, { spaces: 2 });
      return true;
    } catch (error) {
      console.error(`Error writing ${collection}:`, error);
      return false;
    }
  }

  async findById(collection, id) {
    const data = await this.readData(collection);
    return data.find(item => item.id === id || item._id === id);
  }

  async findOne(collection, query) {
    const data = await this.readData(collection);
    return data.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  async find(collection, query = {}) {
    const data = await this.readData(collection);
    if (Object.keys(query).length === 0) {
      return data;
    }
    return data.filter(item => {
      return Object.keys(query).every(key => {
        if (typeof query[key] === 'object' && query[key].$regex) {
          const regex = new RegExp(query[key].$regex, query[key].$options || '');
          return regex.test(item[key]);
        }
        return item[key] === query[key];
      });
    });
  }

  async create(collection, newItem) {
    const data = await this.readData(collection);
    const id = newItem.id || this.generateId();
    const itemWithId = { ...newItem, id, _id: id };
    
    // Add localhost URLs for relevant collections
    if (collection === 'events') {
      itemWithId.eventUrl = `${this.baseUrl}/event/${id}`;
      itemWithId.apiEndpoint = `${this.baseUrl}/api/events/${id}`;
    } else if (collection === 'users') {
      itemWithId.profileUrl = `${this.baseUrl}/profile/${id}`;
      itemWithId.apiEndpoint = `${this.baseUrl}/api/users/${id}`;
    }
    
    data.push(itemWithId);
    await this.writeData(collection, data);
    return itemWithId;
  }

  async updateById(collection, id, updates) {
    const data = await this.readData(collection);
    const index = data.findIndex(item => item.id === id || item._id === id);
    
    if (index === -1) {
      return null;
    }

    data[index] = { ...data[index], ...updates, updatedAt: new Date() };
    await this.writeData(collection, data);
    return data[index];
  }

  async deleteById(collection, id) {
    const data = await this.readData(collection);
    const filteredData = data.filter(item => item.id !== id && item._id !== id);
    
    if (filteredData.length === data.length) {
      return false; // Item not found
    }

    await this.writeData(collection, filteredData);
    return true;
  }

  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Health check
  async healthCheck() {
    try {
      const stats = {};
      for (const [collection, filePath] of Object.entries(DB_FILES)) {
        const data = await this.readData(collection);
        stats[collection] = {
          count: data.length,
          file: filePath,
          endpoint: `${this.baseUrl}/api/${collection}`
        };
      }
      return {
        status: 'healthy',
        type: 'JSON File Database',
        server: this.baseUrl,
        collections: stats
      };
    } catch (error) {
      return {
        status: 'error',
        type: 'JSON File Database',
        error: error.message
      };
    }
  }
}

module.exports = new JSONDatabase();