// Authentication API utilities
// API client class
class AuthAPI {
    constructor() {
        // Use global Config if available, otherwise fallback
        this.baseURL = window.Config ? window.Config.API_BASE_URL : 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3003/api'
                : 'https://crowd-backend-zxxp.onrender.com/api');
    }
    
    // Get auth headers
    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    }
    
    // Login user (local storage version)
    async login(email, password) {
        try {
            // For now, use local storage since backend doesn't exist
            return this.loginLocal(email, password);
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Local storage login
    loginLocal(email, password) {
        const users = this.getStoredUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }
        
        // Generate a simple token
        const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store auth data
        localStorage.setItem('authToken', token);
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }));
        
        console.log('User logged in successfully:', { email, name: user.name });
        
        return {
            success: true,
            token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        };
    }
    
    // Register user (local storage version)
    async register(userData) {
        try {
            // For now, use local storage since backend doesn't exist
            return this.registerLocal(userData);
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    
    // Local storage registration
    registerLocal(userData) {
        const { email, firstName, lastName, password, isOrganizer } = userData;
        
        // Check if user already exists
        const existingUsers = this.getStoredUsers();
        if (existingUsers.find(user => user.email === email)) {
            throw new Error('An account with this email already exists');
        }
        
        // Create new user
        const newUser = {
            id: this.generateUserId(),
            email: email,
            name: `${firstName} ${lastName}`,
            firstName: firstName,
            lastName: lastName,
            role: isOrganizer ? 'organizer' : 'user',
            password: password, // In real app, this would be hashed
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Add to users list
        existingUsers.push(newUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        console.log('User registered successfully:', { email, name: newUser.name, role: newUser.role });
        
        return {
            success: true,
            message: 'Account created successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                role: newUser.role
            }
        };
    }
    
    // Get stored users from localStorage
    getStoredUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    }
    
    // Generate unique user ID
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Alias for backward compatibility
    async signup(userData) {
        return this.register(userData);
    }
    
    // Get user profile
    async getProfile() {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to get profile');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Profile API error:', error);
            throw error;
        }
    }
    
    // Update user profile
    async updateProfile(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(userData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Profile update API error:', error);
            throw error;
        }
    }
    
    // Logout user
    async logout() {
        try {
            const response = await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
            
            // Clear local storage regardless of API response
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            return { success: true };
        } catch (error) {
            console.error('Logout API error:', error);
            // Still clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            return { success: true };
        }
    }
    
    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        return !!(token && user);
    }
    
    // Get current user
    getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }
    
    // Check server health
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseURL}/health`);
            return response.ok;
        } catch (error) {
            console.log('Server not available');
            return false;
        }
    }
}

// Create global instance
window.authAPI = new AuthAPI();