// Help Center Authentication and User Profile Management
// This script manages user authentication and profile display across help center subparts

class HelpCenterAuth {
    constructor() {
        this.baseURL = 'https://crowd-backend-zxxp.onrender.com/api';
        this.isLoggedIn = false;
        this.currentUser = null;
    }

    // Initialize authentication on page load
    async init() {
        try {
            await this.checkAuthentication();
            this.setupEventListeners();
        } catch (error) {
            console.error('Help Center Auth initialization error:', error);
        }
    }

    // Check if user is authenticated and load profile
    async checkAuthentication() {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
            this.showLoggedOutState();
            return;
        }

        // First try to get user data from localStorage
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                this.showLoggedInState(userData);
            } catch (error) {
                console.error('Error parsing stored user data:', error);
            }
        }

        // Then try to fetch fresh data from API
        try {
            const response = await fetch(`${this.baseURL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    // Update localStorage with fresh data
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                    this.showLoggedInState(data.user);
                } else {
                    // Invalid token, redirect to login
                    this.handleInvalidToken();
                }
            } else {
                // If API call fails but we have stored user data, continue with that
                if (!storedUser) {
                    this.handleInvalidToken();
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            // If API is not available but we have stored user data, continue
            if (!storedUser) {
                // Fallback: try to get user data from any stored format
                const fallbackUserData = this.getUserDataFromStorage();
                if (fallbackUserData) {
                    this.showLoggedInState(fallbackUserData);
                } else {
                    this.showLoggedOutState();
                }
            }
        }
    }

    // Try to get user data from various storage formats
    getUserDataFromStorage() {
        const possibleKeys = ['currentUser', 'user', 'userData', 'authUser'];
        
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && (parsed.name || parsed.firstName || parsed.username || parsed.email)) {
                        return parsed;
                    }
                } catch (error) {
                    continue;
                }
            }
        }
        
        return null;
    }

    // Show logged in state
    showLoggedInState(user) {
        this.isLoggedIn = true;
        this.currentUser = user;
        document.body.classList.add('user-logged-in');

        // Extract user data with flexible field names
        let firstName = user.firstName || user.first_name || user.name || 'User';
        let lastName = user.lastName || user.last_name || '';
        
        // If name is a single field, try to split it
        if (!lastName && firstName.includes(' ')) {
            const nameParts = firstName.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.slice(1).join(' ');
        }
        
        // Handle case where only email is available
        if (firstName === 'User' && user.email) {
            firstName = user.email.split('@')[0].replace(/[._]/g, ' ');
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        }
        
        // Handle username as fallback
        if (firstName === 'User' && user.username) {
            firstName = user.username.charAt(0).toUpperCase() + user.username.slice(1);
        }

        const fullName = `${firstName} ${lastName}`.trim();
        const initials = `${firstName.charAt(0)}${lastName.charAt(0) || firstName.charAt(1) || ''}`.toUpperCase();
        
        // Determine user role
        let roleText = 'Attendee'; // default
        if (user.isOrganizer || user.is_organizer || user.role === 'organizer' || user.userType === 'organizer') {
            roleText = 'Event Organizer';
        } else if (user.role === 'admin' || user.userType === 'admin' || user.isAdmin) {
            roleText = 'Administrator';
        }

        // Update header elements
        this.updateHeaderElements(fullName, initials, roleText, user);
        
        // Update back navigation links
        this.updateBackNavigationLinks();

        console.log('User logged in:', { fullName, initials, roleText, user });
    }

    // Update header elements with user data
    updateHeaderElements(fullName, initials, roleText, user) {
        // Update various possible header element IDs
        const headerElements = {
            headerUserName: fullName,
            headerUserNameLogged: fullName,
            headerUserInitials: initials,
            headerUserInitialsLogged: initials,
            headerUserRole: roleText,
            userNameDisplay: fullName,
            userInitialsDisplay: initials
        };

        Object.entries(headerElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Update avatar background if user has profile image
        const avatarElements = ['headerUserAvatar', 'headerUserAvatarLogged'];
        avatarElements.forEach(avatarId => {
            const headerAvatar = document.getElementById(avatarId);
            if (headerAvatar && user.profile && user.profile.avatar) {
                headerAvatar.style.backgroundImage = `url(${user.profile.avatar})`;
                headerAvatar.style.backgroundSize = 'cover';
                headerAvatar.style.backgroundPosition = 'center';
                const initialsSpan = headerAvatar.querySelector('span');
                if (initialsSpan) {
                    initialsSpan.style.display = 'none';
                }
            }
        });
    }

    // Show logged out state
    showLoggedOutState() {
        this.isLoggedIn = false;
        this.currentUser = null;
        document.body.classList.remove('user-logged-in');
        
        // Update back navigation links
        this.updateBackNavigationLinks();
        
        console.log('User not logged in');
    }

    // Handle invalid token
    handleInvalidToken() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        this.showLoggedOutState();
        
        // Optionally redirect to login or main help center
        // window.location.href = '../login.html';
    }

    // Setup event listeners
    setupEventListeners() {
        // User dropdown functionality
        const userProfile = document.getElementById('headerUserProfile') || document.getElementById('headerUserProfileLogged');
        const userDropdown = document.getElementById('userDropdown') || document.getElementById('userDropdownLogged');
        
        if (userProfile && userDropdown) {
            userProfile.addEventListener('click', (e) => {
                e.preventDefault();
                userDropdown.classList.toggle('show');
                userProfile.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userProfile.contains(e.target)) {
                    userDropdown.classList.remove('show');
                    userProfile.classList.remove('active');
                }
            });
        }

        // Dropdown menu items
        const dropdownItems = [
            'viewProfileDropdown',
            'accountSettingsDropdown', 
            'organizerDashboardDropdown',
            'logoutDropdown',
            'logoutDropdownLogged'
        ];

        dropdownItems.forEach(itemId => {
            const item = document.getElementById(itemId);
            if (item) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleDropdownAction(itemId);
                    if (userDropdown) {
                        userDropdown.classList.remove('show');
                    }
                    if (userProfile) {
                        userProfile.classList.remove('active');
                    }
                });
            }
        });

        // Back navigation
        const backButtons = document.querySelectorAll('.back-button, [onclick*="back"]');
        backButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateBack();
            });
        });
    }

    // Handle dropdown actions
    handleDropdownAction(actionId) {
        switch(actionId) {
            case 'viewProfileDropdown':
                console.log('View profile clicked');
                // Implement profile view
                break;
            case 'accountSettingsDropdown':
                console.log('Account settings clicked');
                // Navigate to account settings
                break;
            case 'organizerDashboardDropdown':
                console.log('Organizer dashboard clicked');
                window.location.href = '../organizer-dashboard.html';
                break;
            case 'logoutDropdown':
            case 'logoutDropdownLogged':
                this.logout();
                break;
        }
    }

    // Logout user
    async logout() {
        const token = localStorage.getItem('authToken');
        
        if (token) {
            try {
                await fetch(`${this.baseURL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
        }
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        console.log('User logged out');
        
        // Navigate back to main help center
        window.location.href = '../Help_center.html';
    }

    // Navigate back to help center
    navigateBack() {
        if (this.isLoggedIn) {
            window.location.href = '../Help_center_logged_in.html';
        } else {
            window.location.href = '../Help_center.html';
        }
    }

    // Update all back navigation links dynamically
    updateBackNavigationLinks() {
        const backLinks = document.querySelectorAll('a[href*="Help_center"]');
        const targetUrl = this.isLoggedIn ? '../Help_center_logged_in.html' : '../Help_center.html';
        
        backLinks.forEach(link => {
            if (link.href.includes('Help_center.html') || link.href.includes('Help_center_logged_in.html')) {
                link.href = targetUrl;
            }
        });
    }

    // Get current user data
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is logged in
    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}

// Create global instance
window.helpCenterAuth = new HelpCenterAuth();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.helpCenterAuth.init();
});

// Global navigation function for backward compatibility
window.navigateToHelpCenter = function() {
    window.helpCenterAuth.navigateBack();
};