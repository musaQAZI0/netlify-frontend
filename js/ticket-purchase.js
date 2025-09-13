// Ticket Purchase System
class TicketPurchaseSystem {
    constructor() {
        this.eventId = this.getEventIdFromURL();
        this.eventData = null;
        this.selectedTickets = {};
        this.currentStep = 1;
        this.orderData = {
            items: [],
            buyerProfile: {},
            billingAddress: {},
            attendeesInfo: []
        };
        
        this.init();
    }

    // Initialize the system
    init() {
        console.log('Initializing ticket purchase for event:', this.eventId);
        
        if (!this.eventId) {
            this.showError('Invalid event ID. Please select an event first.');
            return;
        }

        this.loadEventData();
        this.setupEventListeners();
    }

    // Get event ID from URL parameters
    getEventIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('eventId') || urlParams.get('id');
    }

    // Load event data from API
    async loadEventData() {
        try {
            this.showLoading('Loading event details...');
            
            const response = await fetch(`${window.Config.API_BASE_URL}/events/${this.eventId}`);
            
            if (!response.ok) {
                throw new Error('Failed to load event data');
            }
            
            const data = await response.json();
            
            if (data.success && data.event) {
                this.eventData = data.event;
                this.renderEventHeader();
                this.renderEventPreview();
                this.renderTicketTypes();
            } else {
                throw new Error(data.message || 'Event not found');
            }
            
        } catch (error) {
            console.error('Error loading event data:', error);
            this.showError('Failed to load event details. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Render event header
    renderEventHeader() {
        const header = document.getElementById('eventHeader');
        if (!header || !this.eventData) return;

        const startDate = new Date(this.eventData.startDate);
        
        header.innerHTML = `
            <div class=\"event-header-content\">
                <div class=\"event-image\" style=\"background-image: url('${this.eventData.primaryImage || this.eventData.imageUrl || ''}');\"></div>
                <div class=\"event-details\">
                    <h1>${this.eventData.title}</h1>
                    <div class=\"event-meta\">
                        <span>📅 ${startDate.toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                        <span>🕐 ${startDate.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                        })}</span>
                        <span>📍 ${this.eventData.location?.venue || this.eventData.venue || this.eventData.location || 'Location TBD'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Render event preview in sidebar
    renderEventPreview() {
        const preview = document.getElementById('eventPreview');
        if (!preview || !this.eventData) return;

        const startDate = new Date(this.eventData.startDate);
        
        preview.innerHTML = `
            <div class=\"preview-image\" style=\"background-image: url('${this.eventData.primaryImage || this.eventData.imageUrl || ''}');\"></div>
            <div class=\"preview-content\">
                <h3>${this.eventData.title}</h3>
                <div class=\"preview-meta\">
                    <div><strong>Date:</strong> ${startDate.toLocaleDateString()}</div>
                    <div><strong>Time:</strong> ${startDate.toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                    })}</div>
                    <div><strong>Location:</strong> ${this.eventData.location?.venue || this.eventData.venue || this.eventData.location || 'TBD'}</div>
                    <div><strong>Organizer:</strong> ${this.eventData.organizerName || this.eventData.organizer || 'Event Organizer'}</div>
                </div>
            </div>
        `;
    }

    // Render ticket types
    renderTicketTypes() {
        const container = document.getElementById('ticketTypes');
        if (!container || !this.eventData?.ticketTypes) return;

        container.innerHTML = this.eventData.ticketTypes
            .filter(ticket => ticket.isActive)
            .map(ticket => this.createTicketTypeHTML(ticket))
            .join('');
    }

    // Create HTML for a single ticket type
    createTicketTypeHTML(ticket) {
        const available = (ticket.quantity || 0) - (ticket.sold || 0);
        const selectedQuantity = this.selectedTickets[ticket._id] || 0;

        return `
            <div class=\"ticket-type\" data-ticket-id=\"${ticket._id}\">
                <div class=\"ticket-type-header\">
                    <div class=\"ticket-type-info\">
                        <h3>${ticket.name}</h3>
                        <div class=\"ticket-type-description\">${ticket.description || 'Standard ticket'}</div>
                    </div>
                    <div class=\"ticket-type-price\">
                        <div class=\"ticket-price\">
                            ${ticket.price > 0 ? `$${ticket.price.toFixed(2)}` : 'Free'}
                        </div>
                        <div class=\"ticket-price-label\">per ticket</div>
                    </div>
                </div>
                <div class=\"ticket-type-controls\">
                    <div class=\"ticket-quantity-control\">
                        <button type=\"button\" class=\"quantity-btn\" onclick=\"ticketPurchase.changeTicketQuantity('${ticket._id}', -1)\" ${selectedQuantity <= 0 ? 'disabled' : ''}>−</button>
                        <span class=\"quantity-display\">${selectedQuantity}</span>
                        <button type=\"button\" class=\"quantity-btn\" onclick=\"ticketPurchase.changeTicketQuantity('${ticket._id}', 1)\" ${selectedQuantity >= Math.min(available, ticket.maxPerOrder) ? 'disabled' : ''}>+</button>
                    </div>
                    <div class=\"ticket-availability\">
                        ${available > 0 ? `${available} available` : 'Sold out'}
                        ${ticket.maxPerOrder && ticket.maxPerOrder < available ? ` (max ${ticket.maxPerOrder} per order)` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Change ticket quantity
    changeTicketQuantity(ticketId, change) {
        const ticket = this.eventData.ticketTypes.find(t => t._id === ticketId);
        if (!ticket) return;

        const currentQuantity = this.selectedTickets[ticketId] || 0;
        const newQuantity = Math.max(0, currentQuantity + change);
        const available = (ticket.quantity || 0) - (ticket.sold || 0);
        const maxAllowed = Math.min(available, ticket.maxPerOrder);

        if (newQuantity <= maxAllowed) {
            if (newQuantity === 0) {
                delete this.selectedTickets[ticketId];
            } else {
                this.selectedTickets[ticketId] = newQuantity;
            }
            
            this.updateTicketDisplay(ticketId);
            this.updateOrderSummary();
        }
    }

    // Update ticket display
    updateTicketDisplay(ticketId) {
        const ticketElement = document.querySelector(`[data-ticket-id=\"${ticketId}\"]`);
        if (!ticketElement) return;

        const ticket = this.eventData.ticketTypes.find(t => t._id === ticketId);
        const selectedQuantity = this.selectedTickets[ticketId] || 0;
        const available = (ticket.quantity || 0) - (ticket.sold || 0);

        // Update quantity display
        const quantityDisplay = ticketElement.querySelector('.quantity-display');
        if (quantityDisplay) {
            quantityDisplay.textContent = selectedQuantity;
        }

        // Update buttons
        const decreaseBtn = ticketElement.querySelector('.quantity-btn:first-child');
        const increaseBtn = ticketElement.querySelector('.quantity-btn:last-child');
        
        if (decreaseBtn) {
            decreaseBtn.disabled = selectedQuantity <= 0;
        }
        
        if (increaseBtn) {
            increaseBtn.disabled = selectedQuantity >= Math.min(available, ticket.maxPerOrder);
        }

        // Update visual state
        if (selectedQuantity > 0) {
            ticketElement.classList.add('selected');
        } else {
            ticketElement.classList.remove('selected');
        }
    }

    // Update order summary
    updateOrderSummary() {
        const container = document.getElementById('orderSummary');
        if (!container) return;

        let subtotal = 0;
        let totalQuantity = 0;
        const items = [];

        Object.entries(this.selectedTickets).forEach(([ticketId, quantity]) => {
            const ticket = this.eventData.ticketTypes.find(t => t._id === ticketId);
            if (ticket && quantity > 0) {
                const itemTotal = ticket.price * quantity;
                subtotal += itemTotal;
                totalQuantity += quantity;
                
                items.push({
                    ticketTypeId: ticketId,
                    name: ticket.name,
                    price: ticket.price,
                    quantity: quantity,
                    total: itemTotal
                });
            }
        });

        const fees = subtotal * 0.029; // 2.9% processing fee
        const taxes = subtotal * 0.08; // 8% tax
        const total = subtotal + fees + taxes;

        // Store for later use
        this.orderData.items = items.map(item => ({
            ticketTypeId: item.ticketTypeId,
            quantity: item.quantity
        }));

        container.innerHTML = `
            <div class=\"summary-details\">
                ${items.map(item => `
                    <div class=\"summary-item\">
                        <span>${item.name} × ${item.quantity}</span>
                        <span>$${item.total.toFixed(2)}</span>
                    </div>
                `).join('')}
                <div class=\"summary-item\">
                    <span>Subtotal</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class=\"summary-item\">
                    <span>Processing Fee</span>
                    <span>$${fees.toFixed(2)}</span>
                </div>
                <div class=\"summary-item\">
                    <span>Taxes</span>
                    <span>$${taxes.toFixed(2)}</span>
                </div>
                <div class=\"summary-item summary-total\">
                    <span>Total</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }

    // Setup event listeners
    setupEventListeners() {
        // Payment method toggle
        const paymentMethods = document.querySelectorAll('input[name=\"paymentMethod\"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', () => {
                this.togglePaymentMethod(method.value);
            });
        });

        // Form validation
        const form = document.getElementById('purchaseForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }
    }

    // Toggle payment method
    togglePaymentMethod(method) {
        const cardSection = document.getElementById('cardPayment');
        if (cardSection) {
            cardSection.style.display = method === 'card' ? 'block' : 'none';
        }
    }

    // Go to specific step
    goToStep(stepNumber) {
        // Validate current step before proceeding
        if (stepNumber > this.currentStep && !this.validateCurrentStep()) {
            return;
        }

        // Update step classes
        document.querySelectorAll('.step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index + 1 < stepNumber) {
                step.classList.add('completed');
            } else if (index + 1 === stepNumber) {
                step.classList.add('active');
            }
        });

        // Update form step visibility
        document.querySelectorAll('.form-step').forEach((step, index) => {
            step.classList.remove('active');
            if (index + 1 === stepNumber) {
                step.classList.add('active');
            }
        });

        this.currentStep = stepNumber;

        // Perform step-specific actions
        if (stepNumber === 2) {
            this.generateAttendeeInfoForms();
        } else if (stepNumber === 3) {
            this.updateOrderSummary();
        }
    }

    // Validate current step
    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                // Check if at least one ticket is selected
                const totalSelected = Object.values(this.selectedTickets).reduce((sum, qty) => sum + qty, 0);
                if (totalSelected === 0) {
                    this.showError('Please select at least one ticket.');
                    return false;
                }
                return true;

            case 2:
                // Validate buyer information
                const requiredFields = ['buyerName', 'buyerEmail'];
                const missingFields = [];

                requiredFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (!field || !field.value.trim()) {
                        missingFields.push(fieldId.replace('buyer', '').toLowerCase());
                    }
                });

                if (missingFields.length > 0) {
                    this.showError(`Please fill in required fields: ${missingFields.join(', ')}`);
                    return false;
                }

                // Validate email format
                const email = document.getElementById('buyerEmail').value;
                if (!this.isValidEmail(email)) {
                    this.showError('Please enter a valid email address.');
                    return false;
                }

                return true;

            case 3:
                // Validate billing information
                const billingFields = ['billingStreet', 'billingCity', 'billingCountry', 'billingZip'];
                const paymentMethod = document.querySelector('input[name=\"paymentMethod\"]:checked')?.value;
                
                const missingBilling = [];
                billingFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (!field || !field.value.trim()) {
                        missingBilling.push(fieldId.replace('billing', '').toLowerCase());
                    }
                });

                if (missingBilling.length > 0) {
                    this.showError(`Please fill in billing address fields: ${missingBilling.join(', ')}`);
                    return false;
                }

                // Validate card details if card payment is selected
                if (paymentMethod === 'card') {
                    const cardFields = ['cardNumber', 'cardExpiry', 'cardCvc', 'cardName'];
                    const missingCard = [];

                    cardFields.forEach(fieldId => {
                        const field = document.getElementById(fieldId);
                        if (!field || !field.value.trim()) {
                            missingCard.push(fieldId.replace('card', '').toLowerCase());
                        }
                    });

                    if (missingCard.length > 0) {
                        this.showError(`Please fill in card details: ${missingCard.join(', ')}`);
                        return false;
                    }
                }

                return true;

            default:
                return true;
        }
    }

    // Generate attendee information forms
    generateAttendeeInfoForms() {
        const container = document.getElementById('attendeeInfo');
        if (!container) return;

        const forms = [];
        let attendeeNumber = 1;

        Object.entries(this.selectedTickets).forEach(([ticketId, quantity]) => {
            const ticket = this.eventData.ticketTypes.find(t => t._id === ticketId);
            if (!ticket) return;

            for (let i = 0; i < quantity; i++) {
                forms.push(this.createAttendeeForm(attendeeNumber, ticket, ticketId));
                attendeeNumber++;
            }
        });

        if (forms.length > 0) {
            container.innerHTML = `
                <h3>Attendee Details</h3>
                <p class=\"form-help\">Please provide information for each attendee. The first attendee will default to the buyer's information.</p>
                ${forms.join('')}
            `;
        } else {
            container.innerHTML = '';
        }
    }

    // Create attendee form HTML
    createAttendeeForm(number, ticket, ticketId) {
        return `
            <div class=\"attendee-form\">
                <h4>🎫 Attendee ${number} - ${ticket.name}</h4>
                <div class=\"form-row\">
                    <div class=\"form-group\">
                        <label for=\"attendeeName${number}\">Full Name *</label>
                        <input type=\"text\" id=\"attendeeName${number}\" name=\"attendeeName${number}\" data-ticket-id=\"${ticketId}\" required>
                    </div>
                    <div class=\"form-group\">
                        <label for=\"attendeeEmail${number}\">Email *</label>
                        <input type=\"email\" id=\"attendeeEmail${number}\" name=\"attendeeEmail${number}\" data-ticket-id=\"${ticketId}\" required>
                    </div>
                </div>
                <div class=\"form-row\">
                    <div class=\"form-group\">
                        <label for=\"attendeePhone${number}\">Phone</label>
                        <input type=\"tel\" id=\"attendeePhone${number}\" name=\"attendeePhone${number}\" data-ticket-id=\"${ticketId}\">
                    </div>
                    <div class=\"form-group\">
                        <label for=\"attendeeCompany${number}\">Company</label>
                        <input type=\"text\" id=\"attendeeCompany${number}\" name=\"attendeeCompany${number}\" data-ticket-id=\"${ticketId}\">
                    </div>
                </div>
            </div>
        `;
    }

    // Process payment and create order
    async processPayment() {
        try {
            this.showLoading('Processing your order...');

            // Collect all form data
            this.collectFormData();

            // Create the order via API
            const response = await fetch(`${window.Config.API_BASE_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthToken()
                },
                body: JSON.stringify({
                    eventId: this.eventId,
                    items: this.orderData.items,
                    buyerProfile: this.orderData.buyerProfile,
                    billingAddress: this.orderData.billingAddress,
                    attendeesInfo: this.orderData.attendeesInfo,
                    deliveryMethod: 'electronic'
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showOrderConfirmation(result.order, result.attendees);
                this.goToStep(4);
            } else {
                throw new Error(result.message || 'Order creation failed');
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            this.showError('Payment processing failed. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    // Collect form data
    collectFormData() {
        // Buyer information
        this.orderData.buyerProfile = {
            name: document.getElementById('buyerName')?.value || '',
            email: document.getElementById('buyerEmail')?.value || '',
            phone: document.getElementById('buyerPhone')?.value || ''
        };

        // Billing address
        this.orderData.billingAddress = {
            street: document.getElementById('billingStreet')?.value || '',
            city: document.getElementById('billingCity')?.value || '',
            state: document.getElementById('billingState')?.value || '',
            country: document.getElementById('billingCountry')?.value || '',
            postalCode: document.getElementById('billingZip')?.value || ''
        };

        // Attendee information
        this.orderData.attendeesInfo = [];
        const attendeeForms = document.querySelectorAll('.attendee-form');
        
        attendeeForms.forEach((form, index) => {
            const inputs = form.querySelectorAll('input[data-ticket-id]');
            if (inputs.length > 0) {
                const ticketId = inputs[0].getAttribute('data-ticket-id');
                const attendeeInfo = {
                    ticketTypeId: ticketId,
                    profile: {
                        name: form.querySelector('input[name^=\"attendeeName\"]')?.value || '',
                        email: form.querySelector('input[name^=\"attendeeEmail\"]')?.value || '',
                        phone: form.querySelector('input[name^=\"attendeePhone\"]')?.value || '',
                        company: form.querySelector('input[name^=\"attendeeCompany\"]')?.value || ''
                    }
                };
                this.orderData.attendeesInfo.push(attendeeInfo);
            }
        });
    }

    // Show order confirmation
    showOrderConfirmation(order, attendees) {
        const container = document.getElementById('confirmationDetails');
        if (!container) return;

        container.innerHTML = `
            <div class=\"order-info\">
                <h3>Order #${order.orderNumber}</h3>
                <p><strong>Event:</strong> ${this.eventData.title}</p>
                <p><strong>Date:</strong> ${new Date(this.eventData.startDate).toLocaleDateString()}</p>
                <p><strong>Total Paid:</strong> $${order.costs.total.toFixed(2)}</p>
                <p><strong>Tickets:</strong> ${order.totalQuantity}</p>
            </div>
            <div class=\"next-steps\">
                <h4>What's Next?</h4>
                <ul>
                    <li>✅ Confirmation email sent to ${order.buyerProfile?.email}</li>
                    <li>🎫 Electronic tickets available in your account</li>
                    <li>📱 Show tickets on your mobile device for entry</li>
                    <li>❓ Contact organizer if you have questions</li>
                </ul>
            </div>
        `;
    }

    // Utility functions
    getAuthToken() {
        return localStorage.getItem('authToken') || '';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        return emailRegex.test(email);
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.querySelector('p').textContent = message;
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showError(message) {
        if (typeof showTopNotification === 'function') {
            showTopNotification(message, 'error');
        } else {
            alert(message);
        }
    }

    showSuccess(message) {
        if (typeof showTopNotification === 'function') {
            showTopNotification(message, 'success');
        } else {
            alert(message);
        }
    }
}

// Global functions for template access
function goToStep(step) {
    if (window.ticketPurchase) {
        window.ticketPurchase.goToStep(step);
    }
}

function processPayment() {
    if (window.ticketPurchase) {
        window.ticketPurchase.processPayment();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ticketPurchase = new TicketPurchaseSystem();
});