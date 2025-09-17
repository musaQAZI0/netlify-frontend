// Event Builder API Integration
class EventBuilderAPI {
    constructor() {
        this.baseURL = window.Config ? window.Config.API_BASE_URL : 'https://crowd-backend-zxxp.onrender.com/api';
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
    }

    // Get authentication token
    getAuthToken() {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    }

    // API request helper
    async apiRequest(endpoint, options = {}) {
        const token = this.getAuthToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            ...options
        };

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
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

    // Save event (create or update)
    async saveEvent(eventData) {
        try {
            // Merge current data with new data
            this.currentEventData = { ...this.currentEventData, ...eventData };

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
            
            const token = this.getAuthToken();
            const response = await fetch(`${this.baseURL}/events/upload-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
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
        if (!this.checkAuthentication()) {
            return;
        }

        // Initialize user interface
        if (window.authUtils) {
            await window.authUtils.initializeUserInterface();
        }

        // Check if we're editing an existing event
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('id') || localStorage.getItem('editingEventId');
        
        if (eventId) {
            await this.loadExistingEvent(eventId);
        } else {
            this.initializeNewEvent();
        }
        
        this.setupEventHandlers();
        this.setupAutoSave();
        
        console.log('Event Builder initialized successfully');
    }

    checkAuthentication() {
        if (!window.authUtils.isAuthenticated()) {
            console.log('User not authenticated, redirecting to login');
            localStorage.setItem('redirectAfterLogin', 'event-builder.html');
            window.location.href = 'login.html';
            return false;
        }
        return true;
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
        // Get location data from Google Places integration periodically
        const syncLocationData = () => {
            if (window.googlePlaces) {
                const locationData = window.googlePlaces.getLocationData();
                
                // Update event data with proper backend structure
                this.api.currentEventData.location = {
                    type: 'physical',
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
        if (!this.api.currentEventData.title) return;
        
        try {
            await this.api.saveEvent();
            this.showSuccess('Auto-saved', 2000);
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    async handleImageUpload(file) {
        try {
            this.showLoading('Uploading image...');
            const imageUrl = await this.api.uploadImage(file);
            this.api.currentEventData.imageUrl = imageUrl;
            this.displayImage(imageUrl);
            this.scheduleAutoSave();
            this.hideLoading();
            this.showSuccess('Image uploaded successfully');
        } catch (error) {
            this.hideLoading();
            this.showError('Failed to upload image: ' + error.message);
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
                // Store event ID for next steps
                localStorage.setItem('editingEventId', this.api.eventId);
                
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
        const requiredFields = [
            { field: 'title', message: 'Please enter an event title' },
            { field: 'description', message: 'Please enter an event description' },
            { field: 'startDate', message: 'Please select an event date' }
        ];

        for (const { field, message } of requiredFields) {
            if (!this.api.currentEventData[field] || this.api.currentEventData[field].trim() === '') {
                this.showError(message);
                return false;
            }
        }

        return true;
    }

    // UI Helper methods
    showLoading(message = 'Loading...') {
        // You can implement a loading spinner here
        console.log('Loading:', message);
    }

    hideLoading() {
        // Hide loading spinner
        console.log('Loading complete');
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
}

// Global functions for template access
function uploadImage() {
    document.getElementById('imageInput')?.click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file && window.eventBuilder) {
        window.eventBuilder.handleImageUpload(file);
    }
}

function saveAndContinue() {
    if (window.eventBuilder) {
        window.eventBuilder.saveAndContinue();
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
    if (window.eventBuilder) {
        window.eventBuilder.api.saveEvent().then(() => {
            window.location.href = `add-tickets.html?id=${window.eventBuilder.api.eventId}`;
        });
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