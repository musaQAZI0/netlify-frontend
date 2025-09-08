// Data management utilities
class DataManager {
    constructor() {
        this.apiURL = window.Config ? window.Config.API_BASE_URL : 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3003/api'
                : 'https://crowd-backend-zxxp.onrender.com/api');
    }
    
    // Store user data
    setUserData(user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    
    // Get user data
    getUserData() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    // Store auth token
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
    }
    
    // Get auth token
    getAuthToken() {
        return localStorage.getItem('authToken');
    }
    
    // Clear all user data
    clearUserData() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
    }
    
    // Check if user is logged in
    isLoggedIn() {
        const token = this.getAuthToken();
        const user = this.getUserData();
        return !!(token && user);
    }
    
    // Alias for compatibility
    isAuthenticated() {
        return this.isLoggedIn();
    }
    
    // Get user role
    getUserRole() {
        const user = this.getUserData();
        return user ? user.role : null;
    }
    
    // Check if user has specific role
    hasRole(role) {
        const userRole = this.getUserRole();
        return userRole === role || userRole === 'admin';
    }
    
    // Get orders from localStorage
    getOrders() {
        const ordersStr = localStorage.getItem('orders');
        return ordersStr ? JSON.parse(ordersStr) : [];
    }
    
    // Store orders in localStorage
    setOrders(orders) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }
    
    // Add a single order
    addOrder(order) {
        const orders = this.getOrders();
        orders.push(order);
        this.setOrders(orders);
    }
    
    // Update an order
    updateOrder(orderId, updatedOrder) {
        const orders = this.getOrders();
        const index = orders.findIndex(order => order.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updatedOrder };
            this.setOrders(orders);
        }
    }
    
    // Get current user (alias for getUserData)
    getCurrentUser() {
        return this.getUserData();
    }
    
    // Get user events from localStorage
    getUserEvents() {
        const eventsStr = localStorage.getItem('userEvents');
        return eventsStr ? JSON.parse(eventsStr) : [];
    }
    
    // Store user events in localStorage
    setUserEvents(events) {
        localStorage.setItem('userEvents', JSON.stringify(events));
    }
}

// Create global instance
window.dataManager = new DataManager();