// Enhanced Authentication Manager - Best Practices Implementation
class AuthManager {
    constructor(options = {}) {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.options = {
            useModal: options.useModal || false,
            apiEndpoint: options.apiEndpoint || '/api/auth',
            tokenStorageKey: 'crowd_auth_token',
            userStorageKey: 'crowd_user_data',
            sessionTimeout: options.sessionTimeout || 24 * 60 * 60 * 1000, // 24 hours
            ...options
        };

        this.init();
    }

    async init() {
        this.setupCSRFProtection();
        await this.checkAuthStatus();
        this.setupEventListeners();
        this.startSessionMonitoring();
    }

    // CSRF Protection
    setupCSRFProtection() {
        // Get CSRF token from meta tag or API call
        this.csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
        if (!this.csrfToken) {
            this.refreshCSRFToken();
        }
    }

    async refreshCSRFToken() {
        try {
            const response = await fetch(`${this.options.apiEndpoint}/csrf-token`);
            const data = await response.json();
            this.csrfToken = data.token;
        } catch (error) {
            console.warn('Failed to get CSRF token:', error);
        }
    }

    // Enhanced Authentication Status Check
    async checkAuthStatus() {
        const token = this.getStoredToken();
        if (!token || this.isTokenExpired()) {
            this.clearAuthData();
            this.updateUI();
            return false;
        }

        try {
            const response = await this.makeAuthenticatedRequest('/status', 'GET');

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isAuthenticated = true;
                this.updateStoredUserData(data.user);
                this.updateUI();
                return true;
            } else {
                throw new Error('Authentication failed');
            }
        } catch (error) {
            console.error('Auth status check failed:', error);
            // Fallback to stored data for offline scenario
            return this.checkStoredAuth();
        }
    }

    // Check stored authentication data
    checkStoredAuth() {
        const userData = this.getStoredUserData();
        const token = this.getStoredToken();

        if (userData && token && !this.isTokenExpired()) {
            this.currentUser = userData;
            this.isAuthenticated = true;
            this.updateUI();
            return true;
        }

        this.clearAuthData();
        this.updateUI();
        return false;
    }

    // Enhanced Login Function
    async login(credentials) {
        const { email, password, rememberMe = false } = credentials;

        // Client-side validation
        if (!this.validateEmail(email)) {
            return { success: false, error: 'Invalid email format' };
        }

        if (!this.validatePassword(password)) {
            return { success: false, error: 'Password must be at least 8 characters' };
        }

        try {
            const response = await fetch(`${this.options.apiEndpoint}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password,
                    rememberMe,
                    fingerprint: await this.generateFingerprint()
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.handleSuccessfulLogin(data, rememberMe);
                return { success: true, user: data.user };
            } else {
                // Handle specific error cases
                if (response.status === 429) {
                    return { success: false, error: 'Too many login attempts. Please try again later.' };
                }
                return { success: false, error: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login request failed:', error);

            // Development fallback
            if (process.env.NODE_ENV === 'development') {
                return this.simulateLogin(credentials);
            }

            return { success: false, error: 'Network error. Please check your connection.' };
        }
    }

    // Handle successful login
    handleSuccessfulLogin(data, rememberMe) {
        this.currentUser = data.user;
        this.isAuthenticated = true;

        // Store authentication data securely
        this.storeAuthData(data.token, data.user, rememberMe);

        // Update UI
        this.updateUI();

        // Dispatch success event
        this.dispatchAuthEvent('login', { user: data.user });

        // Redirect if needed
        const redirectUrl = sessionStorage.getItem('intended_url');
        if (redirectUrl) {
            sessionStorage.removeItem('intended_url');
            window.location.href = redirectUrl;
        }
    }

    // Enhanced Logout
    async logout(force = false) {
        if (!force && !confirm('Are you sure you want to log out?')) {
            return;
        }

        try {
            // Notify server
            await this.makeAuthenticatedRequest('/logout', 'POST');
        } catch (error) {
            console.warn('Server logout failed:', error);
        }

        // Clear all auth data
        this.clearAuthData();
        this.currentUser = null;
        this.isAuthenticated = false;

        // Update UI
        this.updateUI();

        // Dispatch logout event
        this.dispatchAuthEvent('logout');

        // Redirect to home or login page
        if (this.requiresAuth()) {
            window.location.href = '/login';
        }
    }

    // Event Listeners for Page-Based Authentication
    setupEventListeners() {
        // Handle login/signup clicks - always redirect to dedicated pages
        document.addEventListener('click', (e) => {
            // Check for login links
            if (e.target.classList.contains('login-link') ||
                e.target.textContent.trim() === 'Log In') {
                e.preventDefault();

                // Store current page for redirect after login
                if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                    sessionStorage.setItem('intended_url', window.location.href);
                }

                window.location.href = '/login.html';
                return;
            }

            // Check for signup links
            if (e.target.classList.contains('signup-link') ||
                e.target.textContent.trim() === 'Sign Up') {
                e.preventDefault();
                window.location.href = '/signup.html';
                return;
            }

            // Handle data-auth-action attributes (more flexible approach)
            const target = e.target.closest('[data-auth-action]');
            if (target) {
                const action = target.dataset.authAction;

                if (action === 'login') {
                    e.preventDefault();
                    if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
                        sessionStorage.setItem('intended_url', window.location.href);
                    }
                    window.location.href = '/login.html';
                }

                if (action === 'signup') {
                    e.preventDefault();
                    window.location.href = '/signup.html';
                }
            }
        });

        // Handle logout clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-auth-action="logout"]') ||
                e.target.id === 'logoutLink') {
                e.preventDefault();
                this.logout();
            }
        });

        // Handle session timeout via storage events
        window.addEventListener('storage', (e) => {
            if (e.key === this.options.tokenStorageKey && !e.newValue) {
                this.handleSessionTimeout();
            }
        });

        // Handle visibility change for session refresh
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isAuthenticated) {
                this.refreshSession();
            }
        });
    }

    // Remove modal-related methods since we're using dedicated pages
    showAuthModal(mode = 'login') {
        // Not needed - redirect to dedicated pages
        console.log('Redirecting to dedicated auth pages instead of modal');
    }

    createAuthModal(mode) {
        // Not needed - redirect to dedicated pages
        return null;
    }

    getAuthFormHTML(mode) {
        // Not needed - forms are on dedicated pages
        return '';
    }

    // Enhanced Security Features
    async generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);

        const fingerprint = {
            canvas: canvas.toDataURL(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`
        };

        return btoa(JSON.stringify(fingerprint)).substring(0, 32);
    }

    // Session Management
    startSessionMonitoring() {
        // Check session every 5 minutes
        setInterval(() => {
            if (this.isAuthenticated && this.isTokenExpired()) {
                this.handleSessionTimeout();
            }
        }, 5 * 60 * 1000);
    }

    async refreshSession() {
        if (!this.isAuthenticated) return;

        try {
            const response = await this.makeAuthenticatedRequest('/refresh', 'POST');
            if (response.ok) {
                const data = await response.json();
                this.storeAuthData(data.token, this.currentUser, true);
            }
        } catch (error) {
            console.warn('Session refresh failed:', error);
        }
    }

    handleSessionTimeout() {
        this.clearAuthData();
        this.currentUser = null;
        this.isAuthenticated = false;
        this.updateUI();

        // Show session expired message
        this.showNotification('Your session has expired. Please log in again.', 'warning');

        // Redirect to login if on protected page
        if (this.requiresAuth()) {
            sessionStorage.setItem('intended_url', window.location.href);
            window.location.href = '/login';
        }
    }

    // Utility Methods
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        return password && password.length >= 8;
    }

    isTokenExpired() {
        const loginTime = localStorage.getItem('crowd_login_time');
        if (!loginTime) return true;

        const now = Date.now();
        const elapsed = now - parseInt(loginTime);
        return elapsed > this.options.sessionTimeout;
    }

    requiresAuth() {
        const protectedPaths = ['/dashboard', '/profile', '/settings', '/tickets'];
        return protectedPaths.some(path => window.location.pathname.startsWith(path));
    }

    // Storage Management (consider using secure httpOnly cookies for production)
    storeAuthData(token, user, rememberMe) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(this.options.tokenStorageKey, token);
        storage.setItem(this.options.userStorageKey, JSON.stringify(user));
        storage.setItem('crowd_login_time', Date.now().toString());
    }

    getStoredToken() {
        return localStorage.getItem(this.options.tokenStorageKey) ||
            sessionStorage.getItem(this.options.tokenStorageKey);
    }

    getStoredUserData() {
        const userStr = localStorage.getItem(this.options.userStorageKey) ||
            sessionStorage.getItem(this.options.userStorageKey);
        return userStr ? JSON.parse(userStr) : null;
    }

    clearAuthData() {
        ['localStorage', 'sessionStorage'].forEach(storageType => {
            const storage = window[storageType];
            storage.removeItem(this.options.tokenStorageKey);
            storage.removeItem(this.options.userStorageKey);
            storage.removeItem('crowd_login_time');
        });
    }

    async makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
        const token = this.getStoredToken();
        const headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }

        return fetch(`${this.options.apiEndpoint}${endpoint}`, {
            method,
            headers,
            credentials: 'include',
            body: body ? JSON.stringify(body) : null
        });
    }

    // Event System
    dispatchAuthEvent(eventType, detail = {}) {
        window.dispatchEvent(new CustomEvent(`auth:${eventType}`, {
            detail: { ...detail, timestamp: Date.now() }
        }));
    }

    // UI Updates
    updateUI() {
        // Update navigation
        this.updateNavigation();

        // Update page content based on auth state
        document.body.classList.toggle('authenticated', this.isAuthenticated);
        document.body.classList.toggle('unauthenticated', !this.isAuthenticated);

        // Dispatch UI update event
        this.dispatchAuthEvent('uiUpdate', {
            isAuthenticated: this.isAuthenticated,
            user: this.currentUser
        });
    }

    updateNavigation() {
        const navContainer = document.querySelector('.nav-links');
        if (!navContainer) return;

        if (this.isAuthenticated && this.currentUser) {
            navContainer.innerHTML = `
                <a href="contact_sales.html" class="nav-link">Contact Sales</a>
                <a href="create-events.html" class="nav-link">Create Events</a>
                <a href="tickets-profile.html" class="nav-link secondary">My Tickets</a>
                <div class="help-dropdown" id="helpDropdown">
                    <button class="help-dropdown-btn" id="helpDropdownBtn" type="button">
                        <span>Help Center</span>
                        <span class="dropdown-arrow">▾</span>
                    </button>
                    <div class="help-dropdown-content" id="helpDropdownContent">
                        <a href="Help_center.html">Help Center</a>
                        <a href="Help_Center_sub_parts/Your_tickets_new.html">Find your tickets</a>
                        <a href="Help_Center_sub_parts/crowd_help_center_contact_organizer.html">Contact your event organizer</a>
                    </div>
                </div>
                <div class="user-profile-dropdown">
                    <button class="nav-link secondary user-profile-btn">
                        <span class="user-avatar">${this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U'}</span>
                        <span>${this.currentUser.name || 'User'}</span>
                        <span>▾</span>
                    </button>
                    <div class="user-dropdown-content">
                        <a href="settings-new.html">Account Settings</a>
                        <a href="organizer-dashboard.html">Organizer Dashboard</a>
                        <a href="#" data-auth-action="logout">Log Out</a>
                    </div>
                </div>
            `;
        } else {
            navContainer.innerHTML = `
                <a href="contact_sales.html" class="nav-link">Contact Sales</a>
                <a href="create-events.html" class="nav-link">Create Events</a>
                <a href="#" class="nav-link secondary">Find my tickets</a>
                <div class="help-dropdown" id="helpDropdown">
                    <button class="help-dropdown-btn" id="helpDropdownBtn" type="button">
                        <span>Help Center</span>
                        <span class="dropdown-arrow">▾</span>
                    </button>
                    <div class="help-dropdown-content" id="helpDropdownContent">
                        <a href="Help_center.html">Help Center</a>
                        <a href="Help_Center_sub_parts/Your_tickets_new.html">Find your tickets</a>
                        <a href="Help_Center_sub_parts/crowd_help_center_contact_organizer.html">Contact your event organizer</a>
                    </div>
                </div>
                <a href="login.html" class="nav-link secondary login-link">Log In</a>
                <a href="signup.html" class="nav-link primary signup-link">Sign Up</a>
            `;
        }

        // Re-attach dropdown event listeners after updating navigation
        this.attachDropdownListeners();
    }

    // Attach dropdown event listeners for help center dropdown
    attachDropdownListeners() {
        const helpDropdownBtn = document.getElementById('helpDropdownBtn');
        if (helpDropdownBtn) {
            helpDropdownBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const helpDropdown = document.getElementById('helpDropdown');
                if (helpDropdown) {
                    // Close other dropdowns
                    document.querySelectorAll('.help-dropdown.active, .user-profile-dropdown.active')
                        .forEach(dropdown => dropdown.classList.remove('active'));

                    // Toggle current dropdown
                    helpDropdown.classList.toggle('active');
                }
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.help-dropdown, .user-profile-dropdown')) {
                document.querySelectorAll('.help-dropdown.active, .user-profile-dropdown.active')
                    .forEach(dropdown => dropdown.classList.remove('active'));
            }
        });
    }

    showNotification(message, type = 'info') {
        // Simple notification implementation
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
            color: white;
            border-radius: 6px;
            z-index: 10000;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 4000);
    }

    // Development simulation
    simulateLogin(credentials) {
        const { email, password } = credentials;

        if (email && password.length >= 8) {
            const user = {
                id: Date.now(),
                email: email.toLowerCase().trim(),
                name: email.split('@')[0],
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
                preferences: {
                    location: 'Federal Capital Territory',
                    interests: ['nightlife', 'music', 'events']
                }
            };

            this.handleSuccessfulLogin({ token: `demo-${Date.now()}`, user }, true);
            return { success: true, user };
        }

        return { success: false, error: 'Invalid credentials' };
    }
}

// Initialize with page-based authentication (no modals)
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager({
        useModal: false, // Always use dedicated pages
        apiEndpoint: '/api/auth',
        sessionTimeout: 24 * 60 * 60 * 1000 // 24 hours
    });

    // For existing login/signup pages, attach form handlers
    const currentPage = window.location.pathname;

    if (currentPage.includes('login')) {
        window.authManager.attachLoginFormHandler();
    }

    if (currentPage.includes('signup')) {
        window.authManager.attachSignupFormHandler();
    }
});

// Add form handlers for login/signup pages
AuthManager.prototype.attachLoginFormHandler = function () {
    const loginForm = document.querySelector('#loginForm, .login-form, form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = loginForm.querySelector('input[type="email"], input[name="email"]').value;
        const password = loginForm.querySelector('input[type="password"], input[name="password"]').value;
        const rememberMe = loginForm.querySelector('input[type="checkbox"]')?.checked || false;

        const result = await this.login({ email, password, rememberMe });

        if (result.success) {
            this.showNotification('Login successful! Redirecting...', 'success');

            // Redirect to intended page or home
            const intendedUrl = sessionStorage.getItem('intended_url');
            setTimeout(() => {
                window.location.href = intendedUrl || 'index.html';
            }, 1000);
        } else {
            this.showNotification(result.error, 'error');
        }
    });
};

AuthManager.prototype.attachSignupFormHandler = function () {
    const signupForm = document.querySelector('#signupForm, .signup-form, form');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = signupForm.querySelector('input[name="name"], input[name="fullname"]')?.value;
        const email = signupForm.querySelector('input[type="email"], input[name="email"]').value;
        const password = signupForm.querySelector('input[type="password"], input[name="password"]').value;

        // Basic validation
        if (!this.validateEmail(email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!this.validatePassword(password)) {
            this.showNotification('Password must be at least 8 characters', 'error');
            return;
        }

        const result = await this.signup({ name, email, password });

        if (result.success) {
            this.showNotification('Account created successfully! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            this.showNotification(result.error, 'error');
        }
    });
};

// Add signup method
AuthManager.prototype.signup = async function (credentials) {
    const { name, email, password } = credentials;

    if (!this.validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
    }

    if (!this.validatePassword(password)) {
        return { success: false, error: 'Password must be at least 8 characters' };
    }

    try {
        const response = await fetch(`${this.options.apiEndpoint}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': this.csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            credentials: 'include',
            body: JSON.stringify({
                name: name?.trim(),
                email: email.toLowerCase().trim(),
                password,
                fingerprint: await this.generateFingerprint()
            })
        });

        const data = await response.json();

        if (response.ok) {
            this.handleSuccessfulLogin(data, true);
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.message || 'Signup failed' };
        }
    } catch (error) {
        console.error('Signup request failed:', error);

        // Development fallback
        if (process.env.NODE_ENV === 'development') {
            return this.simulateSignup(credentials);
        }

        return { success: false, error: 'Network error. Please check your connection.' };
    }
};

// Development simulation for signup
AuthManager.prototype.simulateSignup = function (credentials) {
    const { name, email, password } = credentials;

    if (email && password.length >= 8) {
        const user = {
            id: Date.now(),
            email: email.toLowerCase().trim(),
            name: name || email.split('@')[0],
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${email}`,
            preferences: {
                location: 'Federal Capital Territory',
                interests: []
            }
        };

        this.handleSuccessfulLogin({ token: `demo-${Date.now()}`, user }, true);
        return { success: true, user };
    }

    return { success: false, error: 'Invalid information provided' };
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}