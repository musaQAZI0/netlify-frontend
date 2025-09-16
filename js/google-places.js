// Google Places API Integration for Event Builder
class GooglePlacesIntegration {
    constructor() {
        this.autocomplete = null;
        this.selectedPlace = null;
        this.isInitialized = false;
    }

    // Initialize Google Places Autocomplete
    initializePlacesAutocomplete() {
        const locationInput = document.getElementById('locationInput');
        
        if (!locationInput) {
            console.error('Location input element not found');
            return false;
        }

        if (!window.google) {
            console.error('Google Maps API not loaded');
            return false;
        }

        if (!window.google.maps.places) {
            console.error('Google Places API not available');
            return false;
        }

        console.log('Initializing Places Autocomplete for USA only...');

        try {
            // Use the new PlaceAutocompleteElement (recommended approach)
            if (google.maps.places.PlaceAutocompleteElement) {
                this.autocomplete = new google.maps.places.PlaceAutocompleteElement({
                    types: ['establishment', 'geocode'],
                    componentRestrictions: {
                        country: 'us'
                    }
                });

                // Replace the input with the new element
                locationInput.parentNode.replaceChild(this.autocomplete, locationInput);
            } else {
                // Fallback to legacy Autocomplete
                this.autocomplete = new google.maps.places.Autocomplete(locationInput, {
                    types: ['establishment', 'geocode'], // Both businesses and addresses
                    componentRestrictions: {
                        country: 'us' // USA only
                    },
                    fields: [
                        'place_id',
                        'name',
                        'formatted_address',
                        'address_components',
                        'geometry',
                        'types',
                        'business_status'
                    ]
                });
            }

            // Set additional options for better suggestions
            this.autocomplete.setOptions({
                strictBounds: false,
                types: ['establishment', 'geocode']
            });

            // Listen for place selection
            this.autocomplete.addListener('place_changed', () => {
                this.handlePlaceSelection();
            });

            // Add input event listener to debug autocomplete
            locationInput.addEventListener('input', (e) => {
                console.log('Location input changed:', e.target.value);
                if (e.target.value.length > 2) {
                    console.log('Autocomplete should be showing suggestions now...');
                    
                    // Manual test to see if service is working
                    this.testSuggestionsManually(e.target.value);
                }
            });

            // Force browser focus to ensure autocomplete works
            locationInput.addEventListener('focus', () => {
                console.log('Location input focused - autocomplete should be ready');
            });

            // Test autocomplete service directly
            this.testAutocompleteService(locationInput);

            console.log('Google Places Autocomplete initialized successfully for USA');
            this.isInitialized = true;
            return true;

        } catch (error) {
            console.error('Error initializing Google Places:', error);
            return false;
        }
    }

    // Test autocomplete service to debug issues
    testAutocompleteService(input) {
        try {
            // Use new AutocompleteSuggestion if available, fallback to legacy
            const service = google.maps.places.AutocompleteSuggestion ?
                new google.maps.places.AutocompleteSuggestion() :
                new google.maps.places.AutocompleteService();
            
            // Test with a sample query
            service.getPlacePredictions({
                input: 'New York',
                componentRestrictions: { country: 'us' },
                types: ['establishment', 'geocode']
            }, (predictions, status) => {
                console.log('Autocomplete service test:', status);
                if (status === google.maps.places.PlacesServiceStatus.OK) {
                    console.log('✅ Autocomplete service working. Sample predictions:', predictions.slice(0, 3));
                } else {
                    console.error('❌ Autocomplete service error:', status);
                    console.log('Common fixes:');
                    console.log('1. Enable "Places API (New)" in Google Cloud Console');
                    console.log('2. Enable "Places API" (legacy) in Google Cloud Console');
                    console.log('3. Check API key restrictions');
                }
            });
        } catch (error) {
            console.error('Error testing autocomplete service:', error);
        }
    }

    // Test suggestions manually for debugging
    testSuggestionsManually(inputText) {
        if (!window.google || !window.google.maps.places) {
            return;
        }

        try {
            // Use new AutocompleteSuggestion if available, fallback to legacy
            const service = google.maps.places.AutocompleteSuggestion ?
                new google.maps.places.AutocompleteSuggestion() :
                new google.maps.places.AutocompleteService();
            
            service.getPlacePredictions({
                input: inputText,
                componentRestrictions: { country: 'us' },
                types: ['establishment', 'geocode']
            }, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    console.log(`🔍 Manual test for "${inputText}":`, predictions.length, 'suggestions found');
                    console.log('Sample suggestions:', predictions.slice(0, 3).map(p => p.description));
                } else {
                    console.log(`❌ Manual test for "${inputText}": No suggestions (${status})`);
                }
            });
        } catch (error) {
            console.error('Error in manual suggestion test:', error);
        }
    }

    // Handle place selection from autocomplete
    handlePlaceSelection() {
        const place = this.autocomplete.getPlace();
        
        if (!place.geometry) {
            console.log('No location data available for this place');
            return;
        }

        console.log('Place selected:', place);
        this.selectedPlace = place;
        this.populateLocationFields(place);
        this.showLocationDetails();
        this.updateEventData(place);
    }

    // Populate location detail fields from place data
    populateLocationFields(place) {
        const addressComponents = place.address_components || [];
        const locationData = this.parseAddressComponents(addressComponents);

        // Populate form fields
        document.getElementById('venueName').value = place.name || '';
        document.getElementById('streetAddress').value = locationData.streetAddress || '';
        document.getElementById('cityName').value = locationData.city || '';
        document.getElementById('stateName').value = locationData.state || '';
        document.getElementById('zipCode').value = locationData.zipCode || '';
        document.getElementById('countryName').value = locationData.country || '';

        // Update main location input to show full address
        document.getElementById('locationInput').value = place.formatted_address || '';
    }

    // Parse Google Places address components
    parseAddressComponents(components) {
        const locationData = {
            streetNumber: '',
            streetName: '',
            streetAddress: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
        };

        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
                locationData.streetNumber = component.long_name;
            } else if (types.includes('route')) {
                locationData.streetName = component.long_name;
            } else if (types.includes('locality')) {
                locationData.city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
                locationData.state = component.short_name;
            } else if (types.includes('postal_code')) {
                locationData.zipCode = component.long_name;
            } else if (types.includes('country')) {
                locationData.country = component.long_name;
            }
        });

        // Combine street number and name
        if (locationData.streetNumber && locationData.streetName) {
            locationData.streetAddress = `${locationData.streetNumber} ${locationData.streetName}`;
        } else if (locationData.streetName) {
            locationData.streetAddress = locationData.streetName;
        }

        return locationData;
    }

    // Show the detailed location fields
    showLocationDetails() {
        const locationDetails = document.getElementById('locationDetails');
        if (locationDetails) {
            locationDetails.style.display = 'block';
        }
    }

    // Hide the detailed location fields
    hideLocationDetails() {
        const locationDetails = document.getElementById('locationDetails');
        if (locationDetails) {
            locationDetails.style.display = 'none';
        }
    }

    // Update event data with place information
    updateEventData(place) {
        if (window.eventBuilder && window.eventBuilder.api) {
            const api = window.eventBuilder.api;
            
            // Update location data
            api.currentEventData.venue = place.name || document.getElementById('venueName').value;
            api.currentEventData.city = document.getElementById('cityName').value;
            api.currentEventData.state = document.getElementById('stateName').value;
            api.currentEventData.country = document.getElementById('countryName').value;
            api.currentEventData.address = document.getElementById('streetAddress').value;
            api.currentEventData.zipCode = document.getElementById('zipCode').value;

            // Store coordinates if available
            if (place.geometry && place.geometry.location) {
                api.currentEventData.latitude = place.geometry.location.lat();
                api.currentEventData.longitude = place.geometry.location.lng();
                api.currentEventData.placeId = place.place_id;
            }

            // Trigger auto-save
            if (window.eventBuilder.scheduleAutoSave) {
                window.eventBuilder.scheduleAutoSave();
            }

            console.log('Event data updated with place information');
        }
    }

    // Manual location entry handler
    setupManualLocationEntry() {
        const locationInputs = [
            'venueName', 'streetAddress', 'cityName', 
            'stateName', 'zipCode', 'countryName'
        ];

        locationInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    this.handleManualLocationUpdate();
                });
            }
        });
    }

    // Handle manual location updates
    handleManualLocationUpdate() {
        if (window.eventBuilder && window.eventBuilder.api) {
            const api = window.eventBuilder.api;
            
            // Update event data with manual inputs
            api.currentEventData.venue = document.getElementById('venueName').value;
            api.currentEventData.city = document.getElementById('cityName').value;
            api.currentEventData.state = document.getElementById('stateName').value;
            api.currentEventData.country = document.getElementById('countryName').value;
            api.currentEventData.address = document.getElementById('streetAddress').value;
            api.currentEventData.zipCode = document.getElementById('zipCode').value;

            // Create formatted address
            const parts = [
                document.getElementById('streetAddress').value,
                document.getElementById('cityName').value,
                document.getElementById('stateName').value,
                document.getElementById('zipCode').value
            ].filter(part => part.trim());

            const formattedAddress = parts.join(', ');
            if (formattedAddress) {
                document.getElementById('locationInput').value = formattedAddress;
            }

            // Trigger auto-save
            if (window.eventBuilder.scheduleAutoSave) {
                window.eventBuilder.scheduleAutoSave();
            }
        }
    }

    // Get current location data
    getLocationData() {
        return {
            venue: document.getElementById('venueName').value,
            address: document.getElementById('streetAddress').value,
            city: document.getElementById('cityName').value,
            state: document.getElementById('stateName').value,
            zipCode: document.getElementById('zipCode').value,
            country: document.getElementById('countryName').value,
            formattedAddress: document.getElementById('locationInput').value,
            latitude: this.selectedPlace?.geometry?.location?.lat() || null,
            longitude: this.selectedPlace?.geometry?.location?.lng() || null,
            placeId: this.selectedPlace?.place_id || null
        };
    }

    // Load existing location data
    loadLocationData(locationData) {
        if (!locationData) return;

        document.getElementById('venueName').value = locationData.venue || '';
        document.getElementById('streetAddress').value = locationData.address || '';
        document.getElementById('cityName').value = locationData.city || '';
        document.getElementById('stateName').value = locationData.state || '';
        document.getElementById('zipCode').value = locationData.zipCode || '';
        document.getElementById('countryName').value = locationData.country || 'United States';
        document.getElementById('locationInput').value = locationData.formattedAddress || '';

        // Show location details if there's data
        if (locationData.venue || locationData.address || locationData.city) {
            this.showLocationDetails();
        }
    }
}

// Global instance
window.googlePlaces = new GooglePlacesIntegration();

// Global callback function for Google Maps API
function initGooglePlaces() {
    console.log('Google Places API loaded');
    
    // Wait a moment for DOM to be ready
    setTimeout(() => {
        if (window.googlePlaces) {
            const success = window.googlePlaces.initializePlacesAutocomplete();
            if (success) {
                window.googlePlaces.setupManualLocationEntry();
                console.log('Google Places integration ready');
            } else {
                console.log('Using fallback location input without autocomplete');
                // Still setup manual entry for fallback
                window.googlePlaces.setupManualLocationEntry();
            }
        }
    }, 500);
}

// Fallback if Google API fails to load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!window.google && window.googlePlaces) {
            console.log('Google Maps API not available, using manual location entry only');
            window.googlePlaces.setupManualLocationEntry();
        }
    }, 2000);
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GooglePlacesIntegration;
}