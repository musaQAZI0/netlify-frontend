// Login functionality
let loginInProgress = false;

// Page mapping for post-login redirects
const pageMapping = {
    'Help_center.html': 'Help_center_logged_in.html',
    'index.html': 'logged_in_Version.html',
    '': 'logged_in_Version.html',  // For root/default page
    'Music events.html': 'Music Events_logged_in.html',
    'Holiday events.html': 'Holiday events_logged_in.html',
    'Hobbies events.html': 'Hobbies events_logged_in.html',
    'DATING.html': 'DATING.html',  // Assuming no logged-in version yet
    'NIGHTLIFE.html': 'NIGHTLIFE.html',  // Assuming no logged-in version yet
    'Performing & Visual Arts events.html': 'Performing & Visual Arts events.html',  // Assuming no logged-in version yet
    'analytics.html': 'analytics.html',  // Analytics page - requires login
    'add-tickets.html': 'add-tickets.html',  // Add tickets page - requires login
    'event-builder.html': 'event-builder.html',  // Event builder - requires login
    'publish-event.html': 'publish-event.html',  // Publish event - requires login
    // Add more mappings as needed
};

// Function to get the intended redirect URL
function getRedirectUrl() {
    console.log('getRedirectUrl called');
    console.log('Current URL:', window.location.href);

    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    console.log('URL parameters:', Object.fromEntries(urlParams));

    const returnTo = urlParams.get('returnTo');
    const redirect = urlParams.get('redirect');

    console.log('returnTo parameter:', returnTo);
    console.log('redirect parameter:', redirect);

    if (returnTo) {
        // Decode the return URL and map it to logged-in version
        const decodedUrl = decodeURIComponent(returnTo);
        const fileName = decodedUrl.split('/').pop() || decodedUrl;
        const mappedUrl = pageMapping[fileName] || pageMapping[''] || 'logged_in_Version.html';
        console.log('Using returnTo parameter, mapped to:', mappedUrl);
        return mappedUrl;
    }

    if (redirect) {
        // Direct redirect - no mapping needed, return as is
        console.log('Found redirect parameter:', redirect);
        return redirect;
    }

    // Highest-priority: explicit post-login redirect stored by pages (cleared after use)
    try {
        const postLogin = sessionStorage.getItem('postLoginRedirect');
        console.log('sessionStorage postLoginRedirect:', postLogin);
        if (postLogin) {
            // clear it so it isn't accidentally reused
            sessionStorage.removeItem('postLoginRedirect');
            return postLogin;
        }
    } catch (err) {
        console.warn('Could not access sessionStorage.postLoginRedirect', err);
    }

    // Check sessionStorage as fallback (legacy flow)
    const referrer = sessionStorage.getItem('loginReferrer');
    console.log('sessionStorage referrer:', referrer);
    if (referrer) {
        const fileName = referrer.split('/').pop() || referrer;
        const mappedUrl = pageMapping[fileName] || pageMapping[''] || 'logged_in_Version.html';
        console.log('Using sessionStorage referrer, mapped to:', mappedUrl);
        return mappedUrl;
    }

    // Default fallback
    console.log('Using default fallback: logged_in_Version.html');
    return 'logged_in_Version.html';
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();

    if (loginInProgress) return false;

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    // Validate inputs
    if (!email || !password) {
        showError('Please fill in all fields');
        return false;
    }

    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return false;
    }

    loginInProgress = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';

    clearMessages();

    try {
        console.log('Starting login process...');
        console.log('Email:', email);
        console.log('window.mongoAuthAPI exists:', typeof window.mongoAuthAPI);
        console.log('window.authAPI exists:', typeof window.authAPI);

        // Use our MongoDB authAPI for login
        const authAPI = window.mongoAuthAPI || window.authAPI;

        if (!authAPI) {
            console.error('No auth API available!');
            showError('Authentication system not available. Please refresh the page.');
            return false;
        }

        console.log('Using auth API:', authAPI.constructor.name || 'Unknown');
        console.log('Calling authAPI.login...');

        const result = await authAPI.login(email, password);

        console.log('Login result:', result);

        if (result && result.success) {
            console.log('Login successful, user:', result.user);
            showSuccess('Login successful! Redirecting...');
            showTopNotification(`Welcome back, ${result.user.name}!`, 'success');

            const redirectUrl = getRedirectUrl();
            console.log('Login successful! Redirect URL determined:', redirectUrl);
            console.log(`Redirecting to ${redirectUrl} in 1.5 seconds...`);
            setTimeout(() => {
                console.log('Executing redirect now to:', redirectUrl);
                window.location.href = redirectUrl;
            }, 1500);
        } else {
            console.log('Login failed, result:', result);
            showError('Login failed. Please check your credentials.');
        }

    } catch (error) {
        console.error('Login error details:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        showError(error.message || 'Invalid email or password');

        // Fallback: Try demo login if API fails
        console.log('Attempting fallback demo login...');
        handleDemoLogin(email, password);
    } finally {
        loginInProgress = false;
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }

    return false;
}

// Attempt API login
async function attemptApiLogin(email, password) {
    try {
        const response = await fetch('https://crowd-backend-zxxp.onrender.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            const data = await response.json();

            // Store authentication data
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));

            showTopNotification('Welcome back! Login successful.', 'success');
            return true;
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }
    } catch (error) {
        console.log('API login failed, using demo mode:', error.message);
        return false;
    }
}

// Demo login for testing when API is not available
function handleDemoLogin(email, password) {
    // Demo credentials
    const demoCredentials = [
        { email: 'admin@crowd.com', password: 'admin123', name: 'Admin User', role: 'admin' },
        { email: 'user@crowd.com', password: 'user123', name: 'Demo User', role: 'user' },
        { email: 'organizer@crowd.com', password: 'organizer123', name: 'Event Organizer', role: 'organizer' },
        { email: 'demo@example.com', password: 'demo123', name: 'Demo User', role: 'user' }
    ];

    const user = demoCredentials.find(cred => cred.email === email && cred.password === password);

    if (user) {
        // Create demo token and user data
        const demoToken = 'demo_token_' + Date.now();
        const userData = {
            id: Date.now(),
            email: user.email,
            name: user.name,
            role: user.role,
            isDemo: true
        };

        // Store authentication data
        localStorage.setItem('authToken', demoToken);
        localStorage.setItem('currentUser', JSON.stringify(userData));

        showSuccess('Login successful! Redirecting...');
        showTopNotification(`Welcome back, ${user.name}!`, 'success');

        const redirectUrl = getRedirectUrl();
        console.log('Demo login successful! Redirect URL determined:', redirectUrl);
        setTimeout(() => {
            console.log('Demo login - executing redirect now to:', redirectUrl);
            window.location.href = redirectUrl;
        }, 1500);
    } else {
        showError('Invalid email or password. Try: admin@crowd.com / admin123');
    }
}

// Social login handlers
function socialLogin(provider) {
    console.log('socialLogin called with provider:', provider);

    try {
        if (provider === 'google') {
            console.log('Redirecting to Google OAuth...');
            // Use the config-based API URL for proper environment detection
            const url = `${window.Config ? window.Config.API_BASE_URL : 'http://localhost:3002/api'}/auth/google`;
            console.log('Target URL:', url);

            // Try multiple redirect methods
            if (window.location.href) {
                console.log('Using window.location.href');
                window.location.href = url;
            } else if (window.location.assign) {
                console.log('Using window.location.assign');
                window.location.assign(url);
            } else {
                console.log('Using window.location.replace');
                window.location.replace(url);
            }
        } else {
            console.log('Non-Google provider:', provider);
            showTopNotification(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login coming soon!`, 'info');
        }
    } catch (error) {
        console.error('Error in socialLogin:', error);
        alert('Error: ' + error.message);
    }
}

// Forgot password handler
function forgotPassword() {
    showTopNotification('Password reset functionality coming soon!', 'info');
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');

    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    if (successElement) {
        successElement.style.display = 'none';
    }

    showTopNotification(message, 'error');
}

function showSuccess(message) {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');

    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }

    if (errorElement) {
        errorElement.style.display = 'none';
    }
}

function clearMessages() {
    const errorElement = document.getElementById('errorMessage');
    const successElement = document.getElementById('successMessage');

    if (errorElement) {
        errorElement.style.display = 'none';
    }

    if (successElement) {
        successElement.style.display = 'none';
    }
}

// Top notification functions
function showTopNotification(message, type = 'info') {
    let notification = document.getElementById('topNotification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'topNotification';
        notification.className = 'top-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span id="notificationMessage"></span>
                <button class="notification-close" id="notificationCloseBtn">×</button>
            </div>
        `;
        document.body.insertBefore(notification, document.body.firstChild);

        // Add event listener for the dynamically created close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideTopNotification);
        }
    }

    const messageEl = document.getElementById('notificationMessage');
    messageEl.textContent = message;

    notification.className = `top-notification ${type}`;
    notification.style.display = 'block';
    document.body.classList.add('notification-shown');

    // Auto-hide after 4 seconds
    setTimeout(() => {
        hideTopNotification();
    }, 4000);
}

function hideTopNotification() {
    const notification = document.getElementById('topNotification');
    if (notification) {
        notification.classList.add('slide-out');
        setTimeout(() => {
            notification.style.display = 'none';
            notification.classList.remove('slide-out');
            document.body.classList.remove('notification-shown');
        }, 400);
    }
}

// Check if user is already logged in when the page loads
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');

    // Debug: Verify functions are available
    console.log('Page loaded - Function checks:');
    console.log('socialLogin function:', typeof socialLogin);
    console.log('window.socialLogin:', typeof window.socialLogin);

    // Make sure socialLogin is globally available
    if (typeof window.socialLogin === 'undefined') {
        window.socialLogin = socialLogin;
        console.log('socialLogin attached to window');
    }

    // Add event listener for login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add event listeners for social buttons
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const provider = this.getAttribute('data-provider');
            console.log('Social button clicked:', provider);
            socialLogin(provider);
        });
    });

    // Add event listener for forgot password
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            forgotPassword();
        });
    }

    // Add event listener for existing notification close button
    const existingCloseBtn = document.getElementById('notificationCloseBtn');
    if (existingCloseBtn) {
        existingCloseBtn.addEventListener('click', hideTopNotification);
    }

    if (token && user) {
        // User is already logged in, redirect to logged in version
        showTopNotification('You are already logged in! Redirecting...', 'info');
        const redirectUrl = getRedirectUrl();
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);
    }
});