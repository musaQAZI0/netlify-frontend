// Configuration file for API endpoints
const Config = {
    // Auto-detect environment based on current domain
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // Port configurations
    FRONTEND_PORT: 8080,  // Frontend runs on port 8080
    BACKEND_PORT: 3004,   // Backend runs on port 3004
    
    // API base URL - Use local or production based on environment
    get API_BASE_URL() {
        if (this.isDevelopment) {
            return `http://localhost:${this.BACKEND_PORT}/api`; // Local backend server
        } else {
            return 'https://crowd-backend-zxxp.onrender.com/api'; // Production backend
        }
    },
    
    // Frontend URL - Always use current domain
    FRONTEND_URL: window.location.origin,
        
    // Render-specific configuration
    RENDER_CONFIG: {
        // Browser-safe configuration (no process.env access)
        SERVICE_NAME: 'crowd-frontend',
        EXTERNAL_URL: window.location.origin,
        GIT_COMMIT: 'unknown'
    }
};

// API endpoints using the dynamic base URL
const API_ENDPOINTS = {
    get auth() { return `${Config.API_BASE_URL}/auth`; },
    get events() { return `${Config.API_BASE_URL}/events`; },
    get users() { return `${Config.API_BASE_URL}/users`; },
    get finance() { return `${Config.API_BASE_URL}/finance`; },
    get apps() { return `${Config.API_BASE_URL}/apps`; },
    get dashboard() { return `${Config.API_BASE_URL}/dashboard`; },
    get health() { return `${Config.API_BASE_URL}/health`; }
};

// Make config available globally
window.Config = Config;
window.API_ENDPOINTS = API_ENDPOINTS;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Config, API_ENDPOINTS };
}