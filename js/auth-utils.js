// Authentication and User Profile Utilities
class AuthUtils {
    constructor() {
        this.baseURL = window.Config ? window.Config.API_BASE_URL : 'http://localhost:3001/api';
        this.currentUser = null;
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    // Set authentication token
    setAuthToken(token) {
        if (token) {
            localStorage.setItem('authToken', token);
        } else {
            localStorage.removeItem('authToken');
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = this.getAuthToken();
        return !!token;
    }

    // API request helper
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
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    this.logout();
                    throw new Error('Session expired. Please log in again.');
                }
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Get current user profile
    async getCurrentUser() {
        if (!this.isAuthenticated()) {
            return null;
        }

        try {
            if (this.currentUser) {
                return this.currentUser;
            }

            const data = await this.apiRequest('/auth/profile');
            if (data.success && data.user) {
                this.currentUser = data.user;
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
                this.setAuthToken(data.token);
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
    logout() {
        this.setAuthToken(null);
        this.currentUser = null;
        
        // Clear any other session data
        localStorage.removeItem('editingEventId');
        localStorage.removeItem('redirectAfterLogin');
        
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
        if (!this.isAuthenticated()) {
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
    requireAuthentication(redirectUrl = null) {
        if (!this.isAuthenticated()) {
            if (redirectUrl) {
                localStorage.setItem('redirectAfterLogin', redirectUrl);
            }
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    // Handle redirect after login
    handleRedirectAfterLogin() {
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
            localStorage.removeItem('redirectAfterLogin');
            window.location.href = redirectUrl;
        }
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