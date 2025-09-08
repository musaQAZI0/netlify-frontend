// Utility function to redirect to login with return URL
function redirectToLogin(currentPage = null) {
    // Get current page name if not provided
    if (!currentPage) {
        currentPage = window.location.pathname.split('/').pop() || 'index.html';
    }
    
    // Store the current page in sessionStorage as backup
    sessionStorage.setItem('loginReferrer', currentPage);
    
    // Redirect to login with returnTo parameter
    const returnUrl = encodeURIComponent(currentPage);
    window.location.href = `login.html?returnTo=${returnUrl}`;
}

// Function to be called when user needs to login to access content
function requireLogin(message = "Please log in to access this content") {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    alert(message);
    redirectToLogin(currentPage);
}

// Function to check if user is logged in
function isLoggedIn() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    return !!(token && user);
}

// Function to redirect to appropriate logged-in version of current page
function redirectToLoggedInVersion() {
    const pageMapping = {
        'Help_center.html': 'Help_center_logged_in.html',
        'index.html': 'logged_in_Version.html',
        'Music events.html': 'Music Events_logged_in.html',
        'Holiday events.html': 'Holiday events_logged_in.html',
        'Hobbies events.html': 'Hobbies events_logged_in.html',
        'DATING.html': 'DATING.html',  // No logged-in version yet
        'NIGHTLIFE.html': 'NIGHTLIFE.html',  // No logged-in version yet
        'Performing & Visual Arts events.html': 'Performing & Visual Arts events.html',  // No logged-in version yet
    };
    
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const loggedInVersion = pageMapping[currentPage] || 'logged_in_Version.html';
    
    if (currentPage !== loggedInVersion) {
        window.location.href = loggedInVersion;
    }
}

// Make functions globally available
window.redirectToLogin = redirectToLogin;
window.requireLogin = requireLogin;
window.isLoggedIn = isLoggedIn;
window.redirectToLoggedInVersion = redirectToLoggedInVersion;