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

        // Additional safety checks
        if (!google || !google.maps || !google.maps.places) {
            console.error('Google Maps Places API not loaded properly');
            return false;
        }

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

            // Setup event listeners based on autocomplete type
            if (google.maps.places.PlaceAutocompleteElement && this.autocomplete instanceof google.maps.places.PlaceAutocompleteElement) {
                // New Places API - use addEventListener
                this.autocomplete.addEventListener('gmp-placeselect', (event) => {
                    console.log('New API place selected:', event.place);
                    this.handlePlaceSelection(event.place);
                });
            } else {
                // Legacy autocomplete
                // Set additional options for better suggestions
                if (this.autocomplete.setOptions) {
                    this.autocomplete.setOptions({
                        strictBounds: false,
                        types: ['establishment', 'geocode']
                    });
                }

                // Listen for place selection
                this.autocomplete.addListener('place_changed', () => {
                    this.handlePlaceSelection();
                });
            }

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

            // Setup auto-extraction from location input
            this.setupLocationInputAutoExtraction();

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
            // Always use AutocompleteService as it has getPlacePredictions method
            const service = new google.maps.places.AutocompleteService();

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
    handlePlaceSelection(placeFromNewAPI = null) {
        let place;

        if (placeFromNewAPI) {
            // New API passes place directly
            place = placeFromNewAPI;
        } else {
            // Legacy API - get place from autocomplete
            if (!this.autocomplete || !this.autocomplete.getPlace) {
                console.error('Autocomplete not properly initialized');
                return;
            }
            place = this.autocomplete.getPlace();
        }

        if (!place || !place.geometry) {
            console.log('No location data available for this place');
            return;
        }

        console.log('Place selected:', place);
        this.selectedPlace = place;
        this.populateLocationFields(place);
        this.showLocationDetails();
        this.updateEventData(place);
    }

    // Enhanced extraction from location input text
    extractVenueAndCityFromInput(inputText) {
        if (!inputText || inputText.trim().length < 3) {
            return { venueName: '', city: '' };
        }

        const text = inputText.trim();

        // Try to extract venue name and city from text patterns
        const extractedData = { venueName: '', city: '' };

        // Pattern 1: "Venue Name, City, State"
        const commaPattern = /^([^,]+),\s*([^,]+)(?:,\s*(.+))?$/;
        const commaMatch = text.match(commaPattern);

        if (commaMatch) {
            const [, potentialVenue, potentialCity, rest] = commaMatch;

            // If the first part looks like a venue (contains common venue words)
            const venueKeywords = ['hotel', 'restaurant', 'cafe', 'bar', 'center', 'hall', 'stadium',
                                   'theater', 'club', 'mall', 'park', 'building', 'plaza', 'square'];

            const hasVenueKeyword = venueKeywords.some(keyword =>
                potentialVenue.toLowerCase().includes(keyword)
            );

            if (hasVenueKeyword || potentialVenue.length > 10) {
                extractedData.venueName = potentialVenue.trim();
                extractedData.city = potentialCity.trim();
            } else {
                // First part might be a city, second part might be state
                extractedData.city = potentialVenue.trim();
            }
        }
        // Pattern 2: Just a city name or venue name
        else {
            // Check if it's likely a venue name (longer text with specific words)
            const venueIndicators = ['hotel', 'restaurant', 'cafe', 'bar', 'center', 'hall', 'stadium',
                                     'theater', 'club', 'mall', 'park', 'building', 'plaza', 'square',
                                     'conference', 'convention', 'arena', 'auditorium', 'gallery'];

            const hasVenueIndicator = venueIndicators.some(indicator =>
                text.toLowerCase().includes(indicator)
            );

            if (hasVenueIndicator) {
                extractedData.venueName = text;
            } else {
                // Might be a city name
                extractedData.city = text;
            }
        }

        console.log('Extracted from input:', { input: text, extracted: extractedData });
        return extractedData;
    }

    // Auto-extract venue/city when user types in location bar
    setupLocationInputAutoExtraction() {
        const locationInput = document.getElementById('locationInput');
        if (!locationInput) return;

        // Add input event listener for real-time extraction
        locationInput.addEventListener('input', (e) => {
            const inputText = e.target.value;

            // Extract venue and city from the input text
            const extracted = this.extractVenueAndCityFromInput(inputText);

            // Auto-populate venue and city fields if they're empty
            const venueField = document.getElementById('venueName');
            const cityField = document.getElementById('cityName');

            if (extracted.venueName && venueField && !venueField.value) {
                venueField.value = extracted.venueName;
                console.log('Auto-populated venue:', extracted.venueName);
            }

            if (extracted.city && cityField && !cityField.value) {
                cityField.value = extracted.city;
                console.log('Auto-populated city:', extracted.city);
            }

            // Show location details if we extracted something
            if (extracted.venueName || extracted.city) {
                this.showLocationDetails();
            }
        });

        // Also trigger on blur to catch final input
        locationInput.addEventListener('blur', (e) => {
            const inputText = e.target.value;
            if (inputText && inputText.length > 5) {
                // Try to get more detailed information using Places API
                this.searchPlaceByText(inputText);
            }
        });
    }

    // Search for place details using text search
    async searchPlaceByText(query) {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            return;
        }

        try {
            const service = new google.maps.places.PlacesService(document.createElement('div'));

            const request = {
                query: query,
                fields: ['name', 'formatted_address', 'address_components', 'geometry', 'place_id', 'types']
            };

            service.textSearch(request, (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
                    const place = results[0];
                    console.log('Found place via text search:', place);

                    // Extract venue name and city
                    const venueName = place.name || '';
                    const addressComponents = place.address_components || [];
                    const locationData = this.parseAddressComponents(addressComponents);

                    // Update fields if they're still empty
                    const venueField = document.getElementById('venueName');
                    const cityField = document.getElementById('cityName');

                    if (venueName && venueField && !venueField.value) {
                        venueField.value = venueName;
                        console.log('Text search populated venue:', venueName);
                    }

                    if (locationData.city && cityField && !cityField.value) {
                        cityField.value = locationData.city;
                        console.log('Text search populated city:', locationData.city);
                    }

                    // Store the place for reference
                    this.selectedPlace = place;
                    this.showLocationDetails();
                } else {
                    console.log('No places found for text search:', query);
                }
            });
        } catch (error) {
            console.error('Error in text search:', error);
        }
    }

    // Populate location detail fields from place data
    populateLocationFields(place) {
        const addressComponents = place.address_components || [];
        const locationData = this.parseAddressComponents(addressComponents);

        // Populate form fields with null checks
        const venueNameEl = document.getElementById('venueName');
        const streetAddressEl = document.getElementById('streetAddress');
        const cityNameEl = document.getElementById('cityName');
        const stateNameEl = document.getElementById('stateName');
        const zipCodeEl = document.getElementById('zipCode');
        const countryNameEl = document.getElementById('countryName');
        const locationInputEl = document.getElementById('locationInput');

        if (venueNameEl) venueNameEl.value = place.name || '';
        if (streetAddressEl) streetAddressEl.value = locationData.streetAddress || '';
        if (cityNameEl) cityNameEl.value = locationData.city || '';
        if (stateNameEl) stateNameEl.value = locationData.state || '';
        if (zipCodeEl) zipCodeEl.value = locationData.zipCode || '';
        if (countryNameEl) countryNameEl.value = locationData.country || '';
        if (locationInputEl) locationInputEl.value = place.formatted_address || '';
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

            const venueNameEl = document.getElementById('venueName');
            const cityNameEl = document.getElementById('cityName');
            const stateNameEl = document.getElementById('stateName');
            const countryNameEl = document.getElementById('countryName');
            const streetAddressEl = document.getElementById('streetAddress');
            const zipCodeEl = document.getElementById('zipCode');
            const locationInputEl = document.getElementById('locationInput');

            // Update event data with manual inputs (with null checks)
            if (venueNameEl) api.currentEventData.venue = venueNameEl.value;
            if (cityNameEl) api.currentEventData.city = cityNameEl.value;
            if (stateNameEl) api.currentEventData.state = stateNameEl.value;
            if (countryNameEl) api.currentEventData.country = countryNameEl.value;
            if (streetAddressEl) api.currentEventData.address = streetAddressEl.value;
            if (zipCodeEl) api.currentEventData.zipCode = zipCodeEl.value;

            // Create formatted address
            const parts = [
                streetAddressEl?.value || '',
                cityNameEl?.value || '',
                stateNameEl?.value || '',
                zipCodeEl?.value || ''
            ].filter(part => part.trim());

            const formattedAddress = parts.join(', ');
            if (formattedAddress && locationInputEl) {
                locationInputEl.value = formattedAddress;
            }

            // Trigger auto-save
            if (window.eventBuilder.scheduleAutoSave) {
                window.eventBuilder.scheduleAutoSave();
            }
        }
    }

    // Get current location data
    getLocationData() {
        const venueNameEl = document.getElementById('venueName');
        const streetAddressEl = document.getElementById('streetAddress');
        const cityNameEl = document.getElementById('cityName');
        const stateNameEl = document.getElementById('stateName');
        const zipCodeEl = document.getElementById('zipCode');
        const countryNameEl = document.getElementById('countryName');
        const locationInputEl = document.getElementById('locationInput');

        const locationData = {
            venue: venueNameEl?.value || '',
            address: streetAddressEl?.value || '',
            city: cityNameEl?.value || '',
            state: stateNameEl?.value || '',
            zipCode: zipCodeEl?.value || '',
            country: countryNameEl?.value || '',
            formattedAddress: locationInputEl?.value || '',
            latitude: this.selectedPlace?.geometry?.location?.lat() || null,
            longitude: this.selectedPlace?.geometry?.location?.lng() || null,
            placeId: this.selectedPlace?.place_id || null
        };

        // If venue or city is still empty, try to extract from location input
        if ((!locationData.venue || !locationData.city) && locationInputEl?.value) {
            const extracted = this.extractVenueAndCityFromInput(locationInputEl.value);

            if (!locationData.venue && extracted.venueName) {
                locationData.venue = extracted.venueName;
                console.log('Extracted venue from input:', extracted.venueName);
            }

            if (!locationData.city && extracted.city) {
                locationData.city = extracted.city;
                console.log('Extracted city from input:', extracted.city);
            }
        }

        return locationData;
    }

    // Public method to get venue and city names specifically
    getVenueAndCity() {
        const locationData = this.getLocationData();
        return {
            venueName: locationData.venue,
            city: locationData.city
        };
    }

    // Demo method showing how to extract venue and city as requested
    extractVenueAndCityExample() {
        // Extract venue name and city from location bar
        const selectedPlace = this.selectedPlace;
        const locationInput = document.getElementById('locationInput');

        if (selectedPlace) {
            // From Google Places selection
            const venueName = selectedPlace.name;
            const addressComponents = selectedPlace.address_components || [];
            const cityComponent = addressComponents.find(component =>
                component.types.includes('locality')
            );
            const city = cityComponent ? cityComponent.long_name : '';

            console.log('From Places selection:');
            console.log('const venueName =', venueName); // e.g., "Pearl Continental Hotel"
            console.log('const city =', city);           // e.g., "Lahore"

            return { venueName, city };
        } else if (locationInput?.value) {
            // From text input extraction
            const extracted = this.extractVenueAndCityFromInput(locationInput.value);

            console.log('From text input extraction:');
            console.log('const venueName =', extracted.venueName); // e.g., "Pearl Continental Hotel"
            console.log('const city =', extracted.city);           // e.g., "Lahore"

            return extracted;
        }

        return { venueName: '', city: '' };
    }

    // Load existing location data
    loadLocationData(locationData) {
        if (!locationData) return;

        const venueNameEl = document.getElementById('venueName');
        const streetAddressEl = document.getElementById('streetAddress');
        const cityNameEl = document.getElementById('cityName');
        const stateNameEl = document.getElementById('stateName');
        const zipCodeEl = document.getElementById('zipCode');
        const countryNameEl = document.getElementById('countryName');
        const locationInputEl = document.getElementById('locationInput');

        if (venueNameEl) venueNameEl.value = locationData.venue || '';
        if (streetAddressEl) streetAddressEl.value = locationData.address || '';
        if (cityNameEl) cityNameEl.value = locationData.city || '';
        if (stateNameEl) stateNameEl.value = locationData.state || '';
        if (zipCodeEl) zipCodeEl.value = locationData.zipCode || '';
        if (countryNameEl) countryNameEl.value = locationData.country || 'United States';
        if (locationInputEl) locationInputEl.value = locationData.formattedAddress || '';

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

// Global helper function to extract venue and city names as requested
window.extractVenueAndCity = function() {
    if (window.googlePlaces) {
        const result = window.googlePlaces.getVenueAndCity();

        // Output as requested in the original ask
        const venueName = result.venueName;
        const city = result.city;

        console.log('Extracted location data:');
        console.log('const venueName =', `"${venueName}"`); // e.g., "Pearl Continental Hotel"
        console.log('const city =', `"${city}"`);           // e.g., "Lahore"

        return { venueName, city };
    } else {
        console.error('Google Places not initialized');
        return { venueName: '', city: '' };
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GooglePlacesIntegration;
}