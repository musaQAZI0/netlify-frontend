// API Integration for Crowd Platform
// Shows only events created by registered organizers

// Global error handler for unhandled promise rejections (helps with browser extension errors)
window.addEventListener('unhandledrejection', function(event) {
    // Check if it's a browser extension related error
    if (event.reason && event.reason.message && 
        (event.reason.message.includes('message channel') || 
         event.reason.message.includes('Extension context invalidated'))) {
        // Suppress browser extension errors as they don't affect app functionality
        console.debug('Browser extension error suppressed:', event.reason.message);
        event.preventDefault();
        return;
    }
    
    // Log other unhandled rejections for debugging
    console.warn('Unhandled promise rejection:', event.reason);
});

// Global error handler for general errors
window.addEventListener('error', function(event) {
    // Check if it's a browser extension related error
    if (event.message && 
        (event.message.includes('message channel') || 
         event.message.includes('Extension context invalidated') ||
         event.message.includes('chrome-extension'))) {
        // Suppress browser extension errors
        console.debug('Browser extension error suppressed:', event.message);
        return;
    }
    
    // Log other errors for debugging
    console.warn('Global error:', event.error || event.message);
});

class CrowdAPI {
    constructor() {
        // Use configuration from config.js
        this.baseURL = window.Config ? `${window.Config.API_BASE_URL}/api` : 'https://crowd-backend-zxxp.onrender.com/api';
        this.headers = {
            'Content-Type': 'application/json',
        };
        
        console.log('CrowdAPI initialized with baseURL:', this.baseURL);
        console.log('Showing only events created by registered organizers');
    }

    // Generic fetch method with error handling
    async fetchAPI(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers: { ...this.headers, ...options.headers }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error for ${endpoint}:`, error);
            throw error;
        }
    }

    // Get all events created by organizers
    async getEvents(location = 'United States') {
        try {
            console.log('Fetching organizer-created events from backend...');
            const response = await this.fetchAPI('/events');
            
            if (response && response.success && response.events) {
                console.log(`✅ Found ${response.events.length} organizer events`);
                console.log(`   👥 Created by ${response.meta?.organizerCount || 0} organizers`);
                return response.events;
            } else {
                console.warn('No organizer events found');
                return [];
            }
        } catch (error) {
            console.error('Failed to load organizer events:', error);
            return [];
        }
    }

    // Get featured events created by organizers
    async getFeaturedEvents(location = 'United States') {
        try {
            console.log('Fetching featured organizer events...');
            const response = await this.fetchAPI('/events?featured=true');
            
            if (response && response.success && response.events) {
                console.log(`✅ Found ${response.events.length} featured organizer events`);
                return response.events;
            } else {
                console.warn('No featured events found, getting all organizer events...');
                return this.getEvents(location);
            }
        } catch (error) {
            console.error('Failed to load featured events:', error);
            return this.getEvents(location);
        }
    }

    // Get events by category (from Backend)
    async getEventsByCategory(category, location = 'United States') {
        try {
            console.log(`Fetching ${category} events from backend...`);
            const response = await this.fetchAPI(`/events?category=${encodeURIComponent(category)}`);
            
            if (response && response.success && response.events) {
                console.log(`✅ Found ${response.events.length} ${category} events from backend`);
                return response.events;
            } else {
                return this.getEvents(location);
            }
        } catch (error) {
            console.error('Backend category search failed:', error);
            return this.getEvents(location);
        }
    }

    // Search events (from Backend)
    async searchEvents(query, location) {
        try {
            console.log(`Searching backend for: "${query}" in ${location}`);
            const params = new URLSearchParams();
            if (query) params.append('search', query);
            if (location && location !== 'United States') params.append('city', location);
            
            const response = await this.fetchAPI(`/events?${params.toString()}`);
            
            if (response && response.success && response.events) {
                console.log(`✅ Found ${response.events.length} search results from backend`);
                return response.events;
            } else {
                return this.getFallbackEvents();
            }
        } catch (error) {
            console.error('Backend search failed:', error);
            return this.getFallbackEvents();
        }
    }

    // Remove fallback events functionality - only show real organizer events
    // No fallback needed since we only show real events from organizers

    // Get events by filter type (Today, Weekend, Free)
    async getEventsByFilter(filterType, location = 'United States') {
        try {
            let response;
            switch (filterType) {
                case 'today':
                    response = await this.eventbriteAPI.getTodayEvents(location);
                    break;
                case 'weekend':
                    response = await this.eventbriteAPI.getWeekendEvents(location);
                    break;
                case 'free':
                    response = await this.eventbriteAPI.getFreeEvents(location);
                    break;
                default:
                    response = await this.eventbriteAPI.searchEvents('', location);
            }
            const events = this.eventbriteAPI.formatEvents(response);
            console.log(`Found ${events.length} ${filterType} events from Eventbrite`);
            return events;
        } catch (error) {
            console.error(`Eventbrite ${filterType} filter failed:`, error);
            return this.getEvents(location);
        }
    }

    // Get health status
    async getHealth() {
        return this.fetchAPI('/health');
    }
}

// Initialize API instance
const crowdAPI = new CrowdAPI();

// DOM manipulation functions
function createEventCard(event) {
    const eventDate = new Date(event.date || Date.now());
    const dateStr = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    }).toUpperCase();
    const timeStr = eventDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
    });
    
    // Create gradient background if no image
    const backgroundStyle = event.imageUrl 
        ? `background-image: url('${event.imageUrl}'); background-size: cover; background-position: center;`
        : `background: linear-gradient(45deg, #${Math.floor(Math.random()*16777215).toString(16)}, #${Math.floor(Math.random()*16777215).toString(16)});`;
    
    // Handle price display (Eventbrite vs local format)
    let priceDisplay = 'Free';
    if (event.priceDisplay) {
        // Eventbrite formatted price
        priceDisplay = event.priceDisplay;
    } else if (event.price > 0) {
        // Local format
        priceDisplay = `From PKR ${event.price}`;
    }
    
    // Truncate title if too long
    const title = (event.title || 'Event Title').length > 60 
        ? event.title.substring(0, 60) + '...' 
        : event.title || 'Event Title';
    
    return `
        <div class="event-card" role="button" tabindex="0" onclick="openEvent('${event._id || event.id}')">
            <div class="event-image" style="${backgroundStyle}"></div>
            <div class="event-details">
                <div class="event-date">${dateStr} • ${timeStr}</div>
                <h3 class="event-title">${title}</h3>
                <div class="event-location">📍 ${event.venue || event.location || 'Location TBD'}</div>
                <div class="event-price">${priceDisplay}</div>
                <div class="event-organizer">👤 By ${event.organizer || 'Event Organizer'}</div>
            </div>
        </div>
    `;
}

function createCarouselSlide(event, index) {
    return `
        <div class="slide ${index === 0 ? 'active' : ''}" onclick="openEvent('${event._id || event.id}')">
            <div class="slide-image">
                <img src="${event.imageUrl || 'https://via.placeholder.com/1200x400'}" alt="${event.title}">
            </div>
            <div class="slide-content">
                <h2>${event.title}</h2>
                <p>${event.description || 'Discover this amazing event'}</p>
                <div class="slide-meta">
                    <span class="slide-date">${new Date(event.date).toLocaleDateString()}</span>
                    <span class="slide-location">${event.location || 'Location TBD'}</span>
                </div>
            </div>
        </div>
    `;
}

// Load and display events
async function loadFeaturedEvents() {
    try {
        showTopNotification('Loading featured events...', 'info');
        const events = await crowdAPI.getFeaturedEvents();
        
        if (events && events.length > 0) {
            // Update carousel with featured events (first 5)
            const carousel = document.querySelector('.carousel-container');
            if (carousel) {
                carousel.innerHTML = events.slice(0, 5).map((event, index) => createCarouselSlide(event, index)).join('');
                
                // Reinitialize carousel if function exists
                if (typeof showSlides === 'function') {
                    slideIndex = 1;
                    showSlides(slideIndex);
                    startAutoSlide();
                }
            }
            
            hideTopNotification();
        } else {
            showTopNotification('No featured events found', 'warning');
        }
    } catch (error) {
        console.error('Failed to load featured events:', error);
        showTopNotification('Unable to load featured events. Please try again later.', 'error');
    }
}

async function loadAllEvents() {
    try {
        console.log('Loading events from API...');
        const response = await crowdAPI.getEvents();
        
        // Handle different response formats
        let events = response;
        if (response && response.data) {
            events = response.data;
        } else if (response && Array.isArray(response)) {
            events = response;
        }
        
        console.log('Events loaded:', events);
        
        if (events && events.length > 0) {
            // Update events grid
            const eventsContainer = document.getElementById('eventsGrid') || document.querySelector('.events-grid');
            if (eventsContainer) {
                console.log('Updating events grid with', events.length, 'events');
                eventsContainer.innerHTML = events.map(event => createEventCard(event)).join('');
                
                // Re-initialize event card handlers
                initializeEventCards();
            } else {
                console.warn('Events container not found');
            }
            
            // Update event count and title
            const sectionTitle = document.querySelector('.section-title');
            if (sectionTitle && sectionTitle.textContent.includes('Events in')) {
                const location = events[0]?.location || 'Your Area';
                sectionTitle.textContent = `Events in ${location}`;
            }
            
            console.log('Events loaded successfully');
        } else {
            console.warn('No events found');
            showFallbackEvents();
        }
    } catch (error) {
        console.error('Failed to load events:', error);
        showTopNotification('Unable to load live events. Showing sample events.', 'warning');
        showFallbackEvents();
    }
}

// Show sample events when API fails
function showFallbackEvents() {
    const sampleEvents = [
        {
            _id: 'sample-1',
            title: 'Winter Music Festival',
            location: 'Islamabad',
            date: new Date(Date.now() + 86400000), // Tomorrow
            price: 2500,
            category: 'Music'
        },
        {
            _id: 'sample-2',
            title: 'Food & Culture Expo',
            location: 'Lahore',
            date: new Date(Date.now() + 172800000), // Day after tomorrow
            price: 1000,
            category: 'Food'
        },
        {
            _id: 'sample-3',
            title: 'Tech Startup Meetup',
            location: 'Karachi',
            date: new Date(Date.now() + 432000000), // 5 days from now
            price: 0,
            category: 'Business'
        }
    ];
    
    const eventsContainer = document.getElementById('eventsGrid') || document.querySelector('.events-grid');
    if (eventsContainer) {
        eventsContainer.innerHTML = sampleEvents.map(event => createEventCard(event)).join('');
        initializeEventCards();
    }
}

// Search functionality with API integration
async function performSearch(query, location) {
    try {
        showTopNotification('Searching events...', 'info');
        const events = await crowdAPI.searchEvents(query, location);
        
        if (events && events.length > 0) {
            // Redirect to results page with data
            sessionStorage.setItem('searchResults', JSON.stringify(events));
            sessionStorage.setItem('searchQuery', query);
            sessionStorage.setItem('searchLocation', location);
            
            window.location.href = `categories.html?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`;
        } else {
            showTopNotification('No events found for your search', 'warning');
        }
    } catch (error) {
        console.error('Search failed:', error);
        showTopNotification('Search failed. Please try again.', 'error');
    }
}

// Open event details for organizer-created events
function openEvent(eventId) {
    if (eventId) {
        showTopNotification('Opening event details...', 'info');
        // Store event ID and redirect to details page
        sessionStorage.setItem('selectedEventId', eventId);
        window.location.href = `event-preview.html?id=${eventId}`;
    }
}

// Check backend health
async function checkBackendHealth() {
    try {
        const health = await crowdAPI.getHealth();
        console.log('Backend health:', health);
        
        if (health.status === 'OK') {
            showTopNotification('Connected to backend successfully!', 'success');
            return true;
        }
    } catch (error) {
        console.error('Backend health check failed:', error);
        showTopNotification('Backend connection failed. Some features may be limited.', 'warning');
        return false;
    }
}

// Initialize API integration
function initializeAPI() {
    // Check backend health first
    checkBackendHealth();
    
    // Load featured events for carousel
    loadFeaturedEvents();
    
    // Load all events
    loadAllEvents();
    
    // Override search functionality
    const searchBtns = document.querySelectorAll('.search-btn, .mobile-search-btn');
    const searchInputs = document.querySelectorAll('.search-input');
    
    searchBtns.forEach(btn => {
        btn.removeEventListener('click', btn.clickHandler);
        btn.clickHandler = async function(e) {
            e.preventDefault();
            const searchContainer = this.closest('.search-wrapper, .mobile-search');
            const searchInput = searchContainer.querySelector('.search-input');
            const locationInput = searchContainer.querySelector('.location-input');
            
            const query = searchInput ? searchInput.value.trim() : '';
            const location = locationInput ? locationInput.value.trim() : '';
            
            if (query || location) {
                await performSearch(query, location);
            } else {
                showTopNotification('Please enter a search term or location', 'warning');
            }
        };
        btn.addEventListener('click', btn.clickHandler);
    });
    
    searchInputs.forEach(input => {
        input.removeEventListener('keypress', input.keypressHandler);
        input.keypressHandler = async function(e) {
            if (e.key === 'Enter') {
                const searchContainer = this.closest('.search-wrapper, .mobile-search');
                const searchInput = searchContainer.querySelector('.search-input');
                const locationInput = searchContainer.querySelector('.location-input');
                
                const query = searchInput ? searchInput.value.trim() : '';
                const location = locationInput ? locationInput.value.trim() : '';
                
                if (query || location) {
                    await performSearch(query, location);
                } else {
                    showTopNotification('Please enter a search term or location', 'warning');
                }
            }
        };
        input.addEventListener('keypress', input.keypressHandler);
    });
}

// Add notification functions if they don't exist
if (typeof showTopNotification === 'undefined') {
    window.showTopNotification = function(message, type = 'info') {
        console.log(`[${type.toUpperCase()}]`, message);
    };
}

if (typeof hideTopNotification === 'undefined') {
    window.hideTopNotification = function() {
        // No-op if not defined in parent page
    };
}

if (typeof initializeEventCards === 'undefined') {
    window.initializeEventCards = function() {
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.addEventListener('click', function() {
                const eventId = this.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
                if (eventId) {
                    openEvent(eventId);
                }
            });
        });
    };
}

// Export for global use
window.crowdAPI = crowdAPI;
window.loadFeaturedEvents = loadFeaturedEvents;
window.loadAllEvents = loadAllEvents;
window.performSearch = performSearch;
window.openEvent = openEvent;
window.initializeAPI = initializeAPI;