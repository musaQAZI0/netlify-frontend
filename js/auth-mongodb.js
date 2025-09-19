// MongoDB Authentication API utilities
class MongoAuthAPI {
    constructor() {
        // Use global Config if available, otherwise fallback
        this.baseURL = window.Config ? window.Config.API_BASE_URL : 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:3002/api'
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
    
    // Register user
    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Store auth data
            if (data.token) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            
            console.log('User registered successfully:', data.user);
            return data;
            
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    
    // Login user
    async login(email, password) {
        try {
            const response = await fetch(`${this.baseURL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }
            
            // Store auth data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
            
            console.log('User logged in successfully:', data.user);
            return data;
            
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Google OAuth login
    initiateGoogleAuth() {
        window.location.href = `${this.baseURL}/auth/google`;
    }
    
    // Handle OAuth callback (extract token from URL)
    handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const error = urlParams.get('error');
        
        if (error) {
            throw new Error('OAuth authentication failed');
        }
        
        if (token) {
            localStorage.setItem('authToken', token);
            // Fetch user profile after OAuth
            this.getProfile().then(data => {
                if (data.success) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                }
            });
            
            // Clean up URL
            const url = new URL(window.location);
            url.searchParams.delete('token');
            window.history.replaceState({}, document.title, url.toString());
            
            return true;
        }
        
        return false;
    }
    
    // Get user profile
    async getProfile(retryAfterRefresh = true) {
        try {
            const response = await fetch(`${this.baseURL}/auth/profile`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                // Handle token expiration - try to refresh first
                if (response.status === 401 && retryAfterRefresh) {
                    console.log('Token expired, attempting refresh');
                    try {
                        await this.refreshToken();
                        // Retry the request with new token
                        return await this.getProfile(false); // Don't retry again if this fails
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                        this.handleTokenExpiration();
                        throw new Error('Token expired');
                    }
                }

                const error = await response.json();
                throw new Error(error.message || 'Failed to get profile');
            }

            const data = await response.json();

            // Update stored user data
            if (data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }

            return data;
        } catch (error) {
            console.error('Profile API error:', error);

            // Handle token expiration specifically
            if (error.message === 'Token expired') {
                this.handleTokenExpiration();
            }

            throw error;
        }
    }

    // Handle token expiration
    handleTokenExpiration() {
        // Clear stored auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');

        // Store current page for redirect after login
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('redirectAfterLogin', currentPath);

        // Show user-friendly message
        if (typeof showErrorMessage === 'function') {
            showErrorMessage('Your session has expired. Please login again.', false);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            alert('Your session has expired. Please login again.');
            window.location.href = 'login.html';
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
            
            const data = await response.json();
            
            // Update stored user data
            if (data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            }
            
            return data;
        } catch (error) {
            console.error('Profile update API error:', error);
            throw error;
        }
    }
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await fetch(`${this.baseURL}/auth/change-password`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to change password');
            }
            
            return await response.json();
        } catch (error) {
            console.error('Password change error:', error);
            throw error;
        }
    }
    
    // Logout user
    async logout() {
        try {
            await fetch(`${this.baseURL}/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            // Always clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
        }
    }
    
    // Delete account
    async deleteAccount(password = null) {
        try {
            const body = password ? { password } : {};
            
            const response = await fetch(`${this.baseURL}/auth/account`, {
                method: 'DELETE',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to delete account');
            }
            
            // Clear local storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            return await response.json();
        } catch (error) {
            console.error('Account deletion error:', error);
            throw error;
        }
    }
    
    // Refresh authentication token
    async refreshToken() {
        try {
            const currentToken = localStorage.getItem('authToken');
            if (!currentToken) {
                throw new Error('No token to refresh');
            }

            const response = await fetch(`${this.baseURL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();

            if (data.token) {
                localStorage.setItem('authToken', data.token);
                console.log('Token refreshed successfully');
                return data.token;
            }

            throw new Error('No token in refresh response');
        } catch (error) {
            console.error('Token refresh failed:', error);
            // If refresh fails, handle as expired token
            this.handleTokenExpiration();
            throw error;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('currentUser');
        return !!(token && user);
    }

    // Check if token is close to expiration (optional - requires JWT parsing)
    async checkTokenValidity() {
        try {
            const response = await fetch(`${this.baseURL}/auth/verify`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                // Try to refresh token
                await this.refreshToken();
                return true;
            }

            return response.ok;
        } catch (error) {
            console.error('Token validity check failed:', error);
            return false;
        }
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
            const data = await response.json();
            return response.ok && data.status === 'OK';
        } catch (error) {
            console.log('Server not available');
            return false;
        }
    }
    
    // Alias for backward compatibility
    async signup(userData) {
        return this.register(userData);
    }
}

// Create global instance
window.mongoAuthAPI = new MongoAuthAPI();

// Also replace the old authAPI for backward compatibility
window.authAPI = window.mongoAuthAPI;

// Auto-handle OAuth callback on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        window.mongoAuthAPI.handleOAuthCallback();
    } catch (error) {
        console.error('OAuth callback error:', error);
    }
});