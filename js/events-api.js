// Events API Integration
class EventsAPI {
    constructor() {
        // Use Config if available, otherwise detect environment
        if (window.Config && window.Config.API_BASE_URL) {
            this.baseURL = `${window.Config.API_BASE_URL}/api`;
        } else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.baseURL = 'http://localhost:3002/api';
        } else {
            this.baseURL = 'https://crowd-backend-zxxp.onrender.com/api';
        }
        console.log('EventsAPI initialized with baseURL:', this.baseURL);
    }

    // Get all published events
    async getEvents(filters = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filters.category) params.append('category', filters.category);
            if (filters.city) params.append('city', filters.city);
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.page) params.append('page', filters.page);

            const url = `${this.baseURL}/events${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch events');
            }

            return data;
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    // Get events by category
    async getEventsByCategory(category, filters = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filters.city) params.append('city', filters.city);
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.page) params.append('page', filters.page);

            const url = `${this.baseURL}/events/category/${encodeURIComponent(category)}${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch events');
            }

            return data;
        } catch (error) {
            console.error('Error fetching events by category:', error);
            throw error;
        }
    }

    // Get single event by ID
    async getEventById(eventId) {
        try {
            const response = await fetch(`${this.baseURL}/events/${eventId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch event');
            }

            return data;
        } catch (error) {
            console.error('Error fetching event:', error);
            throw error;
        }
    }

    // Search events
    async searchEvents(query, filters = {}) {
        try {
            const params = new URLSearchParams();
            
            if (filters.limit) params.append('limit', filters.limit);
            if (filters.page) params.append('page', filters.page);

            const url = `${this.baseURL}/events/search/${encodeURIComponent(query)}${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to search events');
            }

            return data;
        } catch (error) {
            console.error('Error searching events:', error);
            throw error;
        }
    }

    // Format event data for display
    formatEventForDisplay(event) {
        const startDate = new Date(event.startDate);
        const formattedDate = startDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        }).toUpperCase();
        
        const formattedTime = startDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const location = event.location?.address?.city || event.location?.venue || 'Online Event';
        const price = event.isFree ? 'Free' : (event.ticketTypes?.[0]?.price ? 
            `From $${event.ticketTypes[0].price}` : 'Price TBA');

        return {
            id: event.id,
            title: event.title,
            date: `${formattedDate} • ${formattedTime}`,
            location: `📍 ${location}`,
            price: price,
            image: event.primaryImage || this.getPlaceholderImage(event.category),
            category: event.category,
            organizer: event.organizerName || 'Event Organizer'
        };
    }

    // Get placeholder image based on category
    getPlaceholderImage(category) {
        const gradients = {
            'Music': 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
            'Food': 'linear-gradient(45deg, #a8edea, #fed6e3)',
            'Business': 'linear-gradient(45deg, #ffecd2, #fcb69f)',
            'Arts': 'linear-gradient(45deg, #667eea, #764ba2)',
            'Sports': 'linear-gradient(45deg, #4facfe, #00f2fe)',
            'Education': 'linear-gradient(45deg, #43e97b, #38f9d7)',
            'Technology': 'linear-gradient(45deg, #fa709a, #fee140)',
            'Health': 'linear-gradient(45deg, #a8caba, #5d4e75)',
            'Travel': 'linear-gradient(45deg, #89f7fe, #66a6ff)',
            'Other': 'linear-gradient(45deg, #f093fb, #f5576c)'
        };

        return gradients[category] || gradients['Other'];
    }

    // Create event card HTML
    createEventCardHTML(event) {
        const formattedEvent = this.formatEventForDisplay(event);
        
        const imageStyle = formattedEvent.image.startsWith('data:') || formattedEvent.image.startsWith('http') ?
            `background-image: url('${formattedEvent.image}'); background-size: cover; background-position: center;` :
            `background: ${formattedEvent.image};`;

        return `
            <div class="event-card" role="button" tabindex="0" data-event-id="${formattedEvent.id}">
                <div class="event-image" style="${imageStyle}"></div>
                <div class="event-details">
                    <div class="event-date">${formattedEvent.date}</div>
                    <h3 class="event-title">${formattedEvent.title}</h3>
                    <div class="event-location">${formattedEvent.location}</div>
                    <div class="event-price">${formattedEvent.price}</div>
                    <div class="event-organizer">by ${formattedEvent.organizer}</div>
                </div>
            </div>
        `;
    }

    // Load and display events in a container
    async loadEventsIntoContainer(containerId, filters = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`Container with ID '${containerId}' not found`);
                return;
            }

            // Show loading state
            container.innerHTML = '<div class="loading-message">Loading events...</div>';

            let eventsData;
            if (filters.category && filters.category !== 'all') {
                eventsData = await this.getEventsByCategory(filters.category, filters);
            } else {
                eventsData = await this.getEvents(filters);
            }

            const events = eventsData.events || [];

            if (events.length === 0) {
                container.innerHTML = `
                    <div class="no-events-message">
                        <p>No events found${filters.category ? ` for ${filters.category}` : ''}.</p>
                        <p>Check back later for new events!</p>
                    </div>
                `;
                return;
            }

            // Create and insert event cards
            container.innerHTML = events.map(event => this.createEventCardHTML(event)).join('');

            // Add click handlers to event cards
            this.addEventCardHandlers(container);

            return eventsData;
        } catch (error) {
            console.error('Error loading events:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        <p>Failed to load events. Please try again later.</p>
                        <button onclick="window.eventsAPI.loadEventsIntoContainer('${containerId}', ${JSON.stringify(filters).replace(/"/g, '&quot;')})">
                            Retry
                        </button>
                    </div>
                `;
            }
        }
    }

    // Add event handlers to event cards
    addEventCardHandlers(container) {
        const eventCards = container.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            const eventId = card.getAttribute('data-event-id');
            const eventTitle = card.querySelector('.event-title')?.textContent || 'Event';

            const handleClick = () => {
                // Show notification and navigate to event details
                if (window.showTopNotification) {
                    window.showTopNotification(`Opening ${eventTitle}...`, 'info');
                }
                
                // Navigate to event details page (you can implement this)
                // window.location.href = `event-details.html?id=${eventId}`;
                console.log('Navigate to event:', eventId);
            };

            card.addEventListener('click', handleClick);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            });
        });
    }
}

// Initialize and make globally available
window.eventsAPI = new EventsAPI();

// Search events by city function
function searchByCity(cityName) {
    const eventsGrid = document.getElementById('eventsGrid');
    if (eventsGrid && window.eventsAPI) {
        // Show loading state
        eventsGrid.innerHTML = `<div class="loading-message">Loading events in ${cityName}...</div>`;
        
        // Load events filtered by city
        window.eventsAPI.loadEventsIntoContainer('eventsGrid', { 
            city: cityName,
            limit: 20 
        });
        
        // Scroll to events section
        eventsGrid.scrollIntoView({ behavior: 'smooth' });
        
        // Update page title
        const sectionTitle = document.querySelector('.events-section .section-title');
        if (sectionTitle) {
            sectionTitle.textContent = `Events in ${cityName}`;
        }
    }
}

// Make searchByCity globally available
window.searchByCity = searchByCity;

// Auto-load events when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Load events into main events grid if it exists
    setTimeout(() => {
        const eventsGrid = document.getElementById('eventsGrid');
        if (eventsGrid) {
            window.eventsAPI.loadEventsIntoContainer('eventsGrid', { limit: 6 });
        }
    }, 1000); // Wait for config to load
});