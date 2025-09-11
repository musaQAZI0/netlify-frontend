// Authentication state
let isLoggedIn = false;
let currentAuthMode = 'login';

// Location and real-time data state
let userLocation = {
    city: 'Punjab',
    country: 'Pakistan',
    coordinates: { lat: 31.5804, lng: 74.3587 },
    timezone: 'Asia/Karachi'
};
let realTimeEvents = [];
let locationUpdateInterval;

// Sample real-time event data (in production, this would come from your API)
const eventDatabase = {
    'Punjab': [
        {
            id: 1,
            title: 'Lahore Music Festival 2025',
            date: 'Today • 7:00 PM PKT',
            price: 'From PKR 2,500',
            organizer: 'Lahore Arts Council',
            followers: '5.2k',
            category: 'Music',
            image: 'music-festival',
            promoted: true,
            coordinates: { lat: 31.5804, lng: 74.3587 }
        },
        {
            id: 2,
            title: 'Tech Meetup Lahore - AI & Innovation',
            date: 'Tomorrow • 6:30 PM PKT',
            price: 'Free',
            organizer: 'Tech Community LHR',
            followers: '3.1k',
            category: 'Business',
            image: 'tech-meetup',
            coordinates: { lat: 31.5924, lng: 74.3135 }
        },
        {
            id: 3,
            title: 'Food Street Night Market',
            date: 'This Weekend • 8:00 PM PKT',
            price: 'Free Entry',
            organizer: 'Gawalmandi Food Street',
            followers: '12.5k',
            category: 'Food & Drink',
            image: 'food-market',
            coordinates: { lat: 31.5925, lng: 74.3143 }
        }
    ],
    'Sindh': [
        {
            id: 4,
            title: 'Karachi Literature Festival',
            date: 'Next Week • 10:00 AM PKT',
            price: 'From PKR 1,500',
            organizer: 'Oxford University Press',
            followers: '8.7k',
            category: 'Education',
            image: 'literature-fest',
            coordinates: { lat: 24.8607, lng: 67.0011 }
        },
        {
            id: 5,
            title: 'Beach Cleanup & Environmental Awareness',
            date: 'Sunday • 7:00 AM PKT',
            price: 'Free',
            organizer: 'Green Karachi Initiative',
            followers: '2.8k',
            category: 'Charity & Causes',
            image: 'beach-cleanup',
            coordinates: { lat: 24.8138, lng: 67.0280 }
        }
    ],
    'Khyber Pakhtunkhwa': [
        {
            id: 6,
            title: 'Peshawar Cultural Night',
            date: 'Friday • 8:00 PM PKT',
            price: 'PKR 800',
            organizer: 'Peshawar Arts Society',
            followers: '4.2k',
            category: 'Performing & Visual Arts',
            image: 'cultural-night',
            coordinates: { lat: 34.0151, lng: 71.5249 }
        }
    ],
    'Federal Capital Territory': [
        {
            id: 7,
            title: 'Islamabad Startup Pitch Competition',
            date: 'Next Monday • 2:00 PM PKT',
            price: 'Free Registration',
            organizer: 'Innovation Hub ISB',
            followers: '6.3k',
            category: 'Business',
            image: 'startup-pitch',
            coordinates: { lat: 33.6844, lng: 73.0479 }
        },
        {
            id: 8,
            title: 'Margalla Hills Photography Walk',
            date: 'Saturday • 6:00 AM PKT',
            price: 'PKR 500',
            organizer: 'Islamabad Photography Club',
            followers: '1.9k',
            category: 'Hobbies',
            image: 'photo-walk',
            coordinates: { lat: 33.7463, lng: 73.1169 }
        }
    ]
};

// Initialize page
document.addEventListener('DOMContentLoaded', function () {
    // Initialize location services
    initializeLocation();

    // Check if user was previously logged in
    const savedLogin = localStorage.getItem('crowdLoggedIn');
    if (savedLogin === 'true') {
        const savedEmail = localStorage.getItem('crowdUserEmail');
        if (savedEmail) {
            loginUser(savedEmail);
        }
    }

    initializeEventListeners();
    startRealTimeUpdates();
});

// Location Services
function initializeLocation() {
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            handleLocationSuccess,
            handleLocationError,
            { timeout: 10000, enableHighAccuracy: true }
        );
    } else {
        console.log('Geolocation not supported');
        loadEventsForLocation(userLocation.city);
    }
}

function handleLocationSuccess(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    // Update user coordinates
    userLocation.coordinates = { lat, lng };

    // Reverse geocode to get city/region
    reverseGeocode(lat, lng);
}

function handleLocationError(error) {
    console.log('Location access denied or failed:', error.message);
    // Fall back to default location
    loadEventsForLocation(userLocation.city);
    showLocationNotification('Using default location. Allow location access for personalized events.');
}

async function reverseGeocode(lat, lng) {
    try {
        // Using a free geocoding service (in production, use Google Maps API or similar)
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        const data = await response.json();

        if (data.city || data.locality) {
            const detectedCity = data.city || data.locality;
            const detectedCountry = data.countryName;

            // Map detected location to our regions
            const mappedRegion = mapToRegion(detectedCity, detectedCountry);

            if (mappedRegion !== userLocation.city) {
                userLocation.city = mappedRegion;
                userLocation.country = detectedCountry;

                // Update UI
                updateLocationUI(mappedRegion);
                loadEventsForLocation(mappedRegion);

                showLocationNotification(`📍 Found events near ${detectedCity}, ${detectedCountry}`);
            }
        }
    } catch (error) {
        console.error('Geocoding failed:', error);
        loadEventsForLocation(userLocation.city);
    }
}

function mapToRegion(city, country) {
    // Map real cities to our available regions
    const cityMap = {
        'Lahore': 'Punjab',
        'Karachi': 'Sindh',
        'Islamabad': 'Federal Capital Territory',
        'Peshawar': 'Khyber Pakhtunkhwa',
        'Rawalpindi': 'Punjab',
        'Faisalabad': 'Punjab',
        'Multan': 'Punjab',
        'Hyderabad': 'Sindh',
        'Quetta': 'Balochistan'
    };

    return cityMap[city] || 'Punjab'; // Default fallback
}

function updateLocationUI(region) {
    // Update location dropdown
    const locationDropdown = document.querySelector('.location-dropdown');
    locationDropdown.value = region;

    // Update location input
    const locationInput = document.querySelector('.location-input');
    locationInput.value = region;

    // Update section title
    const sectionTitle = document.querySelector('.section-title');
    if (sectionTitle.textContent.includes('Events in')) {
        sectionTitle.textContent = `Events in ${region}`;
    }
}

function showLocationNotification(message) {
    // Create and show location notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #4ade80;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 1001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// Real-time event loading
function loadEventsForLocation(location) {
    const events = eventDatabase[location] || [];
    realTimeEvents = events;

    // Add some randomization for "real-time" feel
    const shuffledEvents = [...events].sort(() => Math.random() - 0.5);

    displayEvents(shuffledEvents);
    updateEventStats(location, events.length);
}

function displayEvents(events) {
    const eventsGrid = document.querySelector('.events-grid');

    // Clear existing events
    eventsGrid.innerHTML = '';

    events.forEach(event => {
        const eventCard = createEventCard(event);
        eventsGrid.appendChild(eventCard);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-event-id', event.id);

    const imageClass = `event-image-${event.image}`;
    const promotedBadge = event.promoted ? '<div class="promoted-badge">Promoted</div>' : '';

    card.innerHTML = `
        <div class="event-image ${imageClass}">
            ${promotedBadge}
            ${event.title}
        </div>
        <div class="event-content">
            <div class="event-title">${event.title}</div>
            <div class="event-details">${event.date}</div>
            <div class="event-price">${event.price}</div>
            <div class="event-organizer">
                <span>${event.organizer}</span>
                <span>• ${event.followers} followers</span>
            </div>
        </div>
    `;

    // Add click handler
    card.addEventListener('click', () => {
        showEventDetails(event);
    });

    return card;
}

function showEventDetails(event) {
    // Calculate distance from user location
    const distance = calculateDistance(
        userLocation.coordinates.lat,
        userLocation.coordinates.lng,
        event.coordinates.lat,
        event.coordinates.lng
    );

    alert(`Event: ${event.title}\n` +
        `Organizer: ${event.organizer}\n` +
        `Date: ${event.date}\n` +
        `Price: ${event.price}\n` +
        `Distance: ${distance.toFixed(1)} km away`);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function updateEventStats(location, eventCount) {
    console.log(`📊 Real-time stats: ${eventCount} events found in ${location}`);

    // Update browsing text
    const locationSelector = document.querySelector('.location-selector span');
    if (locationSelector) {
        locationSelector.textContent = `📍 Browsing ${eventCount} live events in`;
    }
}

// Start real-time updates
function startRealTimeUpdates() {
    // Simulate real-time updates every 30 seconds
    locationUpdateInterval = setInterval(() => {
        simulateRealTimeChanges();
    }, 30000);
}

function simulateRealTimeChanges() {
    // Add some dynamic behavior to simulate real-time updates
    const events = realTimeEvents;

    events.forEach(event => {
        // Randomly update follower counts
        const currentFollowers = parseInt(event.followers.replace('k', '')) * 1000;
        const change = Math.floor(Math.random() * 100) - 50; // ±50 followers
        const newFollowers = Math.max(0, currentFollowers + change);

        if (newFollowers >= 1000) {
            event.followers = `${(newFollowers / 1000).toFixed(1)}k`;
        } else {
            event.followers = newFollowers.toString();
        }
    });

    // Refresh display
    displayEvents(events);

    console.log('🔄 Real-time data updated');
}

function initializeEventListeners() {
    // Filter tabs functionality with real-time filtering
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function (e) {
            e.preventDefault();
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');

            // Real-time filter events by category
            const category = this.textContent.trim();
            filterEventsByCategory(category);
        });
    });

    // Interest tags functionality
    const interestTags = document.querySelectorAll('.interest-tag');
    interestTags.forEach(tag => {
        tag.addEventListener('click', function () {
            this.style.background = this.style.background === 'rgb(255, 87, 34)' ? 'white' : '#ff5722';
            this.style.color = this.style.color === 'white' ? '#39364f' : 'white';
        });
    });

    // Search functionality
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');

    searchBtn.addEventListener('click', function () {
        const query = searchInput.value;
        if (query) {
            console.log('Searching for:', query);
            // Here you would implement actual search functionality
        }
    });

    // Category item interactions
    const categoryItems = document.querySelectorAll('.category-item');
    categoryItems.forEach(item => {
        item.addEventListener('click', function () {
            const categoryName = this.querySelector('.category-name').textContent;
            console.log('Category selected:', categoryName);

            // Highlight selected category
            categoryItems.forEach(cat => cat.classList.remove('selected'));
            this.classList.add('selected');

            // Filter events by category
            filterEventsByCategory(categoryName);
        });
    });

    // City card interactions
    const cityCards = document.querySelectorAll('.destination-card');
    cityCards.forEach(card => {
        card.addEventListener('click', function () {
            const cityName = this.querySelector('.city-name').textContent;
            console.log('City selected:', cityName);
        });
    });

    // Location dropdown functionality
    const locationDropdown = document.querySelector('.location-dropdown');
    locationDropdown.addEventListener('change', function () {
        const selectedLocation = this.value;
        console.log('Location changed to:', selectedLocation);
        userLocation.city = selectedLocation;
        loadEventsForLocation(selectedLocation);
        updateEventsForLocation(selectedLocation);
    });

    // Hero navigation dots
    const navDots = document.querySelectorAll('.nav-dot');
    navDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            navDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
        });
    });

    // Auth form submission
    const authForm = document.getElementById('authForm');
    authForm.addEventListener('submit', handleAuthSubmit);
}

// Authentication functions
function showAuthModal(mode = 'login') {
    currentAuthMode = mode;
    const modal = document.getElementById('authModal');
    const title = document.getElementById('authTitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('authToggleText');
    const toggleLink = document.getElementById('authToggleLink');

    if (mode === 'login') {
        title.textContent = 'Log in to Crowd';
        submitBtn.textContent = 'Log In';
        toggleText.textContent = "Don't have an account? ";
        toggleLink.textContent = 'Sign up';
    } else {
        title.textContent = 'Sign up for Crowd';
        submitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account? ';
        toggleLink.textContent = 'Log in';
    }

    modal.classList.add('show');
    document.getElementById('emailInput').focus();
}

function hideAuthModal() {
    const modal = document.getElementById('authModal');
    modal.classList.remove('show');

    // Clear form
    document.getElementById('emailInput').value = '';
    document.getElementById('passwordInput').value = '';
}

function toggleAuthMode() {
    currentAuthMode = currentAuthMode === 'login' ? 'signup' : 'login';
    showAuthModal(currentAuthMode);
}

function handleAuthSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Simulate authentication (in real app, this would be an API call)
    if (currentAuthMode === 'signup') {
        // Simulate signup
        console.log('Signing up:', email);
        loginUser(email);
    } else {
        // Simulate login
        console.log('Logging in:', email);
        loginUser(email);
    }

    hideAuthModal();
}

function loginUser(email) {
    isLoggedIn = true;

    // Update UI
    document.querySelector('.nav-logged-out').style.display = 'none';
    document.querySelector('.nav-logged-in').style.display = 'flex';
    document.getElementById('userEmailDisplay').textContent = email;

    // Switch hero sections
    document.getElementById('heroLoggedOut').style.display = 'none';
    document.getElementById('heroLoggedIn').classList.add('show');

    // Save login state (in real app, you'd use proper tokens)
    localStorage.setItem('crowdLoggedIn', 'true');
    localStorage.setItem('crowdUserEmail', email);

    console.log('User logged in:', email);
}

function logout() {
    isLoggedIn = false;

    // Update UI
    document.querySelector('.nav-logged-out').style.display = 'flex';
    document.querySelector('.nav-logged-in').style.display = 'none';

    // Switch hero sections
    document.getElementById('heroLoggedOut').style.display = 'block';
    document.getElementById('heroLoggedIn').classList.remove('show');

    // Clear saved login state
    localStorage.removeItem('crowdLoggedIn');
    localStorage.removeItem('crowdUserEmail');

    console.log('User logged out');
}

// Utility functions
function filterEventsByCategory(category) {
    const filteredEvents = realTimeEvents.filter(event =>
        category === 'All' || event.category === category
    );
    displayEvents(filteredEvents);

    console.log(`Filtered ${filteredEvents.length} events for category: ${category}`);
}

function updateEventsForLocation(location) {
    const sectionTitle = document.querySelector('.section-title');
    sectionTitle.textContent = `Events in ${location}`;

    // Load new events for the selected location
    loadEventsForLocation(location);
}

// Close modal when clicking outside
document.addEventListener('click', function (e) {
    const modal = document.getElementById('authModal');
    if (e.target === modal) {
        hideAuthModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        hideAuthModal();
    }
});

// Search suggestions (demo)
function initializeSearchSuggestions() {
    const searchInput = document.querySelector('.search-input');
    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        if (query.length > 2) {
            // In a real app, you'd show search suggestions
            console.log('Search suggestions for:', query);
        }
    });
}

// Enhanced hover effects for cards
function initializeCardEffects() {
    const eventCards = document.querySelectorAll('.event-card');
    const destinationCards = document.querySelectorAll('.destination-card');

    [...eventCards, ...destinationCards].forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-4px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });
}

// Initialize tooltips for promoted events
function initializeTooltips() {
    const promotedTags = document.querySelectorAll('.promoted-badge');
    promotedTags.forEach(tag => {
        tag.title = 'This is a promoted event';
    });
}

// Smooth scrolling for internal links
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Loading animation for event cards
function initializeLoadingAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '50px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Apply animation to event cards when they're created
    const applyAnimationToCards = () => {
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(card);
        });
    };

    // Initial call and set up for future card additions
    setTimeout(applyAnimationToCards, 100);
}

// Mobile menu functionality
function initializeMobileMenu() {
    if (window.innerWidth <= 768) {
        const navContainer = document.querySelector('.nav-container');
        const mobileMenuBtn = document.createElement('button');
        mobileMenuBtn.innerHTML = '☰';
        mobileMenuBtn.className = 'mobile-menu-btn';
        mobileMenuBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #39364f;
            display: none;
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
        `;

        navContainer.appendChild(mobileMenuBtn);

        // Show/hide mobile menu button based on screen size
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                mobileMenuBtn.style.display = 'block';
            } else {
                mobileMenuBtn.style.display = 'none';
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();
    }
}

// Enhanced button hover effects
function initializeButtonEffects() {
    const buttons = document.querySelectorAll('.hero-btn, .search-btn, .auth-btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });
}

// Real-time event counter
function updateEventCounter() {
    const totalEvents = Object.values(eventDatabase).reduce((total, events) => total + events.length, 0);

    // Update any event counter displays
    const counters = document.querySelectorAll('.event-counter');
    counters.forEach(counter => {
        counter.textContent = `${totalEvents} events`;
    });
}

// Weather integration (demo)
async function getWeatherForLocation(lat, lng) {
    try {
        // This is a demo - in production, use a proper weather API
        const weather = {
            temperature: Math.floor(Math.random() * 15) + 20, // 20-35°C
            condition: ['Sunny', 'Partly Cloudy', 'Cloudy'][Math.floor(Math.random() * 3)]
        };

        console.log(`Weather: ${weather.temperature}°C, ${weather.condition}`);
        return weather;
    } catch (error) {
        console.error('Weather fetch failed:', error);
        return null;
    }
}

// Performance monitoring
function initializePerformanceMonitoring() {
    // Log page load time
    window.addEventListener('load', () => {
        const loadTime = performance.now();
        console.log(`Page loaded in ${loadTime.toFixed(2)}ms`);
    });

    // Monitor scroll performance
    let isScrolling = false;
    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                // Perform scroll-based updates here
                isScrolling = false;
            });
            isScrolling = true;
        }
    });
}

// Error handling
function initializeErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('JavaScript error:', e.error);
        // In production, send error reports to your logging service
    });

    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e.reason);
        // In production, send error reports to your logging service
    });
}

// Initialize additional features after DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all additional features
    initializeSearchSuggestions();
    initializeCardEffects();
    initializeTooltips();
    initializeSmoothScrolling();
    initializeLoadingAnimations();
    initializeMobileMenu();
    initializeButtonEffects();
    initializePerformanceMonitoring();
    initializeErrorHandling();

    // Update event counter
    updateEventCounter();

    // Get weather for current location
    if (userLocation.coordinates) {
        getWeatherForLocation(userLocation.coordinates.lat, userLocation.coordinates.lng);
    }

    console.log('🎉 Crowd event platform initialized successfully!');
});

// Cleanup function for when page is unloaded
window.addEventListener('beforeunload', function () {
    if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
    }
});

// Export functions for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showAuthModal,
        hideAuthModal,
        loginUser,
        logout,
        loadEventsForLocation,
        filterEventsByCategory
    };
}