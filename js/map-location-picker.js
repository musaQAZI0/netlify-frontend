// Map-Based Location Picker for Event Builder
class MapLocationPicker {
    constructor() {
        this.map = null;
        this.marker = null;
        this.selectedPlace = null;
        this.placesService = null;
        this.geocoder = null;
        this.isInitialized = false;
        this.callbacks = {
            onLocationSelected: null
        };
    }

    // Initialize the map-based location picker
    initialize(containerId = 'mapLocationPicker') {
        if (!window.google || !window.google.maps) {
            console.error('Google Maps API not loaded');
            return false;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Map container ${containerId} not found`);
            return false;
        }

        try {
            // Initialize map centered on user's location or default
            const defaultLocation = { lat: 40.7831, lng: -73.9712 }; // New York City

            this.map = new google.maps.Map(container, {
                zoom: 13,
                center: defaultLocation,
                mapTypeControl: false,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true,
                styles: this.getMapStyles()
            });

            // Initialize services
            this.placesService = new google.maps.places.PlacesService(this.map);
            this.geocoder = new google.maps.Geocoder();

            // Add click listener to map
            this.map.addListener('click', (event) => {
                this.handleMapClick(event);
            });

            // Try to get user's current location
            this.getUserLocation();

            this.isInitialized = true;
            console.log('Map Location Picker initialized successfully');
            return true;

        } catch (error) {
            console.error('Error initializing map:', error);
            return false;
        }
    }

    // Handle map click events
    async handleMapClick(event) {
        const latLng = event.latLng;
        const lat = latLng.lat();
        const lng = latLng.lng();

        // Update marker position
        this.updateMarker(latLng);

        // Get place information for the clicked location
        try {
            const placeInfo = await this.getPlaceInfo(lat, lng);
            this.selectedPlace = placeInfo;

            // Extract venue name and city
            const venueName = placeInfo.name || '';
            const city = placeInfo.city || '';

            console.log('Location selected:', {
                venueName,
                city,
                lat,
                lng,
                fullDetails: placeInfo
            });

            // Trigger callback if set
            if (this.callbacks.onLocationSelected) {
                this.callbacks.onLocationSelected({
                    venueName,
                    city,
                    lat,
                    lng,
                    address: placeInfo.address || '',
                    state: placeInfo.state || '',
                    country: placeInfo.country || '',
                    zipCode: placeInfo.zipCode || '',
                    placeId: placeInfo.placeId || '',
                    fullDetails: placeInfo
                });
            }

            // Update UI elements
            this.updateLocationDisplay(placeInfo);

        } catch (error) {
            console.error('Error getting place info:', error);
        }
    }

    // Get place information using Places API and Geocoding
    async getPlaceInfo(lat, lng) {
        return new Promise((resolve) => {
            const location = new google.maps.LatLng(lat, lng);

            // First try to find nearby places
            const request = {
                location: location,
                radius: 50, // 50 meters radius
                type: ['establishment']
            };

            this.placesService.nearbySearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                    // Found a nearby establishment
                    const place = results[0];
                    this.extractPlaceDetails(place.place_id, resolve);
                } else {
                    // No nearby establishment, use geocoding for address
                    this.geocodeLocation(location, resolve);
                }
            });
        });
    }

    // Extract detailed place information
    extractPlaceDetails(placeId, callback) {
        const request = {
            placeId: placeId,
            fields: [
                'name', 'formatted_address', 'address_components',
                'geometry', 'place_id', 'types', 'business_status'
            ]
        };

        this.placesService.getDetails(request, (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                const placeInfo = this.parseAddressComponents(place);
                placeInfo.name = place.name || '';
                placeInfo.placeId = place.place_id || '';
                placeInfo.types = place.types || [];
                placeInfo.businessStatus = place.business_status || '';
                callback(placeInfo);
            } else {
                // Fallback to geocoding
                this.geocodeLocation(place.geometry.location, callback);
            }
        });
    }

    // Use geocoding for location without establishment
    geocodeLocation(location, callback) {
        this.geocoder.geocode({ location: location }, (results, status) => {
            if (status === 'OK' && results[0]) {
                const result = results[0];
                const placeInfo = this.parseAddressComponents(result);
                placeInfo.name = ''; // No establishment name
                placeInfo.address = result.formatted_address || '';
                callback(placeInfo);
            } else {
                // Fallback with basic info
                callback({
                    name: '',
                    city: '',
                    state: '',
                    country: '',
                    zipCode: '',
                    address: '',
                    placeId: '',
                    lat: location.lat(),
                    lng: location.lng()
                });
            }
        });
    }

    // Parse address components from Google Places response
    parseAddressComponents(place) {
        const placeInfo = {
            name: '',
            address: '',
            city: '',
            state: '',
            country: '',
            zipCode: '',
            lat: 0,
            lng: 0
        };

        if (place.geometry && place.geometry.location) {
            placeInfo.lat = place.geometry.location.lat();
            placeInfo.lng = place.geometry.location.lng();
        }

        if (place.address_components) {
            place.address_components.forEach(component => {
                const types = component.types;

                if (types.includes('street_number')) {
                    placeInfo.streetNumber = component.long_name;
                } else if (types.includes('route')) {
                    placeInfo.streetName = component.long_name;
                } else if (types.includes('locality')) {
                    placeInfo.city = component.long_name;
                } else if (types.includes('administrative_area_level_1')) {
                    placeInfo.state = component.short_name;
                } else if (types.includes('country')) {
                    placeInfo.country = component.long_name;
                } else if (types.includes('postal_code')) {
                    placeInfo.zipCode = component.long_name;
                }
            });

            // Construct full address
            const addressParts = [];
            if (placeInfo.streetNumber) addressParts.push(placeInfo.streetNumber);
            if (placeInfo.streetName) addressParts.push(placeInfo.streetName);
            placeInfo.address = addressParts.join(' ');
        }

        return placeInfo;
    }

    // Update marker position
    updateMarker(position) {
        if (this.marker) {
            this.marker.setPosition(position);
        } else {
            this.marker = new google.maps.Marker({
                position: position,
                map: this.map,
                draggable: true,
                title: 'Selected Location',
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: '#4285F4',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2
                }
            });

            // Add drag listener to marker
            this.marker.addListener('dragend', (event) => {
                this.handleMapClick(event);
            });
        }
    }

    // Get user's current location
    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    this.map.setCenter(userLocation);
                    console.log('Centered map on user location:', userLocation);
                },
                (error) => {
                    console.log('Could not get user location:', error);
                }
            );
        }
    }

    // Update location display in UI
    updateLocationDisplay(placeInfo) {
        // Update location info display
        const locationDisplay = document.getElementById('selectedLocationDisplay');
        if (locationDisplay) {
            let displayText = '';
            if (placeInfo.name) {
                displayText = `${placeInfo.name}`;
                if (placeInfo.city) {
                    displayText += ` - ${placeInfo.city}`;
                }
            } else if (placeInfo.city) {
                displayText = placeInfo.city;
            } else if (placeInfo.address) {
                displayText = placeInfo.address;
            }

            locationDisplay.innerHTML = `
                <div class="selected-location">
                    <strong>Selected Location:</strong>
                    <div class="location-details">
                        ${placeInfo.name ? `<div class="venue-name">${placeInfo.name}</div>` : ''}
                        <div class="location-address">
                            ${placeInfo.address || ''}
                            ${placeInfo.city ? `, ${placeInfo.city}` : ''}
                            ${placeInfo.state ? `, ${placeInfo.state}` : ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Set callback for location selection
    onLocationSelected(callback) {
        this.callbacks.onLocationSelected = callback;
    }

    // Get currently selected place
    getSelectedPlace() {
        return this.selectedPlace;
    }

    // Center map on specific location
    centerMap(lat, lng, zoom = 15) {
        if (this.map) {
            this.map.setCenter({ lat, lng });
            this.map.setZoom(zoom);
        }
    }

    // Search for places by text
    searchPlace(query) {
        if (!this.placesService) return;

        const request = {
            query: query,
            fields: ['name', 'geometry', 'formatted_address', 'place_id']
        };

        this.placesService.textSearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
                const place = results[0];
                const location = place.geometry.location;

                this.centerMap(location.lat(), location.lng());
                this.updateMarker(location);

                // Trigger click event to get full details
                this.handleMapClick({ latLng: location });
            }
        });
    }

    // Custom map styles
    getMapStyles() {
        return [
            {
                featureType: 'poi',
                elementType: 'labels.text',
                stylers: [{ visibility: 'on' }]
            },
            {
                featureType: 'poi.business',
                stylers: [{ visibility: 'on' }]
            }
        ];
    }

    // Show/hide the map
    show() {
        const container = document.getElementById('mapLocationPicker');
        if (container) {
            container.style.display = 'block';
            // Trigger resize event to ensure map renders correctly
            setTimeout(() => {
                if (this.map) {
                    google.maps.event.trigger(this.map, 'resize');
                }
            }, 100);
        }
    }

    hide() {
        const container = document.getElementById('mapLocationPicker');
        if (container) {
            container.style.display = 'none';
        }
    }
}

// Export for use in other modules
window.MapLocationPicker = MapLocationPicker;

// Initialize global instance
window.mapLocationPicker = null;

// Auto-initialize when Google Maps is ready
function initMapLocationPicker() {
    if (window.google && window.google.maps) {
        window.mapLocationPicker = new MapLocationPicker();
        console.log('Map Location Picker ready for initialization');
    }
}

// Check if Google Maps is already loaded
if (window.google && window.google.maps) {
    initMapLocationPicker();
} else {
    // Wait for Google Maps to load
    window.addEventListener('load', initMapLocationPicker);
}