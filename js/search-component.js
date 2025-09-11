/**
 * Enhanced Search Component
 * Handles search functionality with location selection and suggestions
 */

class SearchComponent {
    constructor(container) {
        this.container = container;
        this.searchInput = null;
        this.locationSection = null;
        this.locationDropdown = null;
        this.searchSuggestions = null;
        this.selectedLocation = 'Choose a location';
        this.isLocationDropdownOpen = false;
        this.isSearchSuggestionsOpen = false;
        this.debounceTimeout = null;

        this.locations = [
            { id: 'current', name: 'Use current location', icon: 'target' },
            { id: 'online', name: 'Online events', icon: 'globe' },
            { id: 'new-york', name: 'New York, NY', icon: 'map-pin' },
            { id: 'los-angeles', name: 'Los Angeles, CA', icon: 'map-pin' },
            { id: 'chicago', name: 'Chicago, IL', icon: 'map-pin' },
            { id: 'san-francisco', name: 'San Francisco, CA', icon: 'map-pin' },
            { id: 'miami', name: 'Miami, FL', icon: 'map-pin' },
            { id: 'seattle', name: 'Seattle, WA', icon: 'map-pin' },
            { id: 'boston', name: 'Boston, MA', icon: 'map-pin' },
            { id: 'austin', name: 'Austin, TX', icon: 'map-pin' },
            { id: 'denver', name: 'Denver, CO', icon: 'map-pin' },
            { id: 'atlanta', name: 'Atlanta, GA', icon: 'map-pin' }
        ];

        this.eventSuggestions = [
            { title: 'Music concerts', meta: 'Popular in your area', type: 'category' },
            { title: 'Tech meetups', meta: 'Trending this week', type: 'category' },
            { title: 'Food festivals', meta: 'Weekend events', type: 'category' },
            { title: 'Art exhibitions', meta: 'Cultural events', type: 'category' },
            { title: 'Fitness classes', meta: 'Health & wellness', type: 'category' },
            { title: 'Networking events', meta: 'Professional development', type: 'category' }
        ];

        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
        this.setupGeolocation();
    }

    render() {
        const searchHTML = `
            <div class="search-container">
                <!-- Search Input Section -->
                <div class="search-input-section">
                    <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" class="search-input" placeholder="Search events" autocomplete="off">
                    
                    <!-- Search Suggestions -->
                    <div class="search-suggestions">
                        ${this.eventSuggestions.map(suggestion => `
                            <div class="search-suggestion" data-query="${suggestion.title}">
                                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <path d="m21 21-4.35-4.35"></path>
                                </svg>
                                <div class="suggestion-content">
                                    <div class="suggestion-title">${suggestion.title}</div>
                                    <div class="suggestion-meta">${suggestion.meta}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Location Section -->
                <div class="location-section" tabindex="0" role="button" aria-expanded="false" aria-haspopup="listbox">
                    <svg class="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span class="location-text">${this.selectedLocation}</span>
                    <svg class="location-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                    
                    <!-- Location Dropdown -->
                    <div class="location-dropdown" role="listbox">
                        ${this.locations.map(location => `
                            <div class="location-option" data-location-id="${location.id}" role="option">
                                <svg class="location-option-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${this.getLocationIcon(location.icon)}
                                </svg>
                                ${location.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Search Button -->
                <button class="search-btn" type="button" aria-label="Search">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                </button>
            </div>
        `;

        this.container.innerHTML = searchHTML;

        // Cache DOM elements
        this.searchInput = this.container.querySelector('.search-input');
        this.locationSection = this.container.querySelector('.location-section');
        this.locationText = this.container.querySelector('.location-text');
        this.locationDropdown = this.container.querySelector('.location-dropdown');
        this.searchSuggestions = this.container.querySelector('.search-suggestions');
        this.searchBtn = this.container.querySelector('.search-btn');
        this.searchContainer = this.container.querySelector('.search-container');
    }

    getLocationIcon(iconType) {
        const icons = {
            'target': '<circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>',
            'globe': '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12,2 a10,10 0 0,1 0,20 a10,10 0 0,1 0,-20"></path>',
            'map-pin': '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>'
        };
        return icons[iconType] || icons['map-pin'];
    }

    attachEventListeners() {
        // Search input events
        this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
        this.searchInput.addEventListener('focus', () => this.showSearchSuggestions());
        this.searchInput.addEventListener('blur', (e) => {
            // Delay hiding to allow clicks on suggestions
            setTimeout(() => this.hideSearchSuggestions(), 150);
        });

        // Location section events
        this.locationSection.addEventListener('click', () => this.toggleLocationDropdown());
        this.locationSection.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.toggleLocationDropdown();
            }
        });

        // Location dropdown events
        this.locationDropdown.addEventListener('click', (e) => {
            const option = e.target.closest('.location-option');
            if (option) {
                this.selectLocation(option.dataset.locationId);
            }
        });

        // Search suggestions events
        this.searchSuggestions.addEventListener('click', (e) => {
            const suggestion = e.target.closest('.search-suggestion');
            if (suggestion) {
                this.selectSuggestion(suggestion.dataset.query);
            }
        });

        // Search button event
        this.searchBtn.addEventListener('click', () => this.performSearch());

        // Enter key search
        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch();
            }
        });

        // Click outside to close dropdowns
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.hideLocationDropdown();
                this.hideSearchSuggestions();
            }
        });
    }

    handleSearchInput(e) {
        const query = e.target.value.trim();

        // Clear existing timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }

        // Debounce search suggestions
        this.debounceTimeout = setTimeout(() => {
            if (query.length > 0) {
                this.updateSearchSuggestions(query);
                this.showSearchSuggestions();
            } else {
                this.resetSearchSuggestions();
            }
        }, 300);
    }

    updateSearchSuggestions(query) {
        // Filter suggestions based on query
        const filteredSuggestions = this.eventSuggestions.filter(suggestion =>
            suggestion.title.toLowerCase().includes(query.toLowerCase())
        );

        // Add query-specific suggestions
        const querySuggestions = [
            { title: `"${query}" events`, meta: 'Search for this term', type: 'query' },
            { title: `${query} near me`, meta: 'Local search', type: 'query' }
        ];

        const allSuggestions = [...querySuggestions, ...filteredSuggestions];

        this.searchSuggestions.innerHTML = allSuggestions.map(suggestion => `
            <div class="search-suggestion" data-query="${suggestion.title}">
                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-meta">${suggestion.meta}</div>
                </div>
            </div>
        `).join('');
    }

    resetSearchSuggestions() {
        this.searchSuggestions.innerHTML = this.eventSuggestions.map(suggestion => `
            <div class="search-suggestion" data-query="${suggestion.title}">
                <svg class="suggestion-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                </svg>
                <div class="suggestion-content">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-meta">${suggestion.meta}</div>
                </div>
            </div>
        `).join('');
    }

    toggleLocationDropdown() {
        if (this.isLocationDropdownOpen) {
            this.hideLocationDropdown();
        } else {
            this.showLocationDropdown();
        }
    }

    showLocationDropdown() {
        this.locationDropdown.classList.add('show');
        this.locationSection.setAttribute('aria-expanded', 'true');
        this.isLocationDropdownOpen = true;
        this.hideSearchSuggestions();
    }

    hideLocationDropdown() {
        this.locationDropdown.classList.remove('show');
        this.locationSection.setAttribute('aria-expanded', 'false');
        this.isLocationDropdownOpen = false;
    }

    showSearchSuggestions() {
        this.searchSuggestions.classList.add('show');
        this.isSearchSuggestionsOpen = true;
        this.hideLocationDropdown();
    }

    hideSearchSuggestions() {
        this.searchSuggestions.classList.remove('show');
        this.isSearchSuggestionsOpen = false;
    }

    selectLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
            this.selectedLocation = location.name;
            this.locationText.textContent = location.name;
            this.hideLocationDropdown();

            // Handle current location
            if (locationId === 'current') {
                this.requestCurrentLocation();
            }
        }
    }

    selectSuggestion(query) {
        this.searchInput.value = query;
        this.hideSearchSuggestions();
        this.performSearch();
    }

    performSearch() {
        const query = this.searchInput.value.trim();
        const location = this.selectedLocation;

        if (!query) {
            this.searchInput.focus();
            return;
        }

        // Add loading state
        this.searchContainer.classList.add('loading');
        this.searchBtn.disabled = true;

        // Simulate search (replace with actual search logic)
        setTimeout(() => {
            this.searchContainer.classList.remove('loading');
            this.searchBtn.disabled = false;

            // Fire custom event for search
            const searchEvent = new CustomEvent('searchPerformed', {
                detail: {
                    query: query,
                    location: location,
                    locationId: this.getLocationId(location)
                }
            });
            this.container.dispatchEvent(searchEvent);

            console.log('Search performed:', { query, location });
        }, 1000);
    }

    getLocationId(locationName) {
        const location = this.locations.find(loc => loc.name === locationName);
        return location ? location.id : null;
    }

    setupGeolocation() {
        // Check if geolocation is available
        if ('geolocation' in navigator) {
            // Pre-populate with current location if available
            this.getCurrentLocationName();
        }
    }

    requestCurrentLocation() {
        if ('geolocation' in navigator) {
            this.locationText.textContent = 'Getting location...';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.reverseGeocode(position.coords.latitude, position.coords.longitude);
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    this.locationText.textContent = 'Unable to get location';
                    setTimeout(() => {
                        this.locationText.textContent = 'Choose a location';
                        this.selectedLocation = 'Choose a location';
                    }, 2000);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        }
    }

    getCurrentLocationName() {
        // This would typically use a geolocation service
        // For demo purposes, we'll simulate it
        if ('geolocation' in navigator) {
            try {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        // In a real app, you'd reverse geocode these coordinates
                        console.log('Current position:', position.coords);
                        // Optionally update the location input with user's location
                        this.updateLocationWithCoordinates(position.coords);
                    },
                    (error) => {
                        // Handle different types of geolocation errors gracefully
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                console.log('User denied the request for Geolocation');
                                break;
                            case error.POSITION_UNAVAILABLE:
                                console.log('Location information is unavailable');
                                break;
                            case error.TIMEOUT:
                                console.log('The request to get user location timed out');
                                break;
                            default:
                                console.log('An unknown error occurred while retrieving location');
                                break;
                        }
                        // Don't show error to user, just use default behavior
                    },
                    { 
                        timeout: 5000,
                        enableHighAccuracy: false,
                        maximumAge: 300000 // 5 minutes
                    }
                );
            } catch (error) {
                console.log('Geolocation API error:', error);
            }
        } else {
            console.log('Geolocation is not supported by this browser');
        }
    }

    updateLocationWithCoordinates(coords) {
        // In a real app, you'd reverse geocode these coordinates to get a city name
        // For now, we'll use a generic "Current Location" text
        const locationInputs = document.querySelectorAll('.location-input');
        locationInputs.forEach(input => {
            if (input) {
                input.placeholder = 'Current Location';
            }
        });
    }

    reverseGeocode(lat, lng) {
        // In a real application, you'd use a geocoding service like Google Maps API
        // For demo purposes, we'll simulate a city name
        const simulatedCity = 'Current Location';
        this.selectedLocation = simulatedCity;
        this.locationText.textContent = simulatedCity;
    }

    // Public methods for external control
    setQuery(query) {
        this.searchInput.value = query;
    }

    setLocation(locationId) {
        this.selectLocation(locationId);
    }

    focus() {
        this.searchInput.focus();
    }

    clear() {
        this.searchInput.value = '';
        this.selectedLocation = 'Choose a location';
        this.locationText.textContent = 'Choose a location';
    }
}

// Auto-initialize search components
document.addEventListener('DOMContentLoaded', function () {
    // Only auto-render the enhanced search component when explicitly allowed.
    // Set `window.AUTO_RENDER_SEARCH_COMPONENT = false` to keep manual markup.
    if (window.AUTO_RENDER_SEARCH_COMPONENT === false) return;

    const searchContainers = document.querySelectorAll('[data-search-component]');
    searchContainers.forEach(container => {
        new SearchComponent(container);
    });
});

// Global search component factory
window.SearchComponent = SearchComponent;