/**
 * Database-based Authentication System
 * Replaces localStorage-based authentication with secure database session management
 */

class DatabaseAuth {
    constructor() {
        this.API_BASE_URL = 'https://crowd-backend-zxxp.onrender.com/api';
        this.isInitialized = false;
        this.currentUser = null;
        this.currentToken = null;
        this.sessionCheckInterval = null;
    }

    /**
     * Initialize the authentication system
     */
    async init() {
        if (this.isInitialized) return;


        // Check for session from URL parameters (from logged_in_Version.html)
        const urlParams = new URLSearchParams(window.location.search);
        const userParam = urlParams.get('user');
        const tokenParam = urlParams.get('token');

        if (userParam && tokenParam) {
            try {
                const userData = JSON.parse(decodeURIComponent(userParam));
                await this.verifyAndSetSession(tokenParam, userData);
            } catch (error) {
                console.error('❌ Failed to process URL session data:', error);
            }
        }

        // Check for existing valid session
        await this.checkExistingSession();

        // Set up periodic session validation
        this.startSessionMonitoring();

        this.isInitialized = true;
    }

    /**
     * Check if there's an existing valid session
     */
    async checkExistingSession() {
        // First check if we have basic session data stored
        const storedToken = this.getStoredToken();
        if (!storedToken) return false;

        return await this.verifyAndSetSession(storedToken);
    }

    /**
     * Verify token with database and set session if valid
     */
    async verifyAndSetSession(token, userData = null) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });

            const data = await response.json();

            if (data.success && data.user) {
                this.currentUser = data.user;
                this.currentToken = token;
                this.storeSession(token, data.user);
                this.updateUI(true);
                return true;
            } else {
                this.clearSession();
                return false;
            }
        } catch (error) {
            console.error('❌ Session verification error:', error);
            this.clearSession();
            return false;
        }
    }

    /**
     * Login with email and password
     */
    async login(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                this.currentToken = data.token;
                this.storeSession(data.token, data.user);
                this.updateUI(true);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    }

    /**
     * Register new user
     */
    async register(userData) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                this.currentToken = data.token;
                this.storeSession(data.token, data.user);
                this.updateUI(true);
                return { success: true, user: data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            return { success: false, message: 'Registration failed. Please try again.' };
        }
    }

    /**
     * Logout and clear session
     */
    async logout() {
        try {
            if (this.currentToken) {
                await fetch(`${this.API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.currentToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('❌ Logout error:', error);
        }

        this.clearSession();
        return { success: true };
    }

    /**
     * Get user's active sessions
     */
    async getSessions() {
        if (!this.currentToken) return { success: false, message: 'Not authenticated' };

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/sessions`, {
                headers: {
                    'Authorization': `Bearer ${this.currentToken}`
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('❌ Get sessions error:', error);
            return { success: false, message: 'Failed to fetch sessions' };
        }
    }

    /**
     * Revoke all sessions
     */
    async revokeAllSessions() {
        if (!this.currentToken) return { success: false, message: 'Not authenticated' };

        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/revoke-all-sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.currentToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (data.success) {
                this.clearSession();
                this.updateUI(false);
            }

            return data;
        } catch (error) {
            console.error('❌ Revoke sessions error:', error);
            return { success: false, message: 'Failed to revoke sessions' };
        }
    }

    /**
     * Store session data securely (using sessionStorage for security)
     */
    storeSession(token, user) {
        // Use sessionStorage instead of localStorage for better security
        // sessionStorage is cleared when tab is closed
        try {
            sessionStorage.setItem('crowd_auth_token', token);
            sessionStorage.setItem('crowd_user_data', JSON.stringify(user));
        } catch (error) {
            console.error('❌ Failed to store session:', error);
        }
    }

    /**
     * Get stored token
     */
    getStoredToken() {
        try {
            return sessionStorage.getItem('crowd_auth_token');
        } catch (error) {
            console.error('❌ Failed to get stored token:', error);
            return null;
        }
    }

    /**
     * Get stored user data
     */
    getStoredUser() {
        try {
            const userData = sessionStorage.getItem('crowd_user_data');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Failed to get stored user:', error);
            return null;
        }
    }

    /**
     * Clear session data
     */
    clearSession() {
        this.currentUser = null;
        this.currentToken = null;

        try {
            sessionStorage.removeItem('crowd_auth_token');
            sessionStorage.removeItem('crowd_user_data');
        } catch (error) {
            console.error('❌ Failed to clear session:', error);
        }

        this.updateUI(false);
        this.stopSessionMonitoring();
    }

    /**
     * Start monitoring session validity
     */
    startSessionMonitoring() {
        // Check session every 5 minutes
        this.sessionCheckInterval = setInterval(() => {
            if (this.currentToken) {
                this.verifyAndSetSession(this.currentToken);
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Stop session monitoring
     */
    stopSessionMonitoring() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }
    }

    /**
     * Update UI based on authentication state
     */
    updateUI(isLoggedIn) {
        const loggedOutHeader = document.querySelector('.logged-out-header');
        const loggedInHeader = document.querySelector('.logged-in-header');

        if (isLoggedIn && this.currentUser) {
            // Show logged-in header
            if (loggedOutHeader) loggedOutHeader.style.display = 'none';
            if (loggedInHeader) {
                loggedInHeader.style.display = 'block';
                document.body.classList.add('is-logged-in');

                // Update user info in header
                const userNameElement = document.querySelector('.user-name');
                const userEmailElement = document.querySelector('.user-email');
                const profileImageElement = document.querySelector('.profile-image');

                if (userNameElement) {
                    userNameElement.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
                }
                if (userEmailElement) {
                    userEmailElement.textContent = this.currentUser.email;
                }
                if (profileImageElement) {
                    profileImageElement.src = this.currentUser.profilePicture || '/images/default-avatar.png';
                }
            }
        } else {
            // Show logged-out header
            if (loggedInHeader) loggedInHeader.style.display = 'none';
            if (loggedOutHeader) loggedOutHeader.style.display = 'block';
            document.body.classList.remove('is-logged-in');
        }

        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: { isLoggedIn, user: this.currentUser }
        }));
    }

    /**
     * Get current authentication state
     */
    getAuthState() {
        return {
            isLoggedIn: !!this.currentUser,
            user: this.currentUser,
            token: this.currentToken
        };
    }

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        if (!this.currentToken) {
            throw new Error('Not authenticated');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.currentToken}`,
                'Content-Type': 'application/json'
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        const response = await fetch(`${this.API_BASE_URL}${endpoint}`, mergedOptions);

        // If unauthorized, clear session
        if (response.status === 401) {
            this.clearSession();
            throw new Error('Session expired');
        }

        return response;
    }
}

// Create global instance
const dbAuth = new DatabaseAuth();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => dbAuth.init());
} else {
    dbAuth.init();
}

// Export for use in other scripts
window.DatabaseAuth = DatabaseAuth;
window.dbAuth = dbAuth;