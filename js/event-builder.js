// Event Builder API Integration
class EventBuilderAPI {
    constructor() {
        this.baseURL = window.Config ? window.Config.API_BASE_URL :
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:3000'
                : 'https://crowd-backend-zxxp.onrender.com');
        this.currentEventData = {
            title: '',
            description: '',
            startDate: null,
            endDate: null,
            venue: '',
            city: '',
            state: '',
            country: 'United States',
            price: 0,
            capacity: 100,
            imageUrl: '',
            isOnline: false,
            tags: [],
            status: 'draft',
            goodToKnow: {
                highlights: [],
                faqs: []
            }
        };
        this.eventId = null;
        this.isEditing = false;
        this.TOKEN_KEY = 'authToken';
    }

    // Get authentication token from localStorage (consistent with auth-utils.js)
    getAuthToken() {
        // Get from URL parameters first (for direct links)
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');

        // Use standardized token management
        if (!token) {
            token = localStorage.getItem(this.TOKEN_KEY);
        }

        // Store token consistently if found in URL
        if (token && !localStorage.getItem(this.TOKEN_KEY)) {
            localStorage.setItem(this.TOKEN_KEY, token);
        }

        return token || '';
    }

    // API request helper with consistent authentication
    async apiRequest(endpoint, options = {}) {
        const token = this.getAuthToken();

        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            ...options
        };

        // Only add Content-Type for JSON requests, not for file uploads
        if (!options.body || typeof options.body === 'string') {
            config.headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(`${this.baseURL}/api${endpoint}`, config);

            if (!response.ok) {
                if (response.status === 401) {
                    console.log('Token expired, clearing auth data');
                    localStorage.removeItem(this.TOKEN_KEY);
                    localStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                    return;
                }
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || `HTTP ${response.status}: ${response.statusText}`;
                } catch {
                    errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Upload image to backend
    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await this.apiRequest('/events/upload-image', {
                method: 'POST',
                body: formData
            });

            return response.imageUrl;
        } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
        }
    }

    // Upload video to backend
    async uploadVideo(file) {
        try {
            const formData = new FormData();
            formData.append('video', file);

            const response = await this.apiRequest('/events/upload-video', {
                method: 'POST',
                body: formData
            });

            return {
                videoUrl: response.videoUrl,
                thumbnailUrl: response.thumbnailUrl
            };
        } catch (error) {
            console.error('Video upload failed:', error);
            throw error;
        }
    }

    // Load existing event for editing
    async loadEvent(eventId) {
        try {
            console.log('Loading event:', eventId);
            const data = await this.apiRequest(`/events/${eventId}`);
            
            if (data.success && data.event) {
                this.eventId = eventId;
                this.isEditing = true;
                this.currentEventData = {
                    title: data.event.title || '',
                    description: data.event.description || '',
                    startDate: data.event.startDate ? new Date(data.event.startDate).toISOString().split('T')[0] : null,
                    endDate: data.event.endDate ? new Date(data.event.endDate).toISOString().split('T')[0] : null,
                    venue: data.event.venue || '',
                    city: data.event.city || '',
                    state: data.event.state || '',
                    country: data.event.country || 'United States',
                    price: data.event.price || 0,
                    capacity: data.event.totalCapacity || 100,
                    imageUrl: data.event.primaryImage || data.event.imageUrl || '',
                    isOnline: data.event.isOnline || false,
                    tags: data.event.tags || [],
                    status: data.event.status || 'draft'
                };
                
                return this.currentEventData;
            }
        } catch (error) {
            console.error('Failed to load event:', error);
            throw error;
        }
    }

    // Collect form data from the page
    collectFormData() {
        const formData = {
            // Event title
            title: document.getElementById('eventTitle')?.textContent?.trim() ||
                   document.getElementById('eventTitle')?.value?.trim() || '',

            // Date and time
            startDate: document.getElementById('eventDate')?.value || '',
            startTime: document.getElementById('startTime')?.value || '',
            endTime: document.getElementById('endTime')?.value || '',

            // Location data - prioritize Google Places data if available
            venue: document.getElementById('venueName')?.value?.trim() ||
                   this.currentEventData.venue || '',
            address: document.getElementById('streetAddress')?.value?.trim() ||
                     this.currentEventData.address || '',
            city: document.getElementById('cityName')?.value?.trim() ||
                  this.currentEventData.city || '',
            state: document.getElementById('stateName')?.value?.trim() ||
                   this.currentEventData.state || '',
            country: document.getElementById('countryName')?.value?.trim() ||
                     this.currentEventData.country || 'United States',
            zipCode: document.getElementById('zipCode')?.value?.trim() ||
                     this.currentEventData.zipCode || '',

            // Overview/description
            description: document.getElementById('overviewDescription')?.value?.trim() || '',

            // Status
            status: document.getElementById('eventStatus')?.value || 'draft',

            // Current images and videos
            images: this.currentEventData.images || [],
            videos: this.currentEventData.videos || [],

            // Lineup data
            lineup: this.collectLineupData(),

            // Agenda data
            agenda: this.collectAgendaData(),

            // Good to know data
            goodToKnow: this.collectGoodToKnowData()
        };

        // Combine date and time for proper datetime objects
        if (formData.startDate && formData.startTime) {
            formData.startDateTime = `${formData.startDate}T${formData.startTime}`;
        }

        if (formData.startDate && formData.endTime) {
            formData.endDateTime = `${formData.startDate}T${formData.endTime}`;
        }

        return formData;
    }

    // Collect lineup data
    collectLineupData() {
        const lineupSection = document.getElementById('lineupSection');
        if (!lineupSection || lineupSection.style.display === 'none') {
            return { enabled: false, speakers: [] };
        }

        const lineupItems = lineupSection.querySelectorAll('.lineup-item');
        const speakers = Array.from(lineupItems).map(item => {
            const name = item.querySelector('.lineup-name')?.value?.trim() || '';
            const description = item.querySelector('.lineup-description')?.value?.trim() || '';
            const isHeadliner = item.querySelector('input[type="checkbox"]')?.checked || false;

            if (!name) return null; // Skip empty entries

            return {
                name,
                description,
                isHeadliner,
                image: '', // Will be updated when image upload is implemented
                socialLinks: {}
            };
        }).filter(speaker => speaker !== null);

        return {
            enabled: true,
            title: 'Lineup',
            speakers
        };
    }

    // Collect agenda data
    collectAgendaData() {
        const agendaSection = document.getElementById('agendaSection');
        if (!agendaSection || agendaSection.style.display === 'none') {
            return { enabled: false, schedules: [] };
        }

        const agendaItems = agendaSection.querySelectorAll('.agenda-item');
        const items = Array.from(agendaItems).map(item => {
            const title = item.querySelector('.agenda-title')?.value?.trim() || '';
            const startTime = item.querySelector('.agenda-start-time')?.value || '';
            const endTime = item.querySelector('.agenda-end-time')?.value || '';

            if (!title) return null; // Skip empty entries

            return {
                title,
                startTime,
                endTime,
                description: '',
                host: '',
                order: 0
            };
        }).filter(item => item !== null);

        return {
            enabled: true,
            schedules: [{
                title: 'Agenda',
                date: new Date(),
                items
            }]
        };
    }

    // Collect good to know data
    collectGoodToKnowData() {
        const highlightsContainer = document.getElementById('highlightsContainer');
        const faqContainer = document.getElementById('faqContainer');

        const highlights = [];
        const faqs = [];

        // Collect highlights
        if (highlightsContainer) {
            const highlightItems = highlightsContainer.querySelectorAll('.highlight-item');
            highlightItems.forEach(item => {
                const text = item.textContent?.trim();
                if (text) highlights.push(text);
            });
        }

        // Collect FAQs
        if (faqContainer) {
            const faqItems = faqContainer.querySelectorAll('.faq-item');
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question')?.value?.trim() || '';
                const answer = item.querySelector('.faq-answer')?.value?.trim() || '';
                if (question && answer) {
                    faqs.push({ question, answer });
                }
            });
        }

        return { highlights, faqs };
    }

    // Validate form data
    validateFormData(formData) {
        const errors = [];

        // Required fields validation
        if (!formData.title || formData.title.length < 3) {
            errors.push('Event title must be at least 3 characters long');
        }

        if (!formData.description || formData.description.length < 10) {
            errors.push('Event description must be at least 10 characters long');
        }

        if (!formData.startDate) {
            errors.push('Event date is required');
        }

        if (!formData.startTime) {
            errors.push('Start time is required');
        }

        if (!formData.endTime) {
            errors.push('End time is required');
        }

        // Date validation
        if (formData.startDate) {
            const eventDate = new Date(formData.startDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (eventDate < today) {
                errors.push('Event date cannot be in the past');
            }
        }

        // Time validation
        if (formData.startTime && formData.endTime) {
            const start = formData.startTime.split(':').map(Number);
            const end = formData.endTime.split(':').map(Number);
            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];

            if (endMinutes <= startMinutes) {
                errors.push('End time must be after start time');
            }
        }

        // Location validation - check both form data and Google Places data
        const hasVenue = formData.venue || this.currentEventData?.venue;
        const hasCity = formData.city || this.currentEventData?.city;

        if (!hasVenue && !hasCity) {
            errors.push('Either venue name or city is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Save event (create or update)
    async saveEvent(eventData = null) {
        try {
            // Collect form data if not provided
            const formData = eventData || this.collectFormData();

            // Validate the data
            const validation = this.validateFormData(formData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }

            // Merge current data with new data
            this.currentEventData = { ...this.currentEventData, ...formData };

            // Remove category field completely to avoid validation errors
            const dataToSend = { ...this.currentEventData };
            delete dataToSend.category;

            // Additional cleanup - remove any category-related fields
            delete dataToSend.eventCategory;

            // Remove undefined/null values
            Object.keys(dataToSend).forEach(key => {
                if (dataToSend[key] === undefined || dataToSend[key] === null) {
                    delete dataToSend[key];
                }
            });

            console.log('Saving event (cleaned):', dataToSend);
            console.log('Category removed:', !('category' in dataToSend));
            
            if (this.isEditing && this.eventId) {
                // Update existing event
                const data = await this.apiRequest(`/events/${this.eventId}`, {
                    method: 'PUT',
                    body: JSON.stringify(dataToSend)
                });
                
                if (data.success) {
                    console.log('Event updated successfully');
                    return { success: true, event: data.event, isNew: false };
                }
            } else {
                // Create new event
                const data = await this.apiRequest('/events', {
                    method: 'POST',
                    body: JSON.stringify(dataToSend)
                });
                
                if (data.success) {
                    this.eventId = data.event._id;
                    this.isEditing = true;
                    console.log('Event created successfully:', this.eventId);
                    return { success: true, event: data.event, isNew: true };
                }
            }
        } catch (error) {
            console.error('Failed to save event:', error);
            throw error;
        }
    }

    // Get user's events
    async getUserEvents() {
        try {
            const data = await this.apiRequest('/events/my-events');
            return data.success ? data.events : [];
        } catch (error) {
            console.error('Failed to get user events:', error);
            return [];
        }
    }

    // Upload image
    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const token = await this.getAuthToken();
            const response = await fetch(`${this.baseURL}/events/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: formData
            });

            // Handle token expiration
            if (response.status === 401) {
                console.log('Token expired during image upload, trying to refresh...');
                // Try to refresh token using the MongoDB auth API
                if (window.mongoAuthAPI || window.authAPI) {
                    try {
                        const authAPI = window.mongoAuthAPI || window.authAPI;
                        await authAPI.refreshToken();

                        // Retry with new token
                        const newToken = await this.getAuthToken();
                        const retryResponse = await fetch(`${this.baseURL}/events/upload-image`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${newToken}`
                            },
                            credentials: 'include',
                            body: formData
                        });

                        const retryData = await retryResponse.json();
                        if (retryData.success) {
                            return retryData.imageUrl;
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                    }
                }
                throw new Error('Token expired');
            }

            const data = await response.json();

            if (data.success) {
                return data.imageUrl;
            } else {
                throw new Error(data.message || 'Image upload failed');
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            // For now, convert to base64 as fallback
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }
    }
}

// Initialize the event builder
window.eventBuilderAPI = new EventBuilderAPI();

// Enhanced Event Builder with API Integration
class EventBuilder {
    constructor() {
        this.api = window.eventBuilderAPI;
        this.autoSaveTimeout = null;
        this.init();
    }

    async init() {
        console.log('Initializing Event Builder with API integration');
        
        // Check authentication
        if (!(await this.checkAuthentication())) {
            return;
        }

        // Initialize user interface
        if (window.authUtils) {
            await window.authUtils.initializeUserInterface();
        }

        // Check if we're editing an existing event
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id');
        
        if (eventId) {
            await this.loadExistingEvent(eventId);
        } else {
            this.initializeNewEvent();
        }
        
        this.setupEventHandlers();
        this.setupAutoSave();
        
        console.log('Event Builder initialized successfully');
    }

    async checkAuthentication() {
        try {
            // First check if we have a token in localStorage
            const token = localStorage.getItem('authToken');
            const currentUser = localStorage.getItem('currentUser');

            console.log('Auth check:', {
                hasToken: !!token,
                hasUser: !!currentUser,
                tokenLength: token ? token.length : 0
            });

            // If we have both token and user data, consider authenticated
            if (token && currentUser) {
                try {
                    JSON.parse(currentUser); // Validate user data
                    console.log('User authenticated with cached data');
                    return true;
                } catch (e) {
                    console.error('Invalid user data in localStorage');
                    localStorage.removeItem('currentUser');
                }
            }

            // If no token, definitely not authenticated
            if (!token) {
                console.log('No auth token found, redirecting to login');
                window.location.href = 'login.html';
                return false;
            }

            // Try to verify token with API only if we have a token but no user data
            try {
                const response = await fetch(`${this.baseURL}/api/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        console.log('Token verified successfully');
                        return true;
                    }
                }

                // If verification fails, try to get user profile instead
                console.log('Token verification failed, trying profile endpoint');
                const profileResponse = await fetch(`${this.baseURL}/api/auth/profile`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (profileResponse.ok) {
                    const profileData = await profileResponse.json();
                    if (profileData.success && profileData.user) {
                        console.log('Profile fetched successfully, user is authenticated');
                        localStorage.setItem('currentUser', JSON.stringify(profileData.user));
                        return true;
                    }
                }
            } catch (apiError) {
                console.error('API authentication check failed:', apiError);
                // Don't redirect on API errors, assume user is authenticated if they have a token
                if (token) {
                    console.log('API unavailable but token exists, assuming authenticated');
                    return true;
                }
            }

            // If API verification fails but we have a token, try to use it anyway
            if (token) {
                console.log('API verification failed but token exists, assuming authenticated');
                return true;
            }

            console.log('No valid authentication found, redirecting to login');
            window.location.href = 'login.html';
            return false;

        } catch (error) {
            console.error('Authentication check error:', error);
            // On any error, if we have a token, assume authenticated
            const token = localStorage.getItem('authToken');
            if (token) {
                console.log('Auth check failed but token exists, assuming authenticated');
                return true;
            }

            window.location.href = 'login.html';
            return false;
        }
    }

    async loadExistingEvent(eventId) {
        try {
            this.showLoading('Loading event...');
            await this.api.loadEvent(eventId);
            this.populateFields();
            this.hideLoading();
            console.log('Existing event loaded successfully');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to load event: ' + error.message);
            console.error('Failed to load existing event:', error);
        }
    }

    initializeNewEvent() {
        // Set default dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        this.api.currentEventData.startDate = tomorrow.toISOString().split('T')[0];
        this.api.currentEventData.endDate = tomorrow.toISOString().split('T')[0];
        
        this.populateFields();
        console.log('New event initialized');
    }

    populateFields() {
        const data = this.api.currentEventData;
        
        // Populate form fields
        this.setFieldValue('eventTitle', data.title);
        this.setFieldValue('overviewDescription', data.description);
        this.setFieldValue('eventStatus', data.status);

        // Handle location data with Google Places integration
        if (window.googlePlaces) {
            const locationData = {
                venue: data.venue,
                address: data.address,
                city: data.city,
                state: data.state,
                zipCode: data.zipCode,
                country: data.country,
                formattedAddress: data.venue ? `${data.venue}, ${data.city}, ${data.state}` : `${data.city}, ${data.state}`
            };
            window.googlePlaces.loadLocationData(locationData);
        } else {
            // Fallback for basic location input
            this.setFieldValue('locationInput', `${data.venue ? data.venue + ', ' : ''}${data.city}, ${data.state}`);
        }
        
        // Set date fields
        this.setFieldValue('eventDate', data.startDate);
        
        // Extract time from full date if available
        if (data.startDate) {
            const startDate = new Date(data.startDate + 'T10:00:00'); // Default 10:00 AM
            const endDate = new Date(data.endDate || data.startDate + 'T12:00:00'); // Default 12:00 PM
            
            this.setFieldValue('startTime', this.formatTimeForInput(startDate));
            this.setFieldValue('endTime', this.formatTimeForInput(endDate));
        }
        
        // Handle image
        if (data.imageUrl) {
            this.displayImage(data.imageUrl);
        }
        
        // Load Good to Know data
        if (window.goodToKnowManager && data.goodToKnow) {
            window.goodToKnowManager.loadData(data.goodToKnow);
        }
        
        // Update sidebar
        this.updateSidebar();
    }

    setFieldValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (element.contentEditable === 'true') {
                element.textContent = value || '';
            } else {
                element.value = value || '';
            }
        }
    }

    formatTimeForInput(date) {
        return date.toTimeString().substring(0, 5); // HH:MM format
    }

    displayImage(imageUrl) {
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        const eventImage = document.getElementById('eventImage');
        const sidebarImage = document.querySelector('.event-image-placeholder');
        
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
        if (eventImage) {
            eventImage.src = imageUrl;
            eventImage.style.display = 'block';
        }
        if (sidebarImage) {
            sidebarImage.style.backgroundImage = `url(${imageUrl})`;
            sidebarImage.style.backgroundSize = 'cover';
        }
    }

    updateSidebar() {
        const data = this.api.currentEventData;
        
        // Update title
        const titleEl = document.getElementById('eventTitleSidebar');
        if (titleEl) {
            titleEl.textContent = data.title || 'Event Title';
        }
        
        // Update date/time
        if (data.startDate) {
            const date = new Date(data.startDate);
            const timeStr = this.formatDisplayTime(date);
            const dateStr = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            
            const dateTimeEl = document.getElementById('eventDateTimeSidebar');
            if (dateTimeEl) {
                dateTimeEl.textContent = `${dateStr}, ${timeStr}`;
            }
        }
    }

    formatDisplayTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true
        });
    }

    setupEventHandlers() {
        // Title editing
        const titleElement = document.getElementById('eventTitle');
        if (titleElement) {
            titleElement.addEventListener('input', (e) => {
                this.api.currentEventData.title = e.target.textContent.trim();
                this.updateSidebar();
                this.scheduleAutoSave();
            });
        }

        // Location inputs - now handled by Google Places integration
        this.setupLocationEventHandlers();

        // Description
        const descriptionEl = document.getElementById('overviewDescription');
        if (descriptionEl) {
            descriptionEl.addEventListener('input', (e) => {
                this.api.currentEventData.description = e.target.value;
                this.scheduleAutoSave();
            });
        }

        // Status
        const statusEl = document.getElementById('eventStatus');
        if (statusEl) {
            statusEl.addEventListener('change', (e) => {
                this.api.currentEventData.status = e.target.value;
                this.scheduleAutoSave();
            });
        }


        // Date inputs
        const dateInputs = ['eventDate', 'startTime', 'endTime'];
        dateInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', () => {
                    this.updateDateTimeData();
                    this.updateSidebar();
                    this.scheduleAutoSave();
                });
            }
        });
    }

    setupLocationEventHandlers() {
        // Initialize map picker
        this.initializeMapPicker();

        // Get location data from Google Places integration periodically
        const syncLocationData = () => {
            if (window.googlePlaces) {
                const locationData = window.googlePlaces.getLocationData();

                // Update event data with proper backend structure
                this.api.currentEventData.location = {
                    type: 'venue',
                    venue: locationData.venue,
                    address: {
                        street: locationData.address,
                        city: locationData.city,
                        state: locationData.state,
                        country: locationData.country,
                        postalCode: locationData.zipCode,
                        coordinates: {
                            lat: locationData.latitude,
                            lng: locationData.longitude
                        },
                        placeId: locationData.placeId
                    }
                };

                // Also keep legacy fields for compatibility
                this.api.currentEventData.venue = locationData.venue;
                this.api.currentEventData.city = locationData.city;
                this.api.currentEventData.state = locationData.state;
                this.api.currentEventData.country = locationData.country;
                this.api.currentEventData.address = locationData.address;
                this.api.currentEventData.zipCode = locationData.zipCode;

                this.scheduleAutoSave();
            }
        };

        // Sync location data every few seconds if places integration is active
        setInterval(syncLocationData, 3000);
        
        // Also sync immediately when form is submitted
        const originalSaveAndContinue = this.saveAndContinue;
        this.saveAndContinue = () => {
            syncLocationData();
            return originalSaveAndContinue.call(this);
        };
    }

    // Initialize map-based location picker
    initializeMapPicker() {
        // Setup map toggle button
        const mapToggleBtn = document.getElementById('mapToggleBtn');
        const mapContainer = document.getElementById('mapContainer');

        if (mapToggleBtn && mapContainer) {
            mapToggleBtn.addEventListener('click', () => {
                const isVisible = mapContainer.style.display !== 'none';

                if (isVisible) {
                    // Hide map
                    mapContainer.style.display = 'none';
                    mapToggleBtn.textContent = 'Select Location on Map';
                    if (window.mapLocationPicker) {
                        window.mapLocationPicker.hide();
                    }
                } else {
                    // Show map
                    mapContainer.style.display = 'block';
                    mapToggleBtn.textContent = 'Hide Map';

                    // Initialize map if not already done
                    if (!window.mapLocationPicker || !window.mapLocationPicker.isInitialized) {
                        this.initializeMap();
                    } else {
                        window.mapLocationPicker.show();
                    }
                }
            });
        }
    }

    // Initialize the Google Map
    initializeMap() {
        if (window.google && window.google.maps && window.MapLocationPicker) {
            if (!window.mapLocationPicker) {
                window.mapLocationPicker = new MapLocationPicker();
            }

            const success = window.mapLocationPicker.initialize('mapLocationPicker');

            if (success) {
                // Set callback for when location is selected
                window.mapLocationPicker.onLocationSelected((locationData) => {
                    console.log('Map location selected:', locationData);

                    // Extract venue name and city as requested
                    const venueName = locationData.venueName;
                    const city = locationData.city;

                    console.log('Extracted:', { venueName, city });

                    // Update form fields
                    if (venueName) {
                        const venueInput = document.getElementById('venueName');
                        if (venueInput) venueInput.value = venueName;
                    }

                    if (city) {
                        const cityInput = document.getElementById('cityName');
                        if (cityInput) cityInput.value = city;
                    }

                    // Update other fields
                    if (locationData.address) {
                        const addressInput = document.getElementById('streetAddress');
                        if (addressInput) addressInput.value = locationData.address;
                    }

                    if (locationData.state) {
                        const stateInput = document.getElementById('stateName');
                        if (stateInput) stateInput.value = locationData.state;
                    }

                    if (locationData.zipCode) {
                        const zipInput = document.getElementById('zipCode');
                        if (zipInput) zipInput.value = locationData.zipCode;
                    }

                    if (locationData.country) {
                        const countryInput = document.getElementById('countryName');
                        if (countryInput) countryInput.value = locationData.country;
                    }

                    // Update event data
                    this.api.currentEventData.venue = venueName;
                    this.api.currentEventData.city = city;
                    this.api.currentEventData.address = locationData.address;
                    this.api.currentEventData.state = locationData.state;
                    this.api.currentEventData.country = locationData.country;
                    this.api.currentEventData.zipCode = locationData.zipCode;
                    this.api.currentEventData.latitude = locationData.lat;
                    this.api.currentEventData.longitude = locationData.lng;
                    this.api.currentEventData.placeId = locationData.placeId;

                    // Update structured location data
                    this.api.currentEventData.location = {
                        type: 'venue',
                        venue: {
                            name: venueName,
                            address: {
                                street: locationData.address,
                                city: city,
                                state: locationData.state,
                                country: locationData.country,
                                zipCode: locationData.zipCode
                            }
                        },
                        coordinates: {
                            lat: locationData.lat,
                            lng: locationData.lng
                        },
                        placeId: locationData.placeId
                    };

                    // Trigger auto-save
                    this.scheduleAutoSave();
                    this.updateSidebar();
                });

                console.log('Map location picker initialized successfully');
            } else {
                console.error('Failed to initialize map location picker');
            }
        } else {
            console.log('Waiting for Google Maps API or MapLocationPicker to load...');
            // Retry after a short delay
            setTimeout(() => this.initializeMap(), 1000);
        }
    }

    updateDateTimeData() {
        const eventDate = document.getElementById('eventDate')?.value;
        const startTime = document.getElementById('startTime')?.value || '10:00';
        const endTime = document.getElementById('endTime')?.value || '12:00';

        if (eventDate) {
            this.api.currentEventData.startDate = `${eventDate}T${startTime}:00`;
            this.api.currentEventData.endDate = `${eventDate}T${endTime}:00`;
        }
    }

    setupAutoSave() {
        // Auto-save every 30 seconds if there are changes
        setInterval(() => {
            if (this.api.currentEventData.title) {
                this.autoSave();
            }
        }, 30000);
    }

    scheduleAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSave();
        }, 3000);
    }

    async autoSave() {
        // Collect current form data
        const formData = this.api.collectFormData();
        if (!formData.title || formData.title.length < 3) return;

        try {
            this.showAutoSaving();
            await this.api.saveEvent(formData);
            this.hideAutoSaving();

            // Show brief success indicator
            setTimeout(() => {
                this.showSuccess('Auto-saved', 2000);
            }, 500);
        } catch (error) {
            this.hideAutoSaving();
            console.error('Auto-save failed:', error);
        }
    }

    async handleImageUpload(file) {
        try {
            this.showLoading('Uploading image...');

            const imageUrl = await this.api.uploadImage(file);

            // Add image to current event data
            if (!this.api.currentEventData.images) {
                this.api.currentEventData.images = [];
            }

            this.api.currentEventData.images.push({
                url: imageUrl,
                alt: file.name,
                isPrimary: this.api.currentEventData.images.length === 0
            });

            // Update the primary image for backward compatibility
            if (this.api.currentEventData.images.length === 1) {
                this.api.currentEventData.imageUrl = imageUrl;
            }

            this.displayImage(imageUrl);
            this.scheduleAutoSave();
            this.hideLoading();
            this.showSuccess('Image uploaded successfully');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to upload image: ' + error.message);
        }
    }

    async handleVideoUpload(file) {
        try {
            this.showLoading('Uploading video...');

            const videoData = await this.api.uploadVideo(file);

            // Add video to current event data
            if (!this.api.currentEventData.videos) {
                this.api.currentEventData.videos = [];
            }

            this.api.currentEventData.videos.push({
                url: videoData.videoUrl,
                title: file.name,
                thumbnail: videoData.thumbnailUrl,
                duration: 0 // Will be updated when we have actual video processing
            });

            this.displayVideo(videoData.videoUrl, videoData.thumbnailUrl);
            this.hideLoading();
            this.showSuccess('Video uploaded successfully');
            this.scheduleAutoSave();
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to upload video: ' + error.message);
        }
    }

    async handleLineupImageUpload(file) {
        try {
            this.showLoading('Uploading lineup image...');
            const imageUrl = await this.api.uploadImage(file);
            // Find the currently active lineup item and update its image
            const activeUpload = document.querySelector('.image-upload-placeholder');
            if (activeUpload) {
                activeUpload.innerHTML = `<img src="${imageUrl}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">`;
            }
            this.hideLoading();
            this.showSuccess('Lineup image uploaded successfully');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to upload lineup image: ' + error.message);
        }
    }

    displayVideo(videoUrl) {
        const videoPlaceholder = document.getElementById('videoUploadPlaceholder');
        if (videoPlaceholder) {
            videoPlaceholder.innerHTML = `
                <video controls style="width: 100%; max-height: 200px;">
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }
    }

    async saveAndContinue() {
        if (!this.validateRequiredFields()) {
            return;
        }

        try {
            this.showLoading('Saving event...');
            const result = await this.api.saveEvent();
            
            if (result.success) {
                this.hideLoading();
                this.showSuccess('Event saved successfully');

                // Navigate to next step
                setTimeout(() => {
                    window.location.href = `add-tickets.html?id=${this.api.eventId}`;
                }, 1000);
            }
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to save event: ' + error.message);
        }
    }

    validateRequiredFields() {
        // Update data from DOM before validation
        this.updateEventDataFromDOM();

        const requiredFields = [
            { field: 'title', message: 'Please enter an event title' },
            { field: 'description', message: 'Please enter an event description' },
            { field: 'startDate', message: 'Please select an event date' }
        ];

        for (const { field, message } of requiredFields) {
            const value = this.api.currentEventData[field];

            // Special handling for dates
            if (field === 'startDate') {
                if (!value || !Date.parse(value)) {
                    this.showError(message);
                    return false;
                }
            } else {
                // For string fields
                if (!value || (typeof value === 'string' && value.trim() === '')) {
                    this.showError(message);
                    return false;
                }
            }
        }

        return true;
    }

    // Update event data from current DOM values
    updateEventDataFromDOM() {
        // Title
        const titleEl = document.getElementById('eventTitle');
        if (titleEl) {
            this.api.currentEventData.title = titleEl.textContent.trim();
        }

        // Description
        const descriptionEl = document.getElementById('overviewDescription');
        if (descriptionEl) {
            this.api.currentEventData.description = descriptionEl.value.trim();
        }

        // Date and time
        const dateEl = document.getElementById('eventDate');
        const startTimeEl = document.getElementById('startTime');
        const endTimeEl = document.getElementById('endTime');

        if (dateEl && dateEl.value) {
            const startTime = startTimeEl ? startTimeEl.value : '00:00';
            const endTime = endTimeEl ? endTimeEl.value : '23:59';

            this.api.currentEventData.startDate = new Date(`${dateEl.value}T${startTime}`);
            this.api.currentEventData.endDate = new Date(`${dateEl.value}T${endTime}`);
        }

        // Image - preserve existing imageUrl if it exists
        const eventImage = document.getElementById('eventImage');
        if (eventImage && eventImage.src && eventImage.style.display !== 'none') {
            this.api.currentEventData.imageUrl = eventImage.src;
        }
    }

    // UI Helper methods
    showLoading(message = 'Loading...') {
        const saveStatus = document.getElementById('saveStatus');
        const statusText = document.querySelector('.save-status-text');
        const progressFill = document.querySelector('.save-progress-fill');

        if (saveStatus && statusText && progressFill) {
            saveStatus.style.display = 'block';
            saveStatus.className = 'save-status';
            statusText.textContent = message;
            progressFill.style.width = '30%';
        }
        console.log('Loading:', message);
    }

    hideLoading() {
        const saveStatus = document.getElementById('saveStatus');
        const progressFill = document.querySelector('.save-progress-fill');

        if (progressFill) {
            progressFill.style.width = '100%';
            setTimeout(() => {
                if (saveStatus) {
                    saveStatus.style.display = 'none';
                }
            }, 1000);
        }
        console.log('Loading complete');
    }

    showAutoSaving() {
        const autoSaveIndicator = document.getElementById('autoSaveIndicator');
        if (autoSaveIndicator) {
            autoSaveIndicator.style.display = 'block';
        }
    }

    hideAutoSaving() {
        const autoSaveIndicator = document.getElementById('autoSaveIndicator');
        if (autoSaveIndicator) {
            autoSaveIndicator.style.display = 'none';
        }
    }

    showSuccess(message, duration = 3000) {
        this.showNotification(message, 'success', duration);
    }

    showError(message) {
        this.showNotification(message, 'error', 5000);
    }

    showNotification(message, type = 'info', duration = 3000) {
        // Simple notification - you can enhance this
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, duration);
    }

    // Delegate saveEvent to API for backward compatibility
    async saveEvent() {
        return await this.api.saveEvent();
    }
}

// Enhanced Media Upload Manager
class EnhancedMediaUploadManager {
    constructor() {
        this.uploadedImages = []
        this.uploadedVideos = []
        this.maxImageSize = 10 * 1024 * 1024 // 10MB
        this.maxVideoSize = 100 * 1024 * 1024 // 100MB
        this.allowedImageTypes = ["image/jpeg", "image/png"]
        this.allowedVideoTypes = ["video/mp4", "video/mov"]

        this.init()
    }

    init() {
        this.bindEvents()
        this.setupDragAndDrop()
    }

    bindEvents() {
        // Enhanced image upload events
        const imageUploadBtn = document.getElementById("enhancedImageUploadBtn")
        const imageInput = document.getElementById("enhancedImageInput")

        imageUploadBtn?.addEventListener("click", () => imageInput?.click())
        imageInput?.addEventListener("change", (e) => this.handleImageUpload(e))

        // Enhanced video upload events
        const videoUploadBtn = document.getElementById("enhancedVideoUploadBtn")
        const videoInput = document.getElementById("enhancedVideoInput")

        videoUploadBtn?.addEventListener("click", () => videoInput?.click())
        videoInput?.addEventListener("change", (e) => this.handleVideoUpload(e))

        // Button interactions
        const viewExamplesBtn = document.querySelector(".enhanced-view-examples-btn")
        const viewDetailsBtn = document.querySelector(".enhanced-view-details-btn")

        viewExamplesBtn?.addEventListener("click", () => this.showExamples())
        viewDetailsBtn?.addEventListener("click", () => this.showVideoDetails())
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById("enhancedImageDropZone")

        if (!dropZone) return

        // Prevent default drag behaviors
        ;["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
            dropZone.addEventListener(eventName, this.preventDefaults, false)
            document.body.addEventListener(eventName, this.preventDefaults, false)
        })

        // Highlight drop zone when item is dragged over it
        ;["dragenter", "dragover"].forEach((eventName) => {
            dropZone.addEventListener(eventName, () => this.highlight(dropZone), false)
        })
        ;["dragleave", "drop"].forEach((eventName) => {
            dropZone.addEventListener(eventName, () => this.unhighlight(dropZone), false)
        })

        // Handle dropped files
        dropZone.addEventListener("drop", (e) => this.handleDrop(e), false)
    }

    preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    highlight(element) {
        element.classList.add("drag-active")
    }

    unhighlight(element) {
        element.classList.remove("drag-active")
    }

    handleDrop(e) {
        const dt = e.dataTransfer
        const files = Array.from(dt.files)

        this.processFiles(files)
    }

    handleImageUpload(e) {
        const files = Array.from(e.target.files || [])
        this.processFiles(files, "image")
    }

    handleVideoUpload(e) {
        const files = Array.from(e.target.files || [])
        this.processFiles(files, "video")
    }

    processFiles(files, type = "auto") {
        files.forEach((file) => {
            if (type === "auto") {
                if (this.isValidImage(file)) {
                    this.addImage(file)
                } else if (this.isValidVideo(file)) {
                    this.addVideo(file)
                } else {
                    this.showError(`Invalid file type: ${file.name}`)
                }
            } else if (type === "image" && this.isValidImage(file)) {
                this.addImage(file)
            } else if (type === "video" && this.isValidVideo(file)) {
                this.addVideo(file)
            } else {
                this.showError(`Invalid ${type} file: ${file.name}`)
            }
        })
    }

    isValidImage(file) {
        return this.allowedImageTypes.includes(file.type) && file.size <= this.maxImageSize
    }

    isValidVideo(file) {
        return this.allowedVideoTypes.includes(file.type) && file.size <= this.maxVideoSize
    }

    async addImage(file) {
        try {
            this.uploadedImages.push(file)
            this.showSuccess(`Image added: ${file.name}`)

            // Use existing EventBuilder upload functionality
            if (window.eventBuilder) {
                await window.eventBuilder.handleImageUpload(file)
            }

            console.log("[Enhanced] Image uploaded:", file.name, "Size:", this.formatFileSize(file.size))
        } catch (error) {
            this.showError(`Failed to upload image: ${error.message}`)
        }
    }

    async addVideo(file) {
        try {
            this.uploadedVideos.push(file)
            this.showSuccess(`Video added: ${file.name}`)

            // Use existing EventBuilder upload functionality
            if (window.eventBuilder) {
                await window.eventBuilder.handleVideoUpload(file)
            }

            console.log("[Enhanced] Video uploaded:", file.name, "Size:", this.formatFileSize(file.size))
        } catch (error) {
            this.showError(`Failed to upload video: ${error.message}`)
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    showSuccess(message) {
        this.showNotification(message, "success")
    }

    showError(message) {
        this.showNotification(message, "error")
    }

    showNotification(message, type = "info") {
        // Create notification element
        const notification = document.createElement("div")
        notification.className = `enhanced-notification enhanced-notification-${type}`
        notification.textContent = message

        // Style the notification
        Object.assign(notification.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            padding: "12px 20px",
            borderRadius: "8px",
            color: "white",
            fontWeight: "500",
            fontSize: "14px",
            zIndex: "1000",
            transform: "translateX(100%)",
            transition: "transform 0.3s ease",
            backgroundColor: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6",
        })

        document.body.appendChild(notification)

        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = "translateX(0)"
        })

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = "translateX(100%)"
            setTimeout(() => {
                document.body.removeChild(notification)
            }, 300)
        }, 3000)
    }

    showExamples() {
        console.log("[Enhanced] Showing image examples")
        this.showNotification("Opening image examples...", "info")
    }

    showVideoDetails() {
        console.log("[Enhanced] Showing video details")
        this.showNotification("Opening video format details...", "info")
    }

    // Public API methods
    getUploadedImages() {
        return this.uploadedImages
    }

    getUploadedVideos() {
        return this.uploadedVideos
    }

    clearUploads() {
        this.uploadedImages = []
        this.uploadedVideos = []
        console.log("[Enhanced] Uploads cleared")
    }
}

// Global functions for template access (Legacy support)
function uploadImage() {
    document.getElementById('imageInput')?.click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && window.eventBuilder) {
        window.eventBuilder.handleImageUpload(file);
    }
}

function uploadVideo() {
    document.getElementById('videoInput')?.click();
}

function uploadLineupImage() {
    document.getElementById('lineupImageInput')?.click();
}

function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (file && window.eventBuilder) {
        window.eventBuilder.handleVideoUpload(file);
    }
}

function handleLineupImageUpload(event) {
    const file = event.target.files[0];
    if (file && window.eventBuilder) {
        window.eventBuilder.handleLineupImageUpload(file);
    }
}

// Add ripple effects to enhanced upload buttons
function addRippleEffects() {
    const buttons = document.querySelectorAll(".enhanced-upload-btn")

    buttons.forEach((button) => {
        button.addEventListener("click", function (e) {
            const ripple = document.createElement("span")
            const rect = this.getBoundingClientRect()
            const size = Math.max(rect.width, rect.height)
            const x = e.clientX - rect.left - size / 2
            const y = e.clientY - rect.top - size / 2

            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `

            this.style.position = "relative"
            this.style.overflow = "hidden"
            this.appendChild(ripple)

            setTimeout(() => {
                ripple.remove()
            }, 600)
        })
    })
}

// Cleanup function for upload sections
function checkUploadSectionState() {
    // Remove any old upload-related elements that might interfere
    const oldElements = document.querySelectorAll('.pic1-upload-card, .drag-drop-area, .upload-image-btn');
    oldElements.forEach(el => {
        if (el && !el.closest('.enhanced-upload-card')) {
            console.log('Removing old upload element:', el.className);
        }
    });
}

// Lineup section functions
function addLineupSection() {
    const lineupSection = document.getElementById('lineupSection');
    const lineupCard = document.getElementById('lineupCard');

    if (lineupSection && lineupCard) {
        lineupSection.style.display = 'block';
        lineupCard.style.display = 'none';
    }
}


function deleteLineupSection() {
    const lineupSection = document.getElementById('lineupSection');
    const lineupCard = document.getElementById('lineupCard');

    if (lineupSection && lineupCard) {
        lineupSection.style.display = 'none';
        lineupCard.style.display = 'flex';
    }
}

function editLineupTitle() {
    // Implement lineup title editing
    const title = prompt('Enter new lineup title:', 'Lineup');
    if (title) {
        const titleElement = document.querySelector('.lineup-section .section-header h3');
        if (titleElement) {
            titleElement.innerHTML = title + ' <button class="edit-btn" onclick="editLineupTitle()">✏️</button>';
        }
    }
}

function addTagline() {
    // Implement tagline functionality
    console.log('Add tagline clicked');
}

function addSocialLinks() {
    // Implement social links functionality
    console.log('Add social links clicked');
}

function deleteLineupItem(button) {
    const lineupItem = button.closest('.lineup-item');
    if (lineupItem) {
        lineupItem.remove();
    }
}

function addAnotherLineupItem() {
    const lineupContainer = document.getElementById('lineupContainer');
    if (lineupContainer) {
        const newItem = document.querySelector('.lineup-item').cloneNode(true);
        // Clear input values
        const inputs = newItem.querySelectorAll('input, textarea');
        inputs.forEach(input => input.value = '');
        const checkbox = newItem.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;

        lineupContainer.appendChild(newItem);
    }
}

// Agenda section functions
function addAgendaSection() {
    const agendaSection = document.getElementById('agendaSection');
    const agendaCard = document.getElementById('agendaCard');

    if (agendaSection && agendaCard) {
        agendaSection.style.display = 'block';
        agendaCard.style.display = 'none';
    }
}


function deleteAgendaSection() {
    const agendaSection = document.getElementById('agendaSection');
    const agendaCard = document.getElementById('agendaCard');

    if (agendaSection && agendaCard) {
        agendaSection.style.display = 'none';
        agendaCard.style.display = 'flex';
    }
}

function switchAgendaTab(tabName) {
    const tabs = document.querySelectorAll('.agenda-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    if (tabName === 'new') {
        // Add new agenda functionality
        console.log('Add new agenda clicked');
    } else {
        // Switch to agenda tab
        const agendaTab = document.querySelector('.agenda-tab');
        if (agendaTab) agendaTab.classList.add('active');
    }
}

function addHost() {
    // Implement add host functionality
    console.log('Add host clicked');
}

function addAgendaDescription() {
    // Implement add description functionality
    console.log('Add agenda description clicked');
}

function deleteAgendaItem(button) {
    const agendaItem = button.closest('.agenda-item');
    if (agendaItem) {
        agendaItem.remove();
    }
}

function addAgendaSlot() {
    const agendaContainer = document.getElementById('agendaContainer');
    if (agendaContainer) {
        const newItem = document.querySelector('.agenda-item').cloneNode(true);
        // Clear input values
        const inputs = newItem.querySelectorAll('input, textarea');
        inputs.forEach(input => input.value = '');

        agendaContainer.appendChild(newItem);
    }
}

// Upload section expand/collapse functions
function expandUploadSection() {
    const heroSection = document.getElementById('uploadHeroSection');
    const expandedSection = document.getElementById('uploadExpandedSection');

    if (heroSection && expandedSection) {
        // Hide hero section with animation
        heroSection.style.transform = 'scale(0.95)';
        heroSection.style.opacity = '0';

        setTimeout(() => {
            heroSection.style.display = 'none';
            expandedSection.style.display = 'block';

            // Animate in the expanded section
            expandedSection.style.opacity = '0';
            expandedSection.style.transform = 'translateY(20px)';

            setTimeout(() => {
                expandedSection.style.transition = 'all 0.3s ease';
                expandedSection.style.opacity = '1';
                expandedSection.style.transform = 'translateY(0)';
            }, 10);
        }, 200);
    }
}


function collapseUploadSection() {
    const heroSection = document.getElementById('uploadHeroSection');
    const expandedSection = document.getElementById('uploadExpandedSection');

    if (heroSection && expandedSection) {
        // Animate out the expanded section
        expandedSection.style.transition = 'all 0.2s ease';
        expandedSection.style.opacity = '0';
        expandedSection.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            expandedSection.style.display = 'none';
            heroSection.style.display = 'block';

            // Reset hero section styles
            heroSection.style.transition = 'all 0.3s ease';
            heroSection.style.transform = 'scale(1)';
            heroSection.style.opacity = '1';
        }, 200);
    }
}

// Check if upload section should be expanded on page load
function checkUploadSectionState() {
    const eventImage = document.getElementById('eventImage');
    const videoPlaceholder = document.getElementById('videoUploadPlaceholder');

    // If there's already an uploaded image or video, show expanded section
    if ((eventImage && eventImage.src && eventImage.style.display !== 'none') ||
        (videoPlaceholder && videoPlaceholder.innerHTML.includes('<video'))) {
        expandUploadSection();
    }
}

// Enhanced save and continue functionality
async function saveAndContinue() {
    try {
        if (!window.eventBuilder) {
            throw new Error('Event builder not initialized');
        }

        if (typeof window.eventBuilder.saveAndContinue !== 'function') {
            console.error('saveAndContinue method not found on eventBuilder:', Object.keys(window.eventBuilder));
            throw new Error('saveAndContinue method is not available');
        }

        // Use the EventBuilder's saveAndContinue method which includes validation and UI updates
        await window.eventBuilder.saveAndContinue();

    } catch (error) {
        console.error('Save failed:', error);

        // Show error message
        if (window.eventBuilder.showError) {
            window.eventBuilder.showError('Failed to save event: ' + error.message);
        } else {
            alert('Failed to save event: ' + error.message);
        }
    } finally {
        // Reset button state
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.textContent = 'Save and continue';
            saveBtn.disabled = false;
        }
    }
}

function previewEvent() {
    if (window.eventBuilder) {
        window.eventBuilder.api.saveEvent().then(() => {
            window.location.href = `event-preview.html?id=${window.eventBuilder.api.eventId}`;
        });
    }
}

function goToPublish() {
    if (window.eventBuilder) {
        window.eventBuilder.api.saveEvent().then(() => {
            window.location.href = `publish-event.html?id=${window.eventBuilder.api.eventId}`;
        });
    }
}

function goToTickets() {
    if (window.eventBuilder && window.eventBuilder.api.eventId) {
        // Navigate with event ID for database-only approach
        window.location.href = `add-tickets.html?id=${window.eventBuilder.api.eventId}`;
    } else {
        console.error('No event ID available');
        alert('Please save your event first before adding tickets.');
    }
}

// User dropdown functions
function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }
}

function viewProfile() {
    window.location.href = 'profile.html';
}

function accountSettings() {
    window.location.href = 'settings.html';
}

function logoutUser() {
    if (window.authUtils) {
        window.authUtils.logout();
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (event) => {
    const userMenu = event.target.closest('.user-menu');
    if (!userMenu) {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
});

// Prevent uncaught promise rejections and message channel errors
window.addEventListener('unhandledrejection', (event) => {
    console.warn('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent console errors
});

// Handle message channel errors (common with browser extensions)
window.addEventListener('error', (event) => {
    if (event.message.includes('message channel closed')) {
        console.warn('Message channel error suppressed (likely browser extension)');
        return true; // Prevent error from propagating
    }
});

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for config and auth-utils to load
    const initializeWhenReady = () => {
        try {
            if (window.Config && window.authUtils) {
                window.eventBuilder = new EventBuilder();

                // Initialize Enhanced Media Upload Manager
                console.log("[Enhanced] Initializing Enhanced Media Upload Manager")
                window.enhancedMediaUploadManager = new EnhancedMediaUploadManager();

                // Add ripple effects to enhanced upload buttons
                setTimeout(() => {
                    addRippleEffects();
                }, 500);

                // Initialize form functionality
                setTimeout(() => {
                    initializeFormData();
                    enableAutoSave();
                    setupFormEventListeners();
                }, 800);

                // Check upload section state after initialization
                setTimeout(() => {
                    checkUploadSectionState();
                }, 1000);
            } else {
                setTimeout(initializeWhenReady, 100);
            }
        } catch (error) {
            console.error('Error initializing event builder:', error);
            // Retry initialization after a delay
            setTimeout(initializeWhenReady, 1000);
        }
    };

    setTimeout(initializeWhenReady, 100);
});

// Make all functions globally available (must be at the end after all functions are defined)
window.addLineupSection = addLineupSection;
window.addAgendaSection = addAgendaSection;
window.deleteLineupSection = deleteLineupSection;
window.deleteAgendaSection = deleteAgendaSection;
// Upload section functions removed as we now use direct card layout
window.saveAndContinue = saveAndContinue;
window.handleImageUpload = handleImageUpload;
window.handleVideoUpload = handleVideoUpload;
window.handleLineupImageUpload = handleLineupImageUpload;

// Additional upload functions
window.uploadImage = function() {
    document.getElementById('imageInput').click();
};

window.uploadVideo = function() {
    document.getElementById('videoInput').click();
};

// Auto-save functionality
function enableAutoSave() {
    // Auto-save on form field changes
    const formFields = [
        'eventTitle', 'eventDate', 'startTime', 'endTime',
        'venueName', 'streetAddress', 'cityName', 'stateName', 'zipCode',
        'overviewDescription', 'eventStatus'
    ];

    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Use different events based on field type
            const events = field.tagName === 'INPUT' ? ['input', 'change'] : ['input', 'blur'];

            events.forEach(eventType => {
                field.addEventListener(eventType, () => {
                    if (window.eventBuilder) {
                        window.eventBuilder.scheduleAutoSave();
                    }
                });
            });
        }
    });

    // Auto-save when content editable fields change
    const eventTitle = document.getElementById('eventTitle');
    if (eventTitle && eventTitle.contentEditable) {
        eventTitle.addEventListener('blur', () => {
            if (window.eventBuilder) {
                window.eventBuilder.scheduleAutoSave();
            }
        });
    }
}

// Initialize form data from URL parameters or local storage
function initializeFormData() {
    try {
        // Check for event ID in URL for editing
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id') || urlParams.get('eventId');

        if (eventId && window.eventBuilder) {
            console.log('Loading event for editing:', eventId);
            window.eventBuilder.api.loadEvent(eventId).then(eventData => {
                if (eventData) {
                    populateFormWithEventData(eventData);
                }
            }).catch(error => {
                console.error('Failed to load event:', error);
            });
        } else {
            console.log('No event ID provided, starting new event');
        }

        // Set default date and time
        setDefaultDateTime();

    } catch (error) {
        console.error('Error initializing form data:', error);
    }
}

// Populate form with event data
function populateFormWithEventData(eventData) {
    try {
        // Title
        const titleField = document.getElementById('eventTitle');
        if (titleField && eventData.title) {
            if (titleField.contentEditable) {
                titleField.textContent = eventData.title;
            } else {
                titleField.value = eventData.title;
            }
        }

        // Date and time
        if (eventData.startDate || eventData.dateTime?.start) {
            const startDate = eventData.startDate || eventData.dateTime?.start;
            if (startDate) {
                const date = new Date(startDate);
                const dateField = document.getElementById('eventDate');
                if (dateField) {
                    dateField.value = date.toISOString().split('T')[0];
                }

                const timeField = document.getElementById('startTime');
                if (timeField && eventData.startTime) {
                    timeField.value = eventData.startTime;
                } else if (timeField) {
                    timeField.value = date.toTimeString().slice(0, 5);
                }
            }
        }

        if (eventData.endTime) {
            const endTimeField = document.getElementById('endTime');
            if (endTimeField) {
                endTimeField.value = eventData.endTime;
            }
        }

        // Location
        const fields = {
            venueName: eventData.venue || eventData.location?.venue?.name,
            streetAddress: eventData.address || eventData.location?.venue?.address?.street,
            cityName: eventData.city || eventData.location?.venue?.address?.city,
            stateName: eventData.state || eventData.location?.venue?.address?.state,
            zipCode: eventData.zipCode || eventData.location?.venue?.address?.zipCode,
            countryName: eventData.country || eventData.location?.venue?.address?.country
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field && value) {
                field.value = value;
            }
        });

        // Description
        const descField = document.getElementById('overviewDescription');
        if (descField && eventData.description) {
            descField.value = eventData.description;
        }

        // Status
        const statusField = document.getElementById('eventStatus');
        if (statusField && eventData.status) {
            statusField.value = eventData.status;
        }

        // Update sidebar display
        updateSidebarDisplay();

    } catch (error) {
        console.error('Error populating form:', error);
    }
}

// Set default date and time
function setDefaultDateTime() {
    const dateField = document.getElementById('eventDate');
    const startTimeField = document.getElementById('startTime');
    const endTimeField = document.getElementById('endTime');

    if (dateField && !dateField.value) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateField.value = tomorrow.toISOString().split('T')[0];
    }

    if (startTimeField && !startTimeField.value) {
        startTimeField.value = '18:00'; // Default to 6 PM
    }

    if (endTimeField && !endTimeField.value) {
        endTimeField.value = '20:00'; // Default to 8 PM
    }
}

// Update sidebar display with current form data
function updateSidebarDisplay() {
    try {
        const title = document.getElementById('eventTitle')?.textContent ||
                     document.getElementById('eventTitle')?.value || 'Event Title';
        const date = document.getElementById('eventDate')?.value;
        const startTime = document.getElementById('startTime')?.value;

        // Update sidebar title
        const sidebarTitle = document.getElementById('eventTitleSidebar');
        if (sidebarTitle) {
            sidebarTitle.textContent = title;
        }

        // Update sidebar date/time
        const sidebarDateTime = document.getElementById('eventDateTimeSidebar');
        if (sidebarDateTime && date && startTime) {
            const eventDate = new Date(date + 'T' + startTime);
            const options = {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            sidebarDateTime.textContent = eventDate.toLocaleDateString('en-US', options);
        }
    } catch (error) {
        console.error('Error updating sidebar:', error);
    }
}

// Setup form event listeners
function setupFormEventListeners() {
    // Listen for form changes and update sidebar
    const formFields = ['eventTitle', 'eventDate', 'startTime'];
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', updateSidebarDisplay);
            field.addEventListener('change', updateSidebarDisplay);
        }
    });

    // Content editable title support
    const eventTitle = document.getElementById('eventTitle');
    if (eventTitle) {
        eventTitle.addEventListener('input', updateSidebarDisplay);
        eventTitle.addEventListener('blur', updateSidebarDisplay);
    }
}

// Debug: Log functions to verify they're available
console.log('Functions available:', {
    addLineupSection: typeof window.addLineupSection,
    addAgendaSection: typeof window.addAgendaSection,
    uploadImage: typeof window.uploadImage,
    uploadVideo: typeof window.uploadVideo,
    saveAndContinue: typeof window.saveAndContinue
});

// Global error handling for async response listener errors (usually from browser extensions)
window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('message channel closed')) {
        // Silently ignore this error as it's caused by browser extensions
        console.debug('Ignoring browser extension error:', event.error.message);
        event.preventDefault();
        return false;
    }
});

// Handle unhandled promise rejections gracefully
window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('message channel closed')) {
        // Silently ignore this error as it's caused by browser extensions
        console.debug('Ignoring browser extension promise rejection:', event.reason.message);
        event.preventDefault();
        return false;
    }
});
