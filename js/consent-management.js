// Photo/Video Consent Management System
// This module handles photo and video consent collection and management

class ConsentManagement {
    constructor() {
        this.consentTypes = {
            photo: {
                label: 'Photography',
                description: 'Photos taken during the event',
                icon: 'fas fa-camera',
                required: true
            },
            video: {
                label: 'Video Recording',
                description: 'Video recordings during the event',
                icon: 'fas fa-video',
                required: true
            },
            livestream: {
                label: 'Live Streaming',
                description: 'Live broadcast of event content',
                icon: 'fas fa-broadcast-tower',
                required: false
            },
            social: {
                label: 'Social Media',
                description: 'Sharing on social media platforms',
                icon: 'fas fa-share-alt',
                required: false
            },
            commercial: {
                label: 'Commercial Use',
                description: 'Use in promotional materials and advertising',
                icon: 'fas fa-bullhorn',
                required: false
            }
        };

        this.attendeeConsents = new Map();
        this.eventSettings = {};
        this.init();
    }

    init() {
        this.loadConsentData();
        this.loadEventSettings();
        this.injectStyles();
        this.setupEventListeners();
    }

    loadConsentData() {
        // Load consent data from localStorage or API
        const stored = localStorage.getItem('attendeeConsents');
        if (stored) {
            const data = JSON.parse(stored);
            this.attendeeConsents = new Map(data);
        }
    }

    loadEventSettings() {
        // Load event consent settings
        const stored = localStorage.getItem('eventConsentSettings');
        if (stored) {
            this.eventSettings = JSON.parse(stored);
        } else {
            // Default settings
            this.eventSettings = {
                requireConsent: true,
                consentReminders: true,
                allowOptOut: true,
                autoRequestConsent: true,
                reminderFrequency: 'event-start'
            };
        }
    }

    saveConsentData() {
        localStorage.setItem('attendeeConsents', JSON.stringify([...this.attendeeConsents]));
    }

    saveEventSettings() {
        localStorage.setItem('eventConsentSettings', JSON.stringify(this.eventSettings));
    }

    setupEventListeners() {
        // Listen for consent form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.matches('.consent-form')) {
                e.preventDefault();
                this.handleConsentSubmission(e.target);
            }
        });

        // Listen for consent setting changes
        document.addEventListener('change', (e) => {
            if (e.target.matches('.consent-setting')) {
                this.updateConsentSettings();
            }
        });
    }

    // Show consent request to attendee
    showConsentRequest(attendeeId, eventId, options = {}) {
        const modal = this.createConsentModal(attendeeId, eventId, options);
        document.body.appendChild(modal);

        // Show modal
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }, 10);

        return new Promise((resolve) => {
            modal.addEventListener('consentSubmitted', (e) => {
                resolve(e.detail);
            });
        });
    }

    createConsentModal(attendeeId, eventId, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'consent-modal';

        const eventName = options.eventName || 'this event';
        const organizer = options.organizer || 'the event organizer';

        modal.innerHTML = `
            <div class="consent-modal-content">
                <div class="consent-modal-header">
                    <div class="consent-icon">
                        <i class="fas fa-camera"></i>
                    </div>
                    <h3>Photo & Video Consent</h3>
                    <p class="consent-subtitle">Help us create memories while respecting your privacy</p>
                </div>

                <div class="consent-modal-body">
                    <div class="consent-intro">
                        <p>
                            <strong>${organizer}</strong> would like to capture photos and videos during
                            <strong>${eventName}</strong>. Please let us know what you're comfortable with.
                        </p>
                    </div>

                    <form class="consent-form" data-attendee-id="${attendeeId}" data-event-id="${eventId}">
                        <div class="consent-options">
                            ${Object.entries(this.consentTypes).map(([type, config]) => `
                                <div class="consent-option">
                                    <div class="consent-option-header">
                                        <label class="consent-checkbox">
                                            <input type="checkbox" name="consent_${type}" value="${type}"
                                                   ${config.required ? 'required' : ''}>
                                            <span class="checkmark"></span>
                                            <div class="consent-option-info">
                                                <div class="consent-option-title">
                                                    <i class="${config.icon}"></i>
                                                    ${config.label}
                                                    ${config.required ? '<span class="required-badge">Required</span>' : ''}
                                                </div>
                                                <div class="consent-option-description">${config.description}</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="consent-details">
                            <div class="consent-accordion">
                                <button type="button" class="accordion-toggle" onclick="this.parentElement.classList.toggle('expanded')">
                                    <span>What this means</span>
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                <div class="accordion-content">
                                    <div class="consent-explanation">
                                        <h4>Your rights:</h4>
                                        <ul>
                                            <li>You can change your mind at any time during the event</li>
                                            <li>You can request removal of content featuring you</li>
                                            <li>Your choices are confidential and won't affect your event experience</li>
                                            <li>You'll receive a copy of your consent preferences</li>
                                        </ul>

                                        <h4>How we use this content:</h4>
                                        <ul>
                                            <li><strong>Photography:</strong> Event documentation, future promotion</li>
                                            <li><strong>Video:</strong> Highlights reel, testimonials</li>
                                            <li><strong>Social Media:</strong> Instagram, Facebook, Twitter posts</li>
                                            <li><strong>Commercial:</strong> Marketing materials, website content</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="consent-additional">
                            <label class="consent-textarea-label">
                                Additional preferences or restrictions (optional):
                                <textarea name="additional_notes" class="consent-textarea"
                                         placeholder="e.g., 'Please don't tag me on social media' or 'No close-up photos please'"></textarea>
                            </label>
                        </div>

                        <div class="consent-contact">
                            <label class="consent-checkbox">
                                <input type="checkbox" name="allow_contact" value="yes">
                                <span class="checkmark"></span>
                                <span>Allow the organizer to contact me about photos/videos from this event</span>
                            </label>
                        </div>

                        <div class="consent-modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.consent-modal').remove()">
                                Skip for now
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Save my preferences
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        return modal;
    }

    handleConsentSubmission(form) {
        const attendeeId = form.dataset.attendeeId;
        const eventId = form.dataset.eventId;
        const formData = new FormData(form);

        const consent = {
            attendeeId,
            eventId,
            timestamp: new Date().toISOString(),
            consents: {},
            additionalNotes: formData.get('additional_notes') || '',
            allowContact: formData.has('allow_contact')
        };

        // Process consent checkboxes
        Object.keys(this.consentTypes).forEach(type => {
            consent.consents[type] = formData.has(`consent_${type}`);
        });

        // Save consent
        this.attendeeConsents.set(attendeeId, consent);
        this.saveConsentData();

        // Close modal
        const modal = form.closest('.consent-modal');
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';

        setTimeout(() => {
            // Dispatch custom event
            const event = new CustomEvent('consentSubmitted', {
                detail: consent
            });
            modal.dispatchEvent(event);

            document.body.removeChild(modal);
        }, 300);

        // Show confirmation
        this.showConsentConfirmation(consent);

        // Send to API
        this.sendConsentToAPI(consent);
    }

    showConsentConfirmation(consent) {
        const notification = document.createElement('div');
        notification.className = 'consent-confirmation';

        const consentedTypes = Object.entries(consent.consents)
            .filter(([type, agreed]) => agreed)
            .map(([type]) => this.consentTypes[type].label);

        notification.innerHTML = `
            <div class="confirmation-content">
                <div class="confirmation-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="confirmation-text">
                    <h4>Preferences saved!</h4>
                    <p>You've agreed to: ${consentedTypes.join(', ') || 'No photography/video'}</p>
                    <small>You can change these anytime by speaking with event staff</small>
                </div>
                <button class="confirmation-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'all 0.3s ease',
            maxWidth: '350px'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 10000);
    }

    // Get consent status for an attendee
    getConsentStatus(attendeeId) {
        return this.attendeeConsents.get(attendeeId) || null;
    }

    // Check if attendee has consented to specific type
    hasConsented(attendeeId, consentType) {
        const consent = this.getConsentStatus(attendeeId);
        return consent?.consents[consentType] || false;
    }

    // Generate consent badge for attendee
    createConsentBadge(attendeeId, options = {}) {
        const consent = this.getConsentStatus(attendeeId);
        if (!consent) return null;

        const badge = document.createElement('div');
        badge.className = 'consent-badge';

        const consentedTypes = Object.entries(consent.consents)
            .filter(([type, agreed]) => agreed);

        if (consentedTypes.length === 0) {
            badge.className += ' no-consent';
            badge.innerHTML = `
                <i class="fas fa-camera-slash"></i>
                <span>No photos/video</span>
            `;
            badge.title = 'This person has not consented to photography or video';
        } else {
            badge.className += ' has-consent';
            badge.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>Consent given</span>
            `;
            badge.title = `Consented to: ${consentedTypes.map(([type]) => this.consentTypes[type].label).join(', ')}`;
        }

        if (options.clickable !== false) {
            badge.style.cursor = 'pointer';
            badge.addEventListener('click', () => {
                this.showConsentDetails(attendeeId);
            });
        }

        return badge;
    }

    showConsentDetails(attendeeId) {
        const consent = this.getConsentStatus(attendeeId);
        if (!consent) return;

        const modal = document.createElement('div');
        modal.className = 'consent-details-modal';

        modal.innerHTML = `
            <div class="consent-details-content">
                <div class="consent-details-header">
                    <h3>Consent Details</h3>
                    <button class="modal-close" onclick="this.closest('.consent-details-modal').remove()">&times;</button>
                </div>
                <div class="consent-details-body">
                    <div class="consent-summary">
                        <h4>Photography & Video Preferences</h4>
                        <div class="consent-status-list">
                            ${Object.entries(this.consentTypes).map(([type, config]) => `
                                <div class="consent-status-item ${consent.consents[type] ? 'agreed' : 'declined'}">
                                    <i class="${config.icon}"></i>
                                    <span class="consent-type">${config.label}</span>
                                    <span class="consent-status">
                                        <i class="fas fa-${consent.consents[type] ? 'check' : 'times'}"></i>
                                        ${consent.consents[type] ? 'Agreed' : 'Declined'}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    ${consent.additionalNotes ? `
                        <div class="additional-notes">
                            <h4>Additional Notes</h4>
                            <p>"${consent.additionalNotes}"</p>
                        </div>
                    ` : ''}

                    <div class="consent-metadata">
                        <div class="metadata-item">
                            <label>Consent given:</label>
                            <span>${new Date(consent.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="metadata-item">
                            <label>Contact allowed:</label>
                            <span>${consent.allowContact ? 'Yes' : 'No'}</span>
                        </div>
                    </div>

                    <div class="consent-actions">
                        <button class="btn btn-secondary" onclick="consentManager.requestConsentUpdate('${attendeeId}')">
                            Update preferences
                        </button>
                        <button class="btn btn-danger" onclick="consentManager.revokeConsent('${attendeeId}')">
                            Revoke all consent
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }, 10);
    }

    requestConsentUpdate(attendeeId) {
        // Close details modal
        document.querySelector('.consent-details-modal')?.remove();

        // Show consent form again
        this.showConsentRequest(attendeeId, 'current_event', {
            eventName: 'this event',
            organizer: 'Event Organizer'
        });
    }

    revokeConsent(attendeeId) {
        const confirmed = confirm(
            'Are you sure you want to revoke all photo and video consent? ' +
            'This will remove all permissions for this attendee.'
        );

        if (confirmed) {
            // Create revocation record
            const revocation = {
                attendeeId,
                eventId: 'current_event',
                timestamp: new Date().toISOString(),
                consents: Object.keys(this.consentTypes).reduce((acc, type) => {
                    acc[type] = false;
                    return acc;
                }, {}),
                additionalNotes: 'Consent revoked by user request',
                allowContact: false,
                revoked: true
            };

            this.attendeeConsents.set(attendeeId, revocation);
            this.saveConsentData();

            // Close modal
            document.querySelector('.consent-details-modal')?.remove();

            this.showNotification('Consent has been revoked for this attendee', 'success');
            this.sendConsentToAPI(revocation);
        }
    }

    // Batch consent management for organizers
    generateConsentReport(eventId) {
        const report = {
            eventId,
            generatedAt: new Date().toISOString(),
            totalAttendees: 0,
            consentStats: {},
            attendeeList: []
        };

        // Initialize stats
        Object.keys(this.consentTypes).forEach(type => {
            report.consentStats[type] = { agreed: 0, declined: 0 };
        });

        // Process all consents for this event
        this.attendeeConsents.forEach((consent, attendeeId) => {
            if (consent.eventId === eventId) {
                report.totalAttendees++;
                report.attendeeList.push({
                    attendeeId,
                    timestamp: consent.timestamp,
                    consents: consent.consents,
                    hasNotes: !!consent.additionalNotes,
                    allowContact: consent.allowContact
                });

                // Update stats
                Object.entries(consent.consents).forEach(([type, agreed]) => {
                    if (agreed) {
                        report.consentStats[type].agreed++;
                    } else {
                        report.consentStats[type].declined++;
                    }
                });
            }
        });

        return report;
    }

    // Send consent reminders
    sendConsentReminder(attendeeId, reminderType = 'general') {
        // In a real app, this would send email/SMS
        console.log(`Sending ${reminderType} consent reminder to ${attendeeId}`);

        this.showNotification('Consent reminder sent', 'success');
    }

    updateConsentSettings() {
        const settings = {};

        // Collect all consent setting inputs
        document.querySelectorAll('.consent-setting').forEach(input => {
            if (input.type === 'checkbox') {
                settings[input.name] = input.checked;
            } else {
                settings[input.name] = input.value;
            }
        });

        Object.assign(this.eventSettings, settings);
        this.saveEventSettings();

        this.showNotification('Consent settings updated', 'success');
    }

    sendConsentToAPI(consent) {
        // In a real app, send to backend API
        console.log('Consent sent to API:', consent);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            opacity: '0',
            transform: 'translateY(-20px)',
            transition: 'all 0.3s ease'
        });

        if (type === 'success') {
            notification.style.background = '#48bb78';
        } else if (type === 'error') {
            notification.style.background = '#f56565';
        } else {
            notification.style.background = '#4299e1';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    injectStyles() {
        if (document.getElementById('consent-management-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'consent-management-styles';
        styles.textContent = `
            /* Consent Management Styles */
            .consent-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .consent-modal-content {
                background: white;
                border-radius: 20px;
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
            }

            .consent-modal-header {
                text-align: center;
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid #f7fafc;
            }

            .consent-icon {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #4299e1, #3182ce);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 1rem;
                color: white;
                font-size: 24px;
            }

            .consent-modal-header h3 {
                font-size: 24px;
                color: #2d3748;
                margin: 0 0 0.5rem;
            }

            .consent-subtitle {
                color: #718096;
                font-size: 16px;
                margin: 0;
            }

            .consent-modal-body {
                padding: 2rem;
            }

            .consent-intro {
                margin-bottom: 2rem;
                padding: 1rem;
                background: #f7fafc;
                border-radius: 8px;
                border-left: 4px solid #4299e1;
            }

            .consent-intro p {
                color: #4a5568;
                margin: 0;
                line-height: 1.6;
            }

            .consent-options {
                margin-bottom: 2rem;
            }

            .consent-option {
                margin-bottom: 1rem;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                padding: 1rem;
                transition: all 0.2s ease;
            }

            .consent-option:hover {
                border-color: #cbd5e0;
            }

            .consent-option:has(input:checked) {
                border-color: #4299e1;
                background: #ebf8ff;
            }

            .consent-checkbox {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                cursor: pointer;
                margin: 0;
            }

            .consent-checkbox input[type="checkbox"] {
                display: none;
            }

            .checkmark {
                width: 20px;
                height: 20px;
                border: 2px solid #cbd5e0;
                border-radius: 4px;
                position: relative;
                flex-shrink: 0;
                transition: all 0.2s ease;
                margin-top: 2px;
            }

            .consent-checkbox input:checked + .checkmark {
                background: #4299e1;
                border-color: #4299e1;
            }

            .consent-checkbox input:checked + .checkmark::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
                font-weight: bold;
            }

            .consent-option-info {
                flex: 1;
            }

            .consent-option-title {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 4px;
            }

            .consent-option-title i {
                color: #4299e1;
            }

            .required-badge {
                background: #fed7d7;
                color: #c53030;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .consent-option-description {
                color: #718096;
                font-size: 14px;
                margin: 0;
            }

            .consent-accordion {
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                overflow: hidden;
            }

            .accordion-toggle {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1rem;
                background: #f7fafc;
                border: none;
                cursor: pointer;
                font-weight: 500;
                color: #4a5568;
                transition: all 0.2s ease;
            }

            .accordion-toggle:hover {
                background: #edf2f7;
            }

            .accordion-toggle i {
                transition: transform 0.2s ease;
            }

            .consent-accordion.expanded .accordion-toggle i {
                transform: rotate(180deg);
            }

            .accordion-content {
                display: none;
                padding: 1rem;
                background: white;
            }

            .consent-accordion.expanded .accordion-content {
                display: block;
            }

            .consent-explanation h4 {
                color: #2d3748;
                margin: 0 0 0.5rem;
                font-size: 16px;
            }

            .consent-explanation ul {
                margin: 0 0 1.5rem;
                padding-left: 1.5rem;
                color: #4a5568;
            }

            .consent-explanation li {
                margin-bottom: 0.5rem;
                line-height: 1.5;
            }

            .consent-textarea-label {
                display: block;
                font-weight: 500;
                color: #2d3748;
                margin-bottom: 1rem;
            }

            .consent-textarea {
                width: 100%;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                min-height: 80px;
                margin-top: 0.5rem;
            }

            .consent-textarea:focus {
                outline: none;
                border-color: #4299e1;
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
            }

            .consent-contact {
                margin: 1.5rem 0;
                padding: 1rem;
                background: #f7fafc;
                border-radius: 8px;
            }

            .consent-modal-footer {
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                padding: 1rem 2rem 2rem;
            }

            .btn {
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                border: none;
                font-size: 14px;
            }

            .btn-secondary {
                background: #f7fafc;
                color: #4a5568;
                border: 1px solid #e2e8f0;
            }

            .btn-secondary:hover {
                background: #edf2f7;
            }

            .btn-primary {
                background: #4299e1;
                color: white;
            }

            .btn-primary:hover {
                background: #3182ce;
                transform: translateY(-1px);
            }

            .btn-danger {
                background: #f56565;
                color: white;
            }

            .btn-danger:hover {
                background: #e53e3e;
            }

            /* Consent Badge */
            .consent-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                margin: 2px;
                transition: all 0.2s ease;
            }

            .consent-badge.has-consent {
                background: #c6f6d5;
                color: #22543d;
            }

            .consent-badge.no-consent {
                background: #fed7d7;
                color: #742a2a;
            }

            .consent-badge:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            /* Consent Confirmation */
            .consent-confirmation {
                background: white;
                border-radius: 12px;
                padding: 1rem;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                border: 1px solid #e2e8f0;
            }

            .confirmation-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }

            .confirmation-icon {
                color: #48bb78;
                font-size: 20px;
                flex-shrink: 0;
                margin-top: 2px;
            }

            .confirmation-text h4 {
                color: #2d3748;
                margin: 0 0 4px;
                font-size: 16px;
            }

            .confirmation-text p {
                color: #4a5568;
                margin: 0 0 4px;
                font-size: 14px;
            }

            .confirmation-text small {
                color: #718096;
                font-size: 12px;
            }

            .confirmation-close {
                background: none;
                border: none;
                color: #718096;
                cursor: pointer;
                margin-left: auto;
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .confirmation-close:hover {
                background: #f7fafc;
                color: #2d3748;
            }

            /* Consent Details Modal */
            .consent-details-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                backdrop-filter: blur(4px);
                z-index: 9999;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }

            .consent-details-content {
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }

            .consent-details-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .consent-details-header h3 {
                font-size: 20px;
                color: #2d3748;
                margin: 0;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                color: #718096;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }

            .modal-close:hover {
                background: #f7fafc;
                color: #2d3748;
            }

            .consent-details-body {
                padding: 2rem;
            }

            .consent-summary h4 {
                color: #2d3748;
                margin-bottom: 1rem;
            }

            .consent-status-list {
                margin-bottom: 2rem;
            }

            .consent-status-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px;
                border-radius: 8px;
                margin-bottom: 8px;
            }

            .consent-status-item.agreed {
                background: #f0fff4;
                border: 1px solid #c6f6d5;
            }

            .consent-status-item.declined {
                background: #fff5f5;
                border: 1px solid #fed7d7;
            }

            .consent-status-item i:first-child {
                color: #4299e1;
            }

            .consent-type {
                flex: 1;
                font-weight: 500;
                color: #2d3748;
            }

            .consent-status {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 14px;
                font-weight: 500;
            }

            .consent-status-item.agreed .consent-status {
                color: #38a169;
            }

            .consent-status-item.declined .consent-status {
                color: #e53e3e;
            }

            .additional-notes {
                margin-bottom: 2rem;
                padding: 1rem;
                background: #f7fafc;
                border-radius: 8px;
            }

            .additional-notes h4 {
                color: #2d3748;
                margin-bottom: 0.5rem;
            }

            .additional-notes p {
                color: #4a5568;
                margin: 0;
                font-style: italic;
            }

            .consent-metadata {
                margin-bottom: 2rem;
            }

            .metadata-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f7fafc;
            }

            .metadata-item:last-child {
                border-bottom: none;
            }

            .metadata-item label {
                font-weight: 500;
                color: #4a5568;
            }

            .consent-actions {
                display: flex;
                gap: 12px;
            }

            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .consent-modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .consent-modal-header,
                .consent-modal-body {
                    padding: 1.5rem;
                }

                .consent-modal-footer {
                    padding: 1rem 1.5rem 1.5rem;
                    flex-direction: column;
                }

                .consent-actions {
                    flex-direction: column;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Static methods for easy integration
    static requestConsent(attendeeId, eventId, options = {}) {
        const instance = new ConsentManagement();
        return instance.showConsentRequest(attendeeId, eventId, options);
    }

    static addBadgeToElement(element, attendeeId, options = {}) {
        const instance = new ConsentManagement();
        const badge = instance.createConsentBadge(attendeeId, options);
        if (badge) {
            element.appendChild(badge);
        }
        return badge;
    }

    static hasConsented(attendeeId, consentType) {
        const instance = new ConsentManagement();
        return instance.hasConsented(attendeeId, consentType);
    }
}

// Initialize the system
let consentManager;
document.addEventListener('DOMContentLoaded', () => {
    consentManager = new ConsentManagement();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConsentManagement;
} else if (typeof window !== 'undefined') {
    window.ConsentManagement = ConsentManagement;
}