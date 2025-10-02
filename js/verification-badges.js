// Verification Badges System
// This module handles displaying and managing verification badges across the platform

class VerificationBadges {
    constructor() {
        this.badgeTypes = {
            identity: {
                icon: 'fas fa-id-card',
                text: 'ID Verified',
                color: '#48bb78',
                bgColor: '#c6f6d5',
                priority: 1
            },
            business: {
                icon: 'fas fa-building',
                text: 'Business Verified',
                color: '#4299e1',
                bgColor: '#bee3f8',
                priority: 2
            },
            background: {
                icon: 'fas fa-shield-check',
                text: 'Background Checked',
                color: '#805ad5',
                bgColor: '#e9d8fd',
                priority: 3
            },
            social: {
                icon: 'fas fa-share-alt',
                text: 'Social Verified',
                color: '#ed8936',
                bgColor: '#fbd38d',
                priority: 4
            },
            trusted: {
                icon: 'fas fa-certificate',
                text: 'Trusted Host',
                color: '#f56565',
                bgColor: '#fed7d7',
                priority: 5
            }
        };

        this.init();
    }

    init() {
        this.loadUserVerifications();
        this.injectBadgeStyles();
    }

    loadUserVerifications() {
        // In a real app, this would fetch from an API
        this.userVerifications = this.getUserVerifications();
    }

    getUserVerifications(userId = null) {
        // Mock data - in real app, fetch from API
        const mockVerifications = {
            identity: { verified: true, verifiedAt: '2024-01-15' },
            business: { verified: false, pending: true },
            background: { verified: false, pending: false },
            social: { verified: true, verifiedAt: '2024-02-01' },
            trusted: { verified: true, verifiedAt: '2024-03-01', level: 'gold' }
        };

        return mockVerifications;
    }

    createBadge(badgeType, options = {}) {
        if (!this.badgeTypes[badgeType]) {
            console.warn(`Unknown badge type: ${badgeType}`);
            return null;
        }

        const verification = this.userVerifications[badgeType];
        if (!verification?.verified) {
            return null;
        }

        const badge = this.badgeTypes[badgeType];
        const badgeElement = document.createElement('span');
        badgeElement.className = `verification-badge ${badgeType}-badge`;

        // Set style based on size option
        const size = options.size || 'normal';
        const sizeClass = size === 'small' ? 'badge-sm' : size === 'large' ? 'badge-lg' : '';
        if (sizeClass) badgeElement.classList.add(sizeClass);

        // Create badge content
        badgeElement.innerHTML = `
            <i class="${badge.icon}"></i>
            ${options.showText !== false ? `<span>${badge.text}</span>` : ''}
        `;

        // Add tooltip if requested
        if (options.tooltip !== false) {
            badgeElement.title = this.getBadgeTooltip(badgeType, verification);
        }

        // Add click handler for details
        if (options.clickable !== false) {
            badgeElement.addEventListener('click', () => {
                this.showBadgeDetails(badgeType, verification);
            });
            badgeElement.style.cursor = 'pointer';
        }

        return badgeElement;
    }

    createBadgeGroup(badgeTypes, options = {}) {
        const group = document.createElement('div');
        group.className = 'verification-badge-group';

        // Sort badges by priority
        const sortedTypes = badgeTypes
            .filter(type => this.userVerifications[type]?.verified)
            .sort((a, b) => this.badgeTypes[a].priority - this.badgeTypes[b].priority);

        // Limit number of badges if specified
        const maxBadges = options.maxBadges || sortedTypes.length;
        const visibleTypes = sortedTypes.slice(0, maxBadges);

        visibleTypes.forEach(badgeType => {
            const badge = this.createBadge(badgeType, options);
            if (badge) {
                group.appendChild(badge);
            }
        });

        // Add "more" indicator if there are hidden badges
        if (sortedTypes.length > maxBadges) {
            const moreIndicator = document.createElement('span');
            moreIndicator.className = 'verification-badge more-badge';
            moreIndicator.innerHTML = `+${sortedTypes.length - maxBadges}`;
            moreIndicator.title = `${sortedTypes.length - maxBadges} more verification${sortedTypes.length - maxBadges > 1 ? 's' : ''}`;
            group.appendChild(moreIndicator);
        }

        return group;
    }

    getBadgeTooltip(badgeType, verification) {
        const badge = this.badgeTypes[badgeType];
        const verifiedDate = new Date(verification.verifiedAt).toLocaleDateString();

        return `${badge.text} - Verified on ${verifiedDate}`;
    }

    showBadgeDetails(badgeType, verification) {
        const badge = this.badgeTypes[badgeType];
        const modal = this.createDetailsModal(badgeType, badge, verification);
        document.body.appendChild(modal);

        // Show modal
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }, 10);
    }

    createDetailsModal(badgeType, badge, verification) {
        const modal = document.createElement('div');
        modal.className = 'verification-modal';

        modal.innerHTML = `
            <div class="verification-modal-content">
                <div class="verification-modal-header">
                    <div class="verification-modal-badge">
                        <i class="${badge.icon}"></i>
                        <h3>${badge.text}</h3>
                    </div>
                    <button class="verification-modal-close">&times;</button>
                </div>
                <div class="verification-modal-body">
                    <div class="verification-details">
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-verified">
                                <i class="fas fa-check-circle"></i>
                                Verified
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Verified Date:</label>
                            <span>${new Date(verification.verifiedAt).toLocaleDateString()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Verification Level:</label>
                            <span class="level-${verification.level || 'standard'}">${(verification.level || 'standard').toUpperCase()}</span>
                        </div>
                    </div>
                    <div class="verification-benefits">
                        <h4>Benefits:</h4>
                        <ul>
                            ${this.getBenefitsList(badgeType).map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
        `;

        // Add close event
        modal.querySelector('.verification-modal-close').addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.querySelector('.verification-modal-close').click();
            }
        });

        return modal;
    }

    getBenefitsList(badgeType) {
        const benefits = {
            identity: [
                'Increased trust from event attendees',
                'Higher visibility in search results',
                'Access to premium event features'
            ],
            business: [
                'Business account features',
                'Tax reporting tools',
                'Corporate event hosting'
            ],
            background: [
                'Host sensitive events',
                'Premium safety badge',
                'Enhanced attendee confidence'
            ],
            social: [
                'Social media integration',
                'Cross-platform promotion',
                'Verified social presence'
            ],
            trusted: [
                'Top-tier host status',
                'Priority customer support',
                'Featured event placement',
                'Advanced analytics access'
            ]
        };

        return benefits[badgeType] || ['Enhanced credibility and trust'];
    }

    // Auto-inject badges into common selectors
    autoInjectBadges() {
        const isMobile = window.innerWidth <= 768;

        // Inject into user profile areas
        document.querySelectorAll('.user-profile, .host-info, .organizer-card').forEach(element => {
            if (!element.querySelector('.verification-badge-group')) {
                const badgeGroup = this.createBadgeGroup(['identity', 'business', 'trusted'], {
                    size: 'small',
                    maxBadges: 3
                });
                element.appendChild(badgeGroup);

                // On mobile, fade out and remove after 3 seconds
                if (isMobile) {
                    setTimeout(() => {
                        badgeGroup.style.transition = 'opacity 0.5s ease-out';
                        badgeGroup.style.opacity = '0';
                        setTimeout(() => {
                            badgeGroup.remove();
                        }, 500);
                    }, 3000);
                }
            }
        });

        // Inject into event cards
        document.querySelectorAll('.event-card .organizer-info').forEach(element => {
            if (!element.querySelector('.verification-badge')) {
                const trustedBadge = this.createBadge('trusted', {
                    size: 'small',
                    showText: false
                });
                if (trustedBadge) {
                    element.appendChild(trustedBadge);

                    // On mobile, fade out and remove after 3 seconds
                    if (isMobile) {
                        setTimeout(() => {
                            trustedBadge.style.transition = 'opacity 0.5s ease-out';
                            trustedBadge.style.opacity = '0';
                            setTimeout(() => {
                                trustedBadge.remove();
                            }, 500);
                        }, 3000);
                    }
                }
            }
        });
    }

    injectBadgeStyles() {
        if (document.getElementById('verification-badge-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'verification-badge-styles';
        styles.textContent = `
            /* Verification Badge Styles */
            .verification-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                color: #2d3748;
                background: #e2e8f0;
                margin: 2px;
                transition: all 0.2s ease;
                white-space: nowrap;
            }

            .verification-badge:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }

            .verification-badge i {
                font-size: 10px;
            }

            .verification-badge.badge-sm {
                padding: 2px 6px;
                font-size: 10px;
                border-radius: 8px;
            }

            .verification-badge.badge-lg {
                padding: 6px 12px;
                font-size: 14px;
                border-radius: 16px;
            }

            .verification-badge.badge-lg i {
                font-size: 12px;
            }

            /* Badge-specific colors */
            .identity-badge {
                background: #c6f6d5;
                color: #22543d;
            }

            .business-badge {
                background: #bee3f8;
                color: #1a365d;
            }

            .background-badge {
                background: #e9d8fd;
                color: #44337a;
            }

            .social-badge {
                background: #fbd38d;
                color: #7b341e;
            }

            .trusted-badge {
                background: linear-gradient(135deg, #f56565, #e53e3e);
                color: white;
                animation: pulse 2s infinite;
            }

            .more-badge {
                background: #cbd5e0;
                color: #4a5568;
                cursor: pointer;
            }

            /* Badge Group */
            .verification-badge-group {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 4px;
                margin: 4px 0;
            }

            /* Modal Styles */
            .verification-modal {
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
            }

            .verification-modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }

            .verification-modal-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .verification-modal-badge {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .verification-modal-badge i {
                font-size: 24px;
                color: #4299e1;
            }

            .verification-modal-badge h3 {
                font-size: 20px;
                color: #2d3748;
                margin: 0;
            }

            .verification-modal-close {
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

            .verification-modal-close:hover {
                background: #f7fafc;
                color: #2d3748;
            }

            .verification-modal-body {
                padding: 2rem;
            }

            .verification-details {
                margin-bottom: 2rem;
            }

            .detail-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f7fafc;
            }

            .detail-item:last-child {
                border-bottom: none;
            }

            .detail-item label {
                font-weight: 500;
                color: #4a5568;
            }

            .status-verified {
                display: flex;
                align-items: center;
                gap: 6px;
                color: #38a169;
                font-weight: 600;
            }

            .level-standard {
                background: #e2e8f0;
                color: #4a5568;
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
            }

            .level-gold {
                background: #fbd38d;
                color: #7b341e;
                padding: 2px 8px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
            }

            .verification-benefits h4 {
                color: #2d3748;
                margin-bottom: 1rem;
            }

            .verification-benefits ul {
                list-style: none;
                padding: 0;
            }

            .verification-benefits li {
                padding: 6px 0;
                color: #4a5568;
                position: relative;
                padding-left: 20px;
            }

            .verification-benefits li::before {
                content: '✓';
                position: absolute;
                left: 0;
                color: #38a169;
                font-weight: 600;
            }

            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }

            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .verification-modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .verification-modal-header,
                .verification-modal-body {
                    padding: 1.5rem;
                }

                .verification-badge-group {
                    justify-content: center;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Static methods for easy integration
    static addBadgesToElement(element, badgeTypes, options = {}) {
        const instance = new VerificationBadges();
        const badgeGroup = instance.createBadgeGroup(badgeTypes, options);
        element.appendChild(badgeGroup);
        return badgeGroup;
    }

    static addSingleBadge(element, badgeType, options = {}) {
        const instance = new VerificationBadges();
        const badge = instance.createBadge(badgeType, options);
        if (badge) {
            element.appendChild(badge);
        }
        return badge;
    }
}

// Initialize and auto-inject badges when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const verificationBadges = new VerificationBadges();

    // Auto-inject badges after a short delay to allow other scripts to load
    setTimeout(() => {
        verificationBadges.autoInjectBadges();
    }, 500);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VerificationBadges;
} else if (typeof window !== 'undefined') {
    window.VerificationBadges = VerificationBadges;
}