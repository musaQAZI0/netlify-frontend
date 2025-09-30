// Report & Block System
// This module handles reporting users and blocking functionality across the platform

class ReportBlockSystem {
    constructor() {
        this.reportTypes = {
            spam: {
                label: 'Spam',
                description: 'Unwanted promotional content or repetitive messages',
                severity: 'medium',
                icon: 'fas fa-ban'
            },
            harassment: {
                label: 'Harassment',
                description: 'Intimidating, threatening, or abusive behavior',
                severity: 'high',
                icon: 'fas fa-exclamation-triangle'
            },
            inappropriate: {
                label: 'Inappropriate Content',
                description: 'Content that violates community guidelines',
                severity: 'medium',
                icon: 'fas fa-flag'
            },
            fake: {
                label: 'Fake Profile',
                description: 'Profile appears to be impersonating someone else',
                severity: 'high',
                icon: 'fas fa-user-slash'
            },
            scam: {
                label: 'Scam/Fraud',
                description: 'Attempting to defraud users or steal information',
                severity: 'critical',
                icon: 'fas fa-shield-alt'
            },
            other: {
                label: 'Other',
                description: 'Other violation not listed above',
                severity: 'low',
                icon: 'fas fa-ellipsis-h'
            }
        };

        this.blockedUsers = new Set();
        this.reportHistory = [];
        this.init();
    }

    init() {
        this.loadBlockedUsers();
        this.loadReportHistory();
        this.injectStyles();
        this.setupEventListeners();
    }

    loadBlockedUsers() {
        // Load from localStorage or API
        const stored = localStorage.getItem('blockedUsers');
        if (stored) {
            this.blockedUsers = new Set(JSON.parse(stored));
        }
    }

    loadReportHistory() {
        // Load from localStorage or API
        const stored = localStorage.getItem('reportHistory');
        if (stored) {
            this.reportHistory = JSON.parse(stored);
        }
    }

    saveBlockedUsers() {
        localStorage.setItem('blockedUsers', JSON.stringify([...this.blockedUsers]));
    }

    saveReportHistory() {
        localStorage.setItem('reportHistory', JSON.stringify(this.reportHistory));
    }

    setupEventListeners() {
        // Listen for dynamically added report buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.report-user-btn, .report-user-btn *')) {
                const btn = e.target.closest('.report-user-btn');
                const userId = btn.dataset.userId;
                const userName = btn.dataset.userName || 'User';
                this.showReportModal(userId, userName);
            }

            if (e.target.matches('.block-user-btn, .block-user-btn *')) {
                const btn = e.target.closest('.block-user-btn');
                const userId = btn.dataset.userId;
                const userName = btn.dataset.userName || 'User';
                this.showBlockConfirmation(userId, userName);
            }
        });
    }

    // Add report/block buttons to user elements
    addReportBlockButtons(element, userId, userName, options = {}) {
        if (!element || !userId) return;

        // Don't add buttons if user is already blocked
        if (this.isUserBlocked(userId)) {
            this.addUnblockButton(element, userId, userName);
            return;
        }

        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'report-block-buttons';

        const style = options.style || 'default'; // default, minimal, dropdown

        if (style === 'dropdown') {
            buttonContainer.innerHTML = this.createDropdownButtons(userId, userName);
        } else if (style === 'minimal') {
            buttonContainer.innerHTML = this.createMinimalButtons(userId, userName);
        } else {
            buttonContainer.innerHTML = this.createDefaultButtons(userId, userName);
        }

        element.appendChild(buttonContainer);
        return buttonContainer;
    }

    createDefaultButtons(userId, userName) {
        return `
            <button class="report-user-btn" data-user-id="${userId}" data-user-name="${userName}" title="Report ${userName}">
                <i class="fas fa-flag"></i>
                <span>Report</span>
            </button>
            <button class="block-user-btn" data-user-id="${userId}" data-user-name="${userName}" title="Block ${userName}">
                <i class="fas fa-ban"></i>
                <span>Block</span>
            </button>
        `;
    }

    createMinimalButtons(userId, userName) {
        return `
            <button class="report-user-btn minimal" data-user-id="${userId}" data-user-name="${userName}" title="Report ${userName}">
                <i class="fas fa-flag"></i>
            </button>
            <button class="block-user-btn minimal" data-user-id="${userId}" data-user-name="${userName}" title="Block ${userName}">
                <i class="fas fa-ban"></i>
            </button>
        `;
    }

    createDropdownButtons(userId, userName) {
        return `
            <div class="user-actions-dropdown">
                <button class="dropdown-toggle" title="User Actions">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu">
                    <button class="dropdown-item report-user-btn" data-user-id="${userId}" data-user-name="${userName}">
                        <i class="fas fa-flag"></i>
                        Report User
                    </button>
                    <button class="dropdown-item block-user-btn" data-user-id="${userId}" data-user-name="${userName}">
                        <i class="fas fa-ban"></i>
                        Block User
                    </button>
                </div>
            </div>
        `;
    }

    addUnblockButton(element, userId, userName) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'report-block-buttons';
        buttonContainer.innerHTML = `
            <button class="unblock-user-btn" data-user-id="${userId}" data-user-name="${userName}" title="Unblock ${userName}">
                <i class="fas fa-unlock"></i>
                <span>Unblock</span>
            </button>
        `;

        // Add unblock event listener
        buttonContainer.querySelector('.unblock-user-btn').addEventListener('click', (e) => {
            this.showUnblockConfirmation(userId, userName);
        });

        element.appendChild(buttonContainer);
        return buttonContainer;
    }

    showReportModal(userId, userName) {
        const modal = this.createReportModal(userId, userName);
        document.body.appendChild(modal);

        // Show modal
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.visibility = 'visible';
        }, 10);
    }

    createReportModal(userId, userName) {
        const modal = document.createElement('div');
        modal.className = 'report-modal';

        modal.innerHTML = `
            <div class="report-modal-content">
                <div class="report-modal-header">
                    <h3>Report ${userName}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="report-modal-body">
                    <p class="report-description">
                        Help us understand what's happening. Your report will be reviewed by our safety team.
                    </p>

                    <div class="report-types">
                        <h4>What's the issue?</h4>
                        ${Object.entries(this.reportTypes).map(([type, config]) => `
                            <label class="report-type-option">
                                <input type="radio" name="reportType" value="${type}">
                                <div class="report-type-content">
                                    <div class="report-type-header">
                                        <i class="${config.icon}"></i>
                                        <span class="report-type-label">${config.label}</span>
                                        <span class="severity-badge ${config.severity}">${config.severity}</span>
                                    </div>
                                    <p class="report-type-description">${config.description}</p>
                                </div>
                            </label>
                        `).join('')}
                    </div>

                    <div class="report-details">
                        <h4>Additional Details (Optional)</h4>
                        <textarea class="report-details-input" placeholder="Provide more context about this issue..." rows="4"></textarea>
                    </div>

                    <div class="report-actions">
                        <label class="block-after-report">
                            <input type="checkbox" id="blockAfterReport">
                            <span>Block this user after reporting</span>
                        </label>
                    </div>
                </div>
                <div class="report-modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.report-modal').remove()">Cancel</button>
                    <button class="btn btn-primary" onclick="reportBlockSystem.submitReport('${userId}', '${userName}', this.closest('.report-modal'))">Submit Report</button>
                </div>
            </div>
        `;

        // Add close event
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.style.opacity = '0';
            modal.style.visibility = 'hidden';
            setTimeout(() => {
                document.body.removeChild(modal);
            }, 300);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.querySelector('.modal-close').click();
            }
        });

        return modal;
    }

    submitReport(userId, userName, modalElement) {
        const selectedType = modalElement.querySelector('input[name="reportType"]:checked');
        const additionalDetails = modalElement.querySelector('.report-details-input').value;
        const blockAfter = modalElement.querySelector('#blockAfterReport').checked;

        if (!selectedType) {
            this.showNotification('Please select a reason for reporting', 'error');
            return;
        }

        const report = {
            id: this.generateReportId(),
            reportedUserId: userId,
            reportedUserName: userName,
            reportType: selectedType.value,
            details: additionalDetails,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        // Save report
        this.reportHistory.push(report);
        this.saveReportHistory();

        // Block user if requested
        if (blockAfter) {
            this.blockUser(userId, userName, false); // false = don't show confirmation
        }

        // Close modal
        modalElement.remove();

        // Show success message
        this.showNotification(
            `Report submitted successfully. ${blockAfter ? `${userName} has been blocked.` : ''}`,
            'success'
        );

        // In a real app, send to API
        this.sendReportToAPI(report);
    }

    showBlockConfirmation(userId, userName) {
        const confirmed = confirm(
            `Block ${userName}?\n\n` +
            `• They won't be able to see your events\n` +
            `• They won't be able to message you\n` +
            `• You won't see their content\n\n` +
            `You can unblock them later in your settings.`
        );

        if (confirmed) {
            this.blockUser(userId, userName, true);
        }
    }

    blockUser(userId, userName, showNotification = true) {
        this.blockedUsers.add(userId);
        this.saveBlockedUsers();

        if (showNotification) {
            this.showNotification(`${userName} has been blocked`, 'success');
        }

        // Hide content from blocked user
        this.hideBlockedUserContent(userId);

        // Update UI buttons
        this.updateUserButtons(userId, userName);

        // In a real app, send to API
        this.sendBlockToAPI(userId);
    }

    showUnblockConfirmation(userId, userName) {
        const confirmed = confirm(`Unblock ${userName}? They will be able to see and interact with your content again.`);

        if (confirmed) {
            this.unblockUser(userId, userName);
        }
    }

    unblockUser(userId, userName) {
        this.blockedUsers.delete(userId);
        this.saveBlockedUsers();

        this.showNotification(`${userName} has been unblocked`, 'success');

        // Show content from unblocked user
        this.showUnblockedUserContent(userId);

        // Update UI buttons
        this.updateUserButtons(userId, userName);

        // In a real app, send to API
        this.sendUnblockToAPI(userId);
    }

    isUserBlocked(userId) {
        return this.blockedUsers.has(userId);
    }

    hideBlockedUserContent(userId) {
        // Hide content from blocked users
        document.querySelectorAll(`[data-user-id="${userId}"]`).forEach(element => {
            element.style.display = 'none';
        });

        // Hide user from attendee lists, comments, etc.
        document.querySelectorAll('.user-item, .comment, .attendee-item').forEach(element => {
            if (element.dataset.userId === userId || element.dataset.authorId === userId) {
                element.style.display = 'none';
            }
        });
    }

    showUnblockedUserContent(userId) {
        // Show content from unblocked users
        document.querySelectorAll(`[data-user-id="${userId}"]`).forEach(element => {
            element.style.display = '';
        });

        document.querySelectorAll('.user-item, .comment, .attendee-item').forEach(element => {
            if (element.dataset.userId === userId || element.dataset.authorId === userId) {
                element.style.display = '';
            }
        });
    }

    updateUserButtons(userId, userName) {
        // Remove existing buttons
        document.querySelectorAll(`[data-user-id="${userId}"]`).forEach(element => {
            const buttonContainer = element.querySelector('.report-block-buttons');
            if (buttonContainer) {
                buttonContainer.remove();
            }
        });

        // Re-add appropriate buttons
        document.querySelectorAll(`.user-card[data-user-id="${userId}"], .user-profile[data-user-id="${userId}"]`).forEach(element => {
            this.addReportBlockButtons(element, userId, userName);
        });
    }

    generateReportId() {
        return 'report_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
            transition: 'all 0.3s ease',
            maxWidth: '300px'
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
        }, 5000);
    }

    sendReportToAPI(report) {
        // In a real app, send report to backend
        console.log('Report sent to API:', report);
    }

    sendBlockToAPI(userId) {
        // In a real app, send block action to backend
        console.log('User blocked via API:', userId);
    }

    sendUnblockToAPI(userId) {
        // In a real app, send unblock action to backend
        console.log('User unblocked via API:', userId);
    }

    injectStyles() {
        if (document.getElementById('report-block-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'report-block-styles';
        styles.textContent = `
            /* Report & Block Button Styles */
            .report-block-buttons {
                display: flex;
                gap: 8px;
                align-items: center;
                margin-top: 8px;
            }

            .report-user-btn, .block-user-btn, .unblock-user-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                background: white;
                color: #4a5568;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .report-user-btn:hover {
                border-color: #ed8936;
                color: #ed8936;
                background: #fffaf0;
            }

            .block-user-btn:hover {
                border-color: #f56565;
                color: #f56565;
                background: #fff5f5;
            }

            .unblock-user-btn {
                border-color: #48bb78;
                color: #48bb78;
            }

            .unblock-user-btn:hover {
                background: #f0fff4;
            }

            .report-user-btn.minimal, .block-user-btn.minimal {
                padding: 4px;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                justify-content: center;
            }

            .report-user-btn.minimal span, .block-user-btn.minimal span {
                display: none;
            }

            /* Dropdown Styles */
            .user-actions-dropdown {
                position: relative;
                display: inline-block;
            }

            .dropdown-toggle {
                background: none;
                border: 1px solid #e2e8f0;
                border-radius: 50%;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                color: #4a5568;
                transition: all 0.2s ease;
            }

            .dropdown-toggle:hover {
                background: #f7fafc;
                border-color: #cbd5e0;
            }

            .dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.2s ease;
                min-width: 140px;
                z-index: 1000;
            }

            .user-actions-dropdown:hover .dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .dropdown-item {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                padding: 8px 12px;
                border: none;
                background: none;
                text-align: left;
                cursor: pointer;
                font-size: 12px;
                color: #4a5568;
                transition: background 0.2s ease;
            }

            .dropdown-item:hover {
                background: #f7fafc;
            }

            .dropdown-item:first-child {
                border-radius: 8px 8px 0 0;
            }

            .dropdown-item:last-child {
                border-radius: 0 0 8px 8px;
            }

            /* Report Modal Styles */
            .report-modal {
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

            .report-modal-content {
                background: white;
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideIn 0.3s ease;
            }

            .report-modal-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .report-modal-header h3 {
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

            .report-modal-body {
                padding: 2rem;
            }

            .report-description {
                color: #718096;
                margin-bottom: 2rem;
                line-height: 1.6;
            }

            .report-types h4 {
                color: #2d3748;
                margin-bottom: 1rem;
                font-size: 16px;
            }

            .report-type-option {
                display: block;
                margin-bottom: 12px;
                cursor: pointer;
            }

            .report-type-option input[type="radio"] {
                display: none;
            }

            .report-type-content {
                padding: 16px;
                border: 2px solid #e2e8f0;
                border-radius: 8px;
                transition: all 0.2s ease;
            }

            .report-type-option input[type="radio"]:checked + .report-type-content {
                border-color: #4299e1;
                background: #ebf8ff;
            }

            .report-type-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }

            .report-type-label {
                font-weight: 600;
                color: #2d3748;
                flex: 1;
            }

            .severity-badge {
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
            }

            .severity-badge.low {
                background: #c6f6d5;
                color: #22543d;
            }

            .severity-badge.medium {
                background: #fbd38d;
                color: #7b341e;
            }

            .severity-badge.high {
                background: #fed7d7;
                color: #742a2a;
            }

            .severity-badge.critical {
                background: #f56565;
                color: white;
            }

            .report-type-description {
                color: #718096;
                font-size: 14px;
                margin: 0;
            }

            .report-details {
                margin: 2rem 0;
            }

            .report-details h4 {
                color: #2d3748;
                margin-bottom: 1rem;
                font-size: 16px;
            }

            .report-details-input {
                width: 100%;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                resize: vertical;
                min-height: 80px;
            }

            .report-details-input:focus {
                outline: none;
                border-color: #4299e1;
                box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
            }

            .report-actions {
                margin: 2rem 0;
            }

            .block-after-report {
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                color: #4a5568;
                font-size: 14px;
            }

            .block-after-report input[type="checkbox"] {
                margin: 0;
            }

            .report-modal-footer {
                padding: 1rem 2rem 2rem;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            }

            .btn {
                padding: 10px 20px;
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
            }

            @keyframes slideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }

            /* Responsive */
            @media (max-width: 768px) {
                .report-modal-content {
                    width: 95%;
                    margin: 20px;
                }

                .report-modal-header,
                .report-modal-body,
                .report-modal-footer {
                    padding: 1.5rem;
                }

                .report-block-buttons {
                    justify-content: center;
                }

                .dropdown-menu {
                    right: auto;
                    left: 0;
                }
            }
        `;

        document.head.appendChild(styles);
    }

    // Static methods for easy integration
    static addToElement(element, userId, userName, options = {}) {
        const instance = new ReportBlockSystem();
        return instance.addReportBlockButtons(element, userId, userName, options);
    }

    static isBlocked(userId) {
        const instance = new ReportBlockSystem();
        return instance.isUserBlocked(userId);
    }
}

// Initialize the system
let reportBlockSystem;
document.addEventListener('DOMContentLoaded', () => {
    reportBlockSystem = new ReportBlockSystem();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReportBlockSystem;
} else if (typeof window !== 'undefined') {
    window.ReportBlockSystem = ReportBlockSystem;
}