// Authentication and User Profile Utilities
class AuthUtils {
    constructor() {
        this.baseURL = window.Config ? window.Config.API_BASE_URL :
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : 'https://crowd-backend-zxxp.onrender.com');
        this.currentUser = null;
        this.TOKEN_KEY = 'authToken';
    }

    // Get authentication token from localStorage (consistent with auth-mongodb.js)
    getAuthToken() {
        // Get from URL parameters first (for direct links)
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');

        // Use standardized token management
        if (!token) {
            token = localStorage.getItem(this.TOKEN_KEY);
        }

        // Store token consistently if found in URL
        if (token && !localStorage.getItem(this.TOKEN_KEY)) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }

        return token || '';
    }

    // Set authentication token in localStorage
    setAuthToken(token) {
        if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
        } else {
            localStorage.removeItem(this.TOKEN_KEY);
        }
    }

    // Check if user is authenticated using consistent token approach
    async isAuthenticated() {
        try {
            const token = this.getAuthToken();
            if (!token) {
                console.log('No auth token found');
                return false;
            }

            const response = await fetch(`${this.baseURL}/api/auth/verify`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Token expired, clearing auth data');
                    this.clearAuthData();
                }
                return false;
            }

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Authentication check failed:', error);
            return false;
        }
    }

    // Clear authentication data
    clearAuthData() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem('currentUser');
        this.currentUser = null;
    }

    // API request helper with consistent authentication
    async apiRequest(endpoint, options = {}) {
        const token = this.getAuthToken();

        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}/api${endpoint}`, config);

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    console.log('Token expired during API request');
                    this.clearAuthData();
                    throw new Error('Session expired. Please log in again.');
                }
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Get current user profile
    async getCurrentUser() {
        try {
            // First check localStorage
            const cachedUser = localStorage.getItem('currentUser');
            if (cachedUser) {
                try {
                    this.currentUser = JSON.parse(cachedUser);
                } catch (e) {
                    localStorage.removeItem('currentUser');
                }
            }

            // If we have cached user and they're authenticated, return it
            if (this.currentUser && await this.isAuthenticated()) {
                return this.currentUser;
            }

            // Otherwise try to fetch from API
            const data = await this.apiRequest('/auth/profile');
            if (data.success && data.user) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return this.currentUser;
            }

            return null;
        } catch (error) {
            console.error('Failed to get current user:', error);
            return null;
        }
    }

    // Update user profile
    async updateUserProfile(profileData) {
        try {
            const data = await this.apiRequest('/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });
            
            if (data.success && data.user) {
                this.currentUser = data.user;
                return data.user;
            }
            
            throw new Error(data.message || 'Failed to update profile');
        } catch (error) {
            console.error('Failed to update user profile:', error);
            throw error;
        }
    }

    // Login user
    async login(email, password) {
        try {
            const data = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            if (data.success && data.token) {
                this.setAuthToken(data.token);
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return { success: true, user: data.user };
            }

            throw new Error(data.message || 'Login failed');
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    }

    // Register user
    async register(userData) {
        try {
            const data = await this.apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });

            if (data.success && data.token) {
                await this.setAuthToken(data.token);
                this.currentUser = data.user;
                return { success: true, user: data.user };
            }

            throw new Error(data.message || 'Registration failed');
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    }

    // Logout user
    async logout() {
        try {
            const token = this.getAuthToken();
            if (token) {
                await fetch(`${this.baseURL}/api/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('Logout request failed:', error);
        }

        // Clear all authentication data
        this.clearAuthData();

        // Redirect to login page
        window.location.href = 'login.html';
    }

    // Get user initials for avatar
    getUserInitials(user = null) {
        const currentUser = user || this.currentUser;
        if (!currentUser) return 'U';
        
        // Try to get initials from firstName and lastName
        if (currentUser.firstName && currentUser.lastName) {
            return (currentUser.firstName[0] + currentUser.lastName[0]).toUpperCase();
        }
        
        // Try to get initials from name
        if (currentUser.name && currentUser.name.trim()) {
            const names = currentUser.name.trim().split(' ');
            if (names.length >= 2) {
                return (names[0][0] + names[1][0]).toUpperCase();
            } else {
                return names[0][0].toUpperCase();
            }
        }
        
        // Try firstName only
        if (currentUser.firstName) {
            return currentUser.firstName[0].toUpperCase();
        }
        
        // Fallback to email
        if (currentUser.email) {
            return currentUser.email[0].toUpperCase();
        }
        
        return 'U';
    }

    // Get user display name
    getUserDisplayName(user = null) {
        const currentUser = user || this.currentUser;
        if (!currentUser) return 'User';
        
        if (currentUser.name) {
            return currentUser.name;
        }
        
        if (currentUser.firstName) {
            return currentUser.firstName + (currentUser.lastName ? ' ' + currentUser.lastName : '');
        }
        
        if (currentUser.email) {
            return currentUser.email.split('@')[0];
        }
        
        return 'User';
    }

    // Initialize user interface elements
    async initializeUserInterface() {
        if (!(await this.isAuthenticated())) {
            console.log('User not authenticated, skipping UI initialization');
            return;
        }

        try {
            console.log('Initializing user interface...');
            const user = await this.getCurrentUser();
            if (user) {
                console.log('User loaded:', user);
                this.updateUserInterfaceElements(user);
            } else {
                console.log('No user data received');
            }
        } catch (error) {
            console.error('Failed to initialize user interface:', error);
        }
    }

    // Update user interface elements with user data
    updateUserInterfaceElements(user) {
        console.log('Updating UI elements with user:', user);
        
        // Update user avatar
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            const initials = this.getUserInitials(user);
            console.log('Setting avatar initials to:', initials);
            userAvatar.textContent = initials;
        } else {
            console.log('userAvatar element not found');
        }

        // Update user name
        const userName = document.getElementById('userName');
        if (userName) {
            const displayName = this.getUserDisplayName(user);
            console.log('Setting display name to:', displayName);
            userName.textContent = displayName;
        } else {
            console.log('userName element not found');
        }

        // Update any profile images
        const profileImages = document.querySelectorAll('.user-profile-image');
        profileImages.forEach(img => {
            if (user.profileImage) {
                img.src = user.profileImage;
                img.alt = this.getUserDisplayName(user);
            }
        });

        // Update user email displays
        const userEmails = document.querySelectorAll('.user-email');
        userEmails.forEach(email => {
            if (user.email) {
                email.textContent = user.email;
            }
        });
    }

    // Check authentication and redirect if needed
    async requireAuthentication(redirectUrl = null) {
        if (!(await this.isAuthenticated())) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Handle redirect after login (no longer needed with database-only auth)
    handleRedirectAfterLogin() {
        // Database-only authentication - no redirect handling needed
        console.log('Database-only authentication active');
    }
}

// Create global instance
window.authUtils = new AuthUtils();

// Auto-initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (window.authUtils) {
        window.authUtils.initializeUserInterface();
    }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthUtils;
}