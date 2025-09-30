// Safety & Trust Dashboard JavaScript

class SafetyTrustManager {
    constructor() {
        this.currentUser = null;
        this.reports = [];
        this.blockedUsers = [];
        this.consentForms = [];
        this.initialize();
    }

    async initialize() {
        await this.loadUserData();
        this.setupEventListeners();
        this.loadDashboardData();
        this.renderInitialData();
    }

    async loadUserData() {
        // Load current user data
        try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            this.currentUser = userData;

            // Update UI with user info
            const userAvatar = document.getElementById('userAvatar');
            const userName = document.getElementById('userName');

            if (userAvatar && userName) {
                userAvatar.textContent = userData.name?.charAt(0) || 'U';
                userName.textContent = userData.name || 'User';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    setupEventListeners() {
        // Modal close events
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Consent settings toggles
        const requireConsentToggle = document.getElementById('requireConsent');
        const remindersToggle = document.getElementById('consentReminders');

        if (requireConsentToggle) {
            requireConsentToggle.addEventListener('change', this.updateConsentSettings.bind(this));
        }

        if (remindersToggle) {
            remindersToggle.addEventListener('change', this.updateConsentSettings.bind(this));
        }
    }

    loadDashboardData() {
        // Load reports, blocked users, etc.
        this.loadReports();
        this.loadBlockedUsers();
        this.loadConsentData();
        this.updateDashboardMetrics();
    }

    renderInitialData() {
        this.renderTrustLevel();
        this.renderRecentReports();
        this.renderBlockedUsers();
        this.updateCounts();
    }

    // Verification System
    startBusinessVerification() {
        alert('Business verification process started. You will receive an email with next steps.');
        // In a real app, this would redirect to a verification flow
    }

    startBackgroundCheck() {
        const confirmed = confirm('Background check requires a $25 fee and 3-5 business days to complete. Continue?');
        if (confirmed) {
            alert('Background check initiated. You will receive an email with payment instructions.');
        }
    }

    verifySocialMedia() {
        // Open social media verification modal
        alert('Social media verification: Connect your Instagram, Twitter, or LinkedIn accounts.');
    }

    // Report Management
    loadReports() {
        // Mock reports data
        this.reports = [
            {
                id: 'rep001',
                reporterId: 'user123',
                reporterName: 'John Doe',
                reporterAvatar: 'JD',
                type: 'spam',
                description: 'User is sending spam messages to event attendees',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                status: 'pending',
                evidence: ['screenshot1.jpg', 'screenshot2.jpg']
            },
            {
                id: 'rep002',
                reporterId: 'user456',
                reporterName: 'Sarah Miller',
                reporterAvatar: 'SM',
                type: 'inappropriate',
                description: 'Posted inappropriate content in event comments',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                status: 'pending',
                evidence: ['comment_screenshot.jpg']
            },
            {
                id: 'rep003',
                reporterId: 'user789',
                reporterName: 'Mike Wilson',
                reporterAvatar: 'MW',
                type: 'harassment',
                description: 'Harassing other attendees via direct messages',
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                status: 'reviewed',
                evidence: ['dm_screenshots.jpg']
            }
        ];
    }

    renderRecentReports() {
        const recentReports = this.reports.slice(0, 2);
        // Reports are already rendered in HTML, this would update them dynamically
    }

    reviewReport(reportId) {
        const report = this.reports.find(r => r.id === reportId);
        if (!report) return;

        const reportSummary = document.getElementById('reportSummary');
        if (reportSummary) {
            reportSummary.innerHTML = `
                <div class="report-detail-card">
                    <div class="report-header">
                        <div class="reporter-info">
                            <div class="reporter-avatar">${report.reporterAvatar}</div>
                            <div class="reporter-details">
                                <strong>${report.reporterName}</strong>
                                <span>Reported ${this.formatTimeAgo(report.timestamp)}</span>
                            </div>
                        </div>
                        <span class="report-type-badge ${report.type}">${report.type}</span>
                    </div>
                    <div class="report-description">
                        <h4>Description:</h4>
                        <p>${report.description}</p>
                    </div>
                    ${report.evidence?.length ? `
                        <div class="report-evidence">
                            <h4>Evidence:</h4>
                            <div class="evidence-list">
                                ${report.evidence.map(file => `
                                    <div class="evidence-item">
                                        <i class="fas fa-image"></i>
                                        <span>${file}</span>
                                        <button onclick="viewEvidence('${file}')" class="view-evidence-btn">View</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        this.openModal('reportModal');
    }

    dismissReport() {
        alert('Report dismissed. The reported user will not be notified.');
        this.closeModal('reportModal');
    }

    warnUser() {
        alert('Warning sent to user. They will receive a notification about community guidelines.');
        this.closeModal('reportModal');
    }

    blockReportedUser() {
        const confirmed = confirm('Are you sure you want to block this user? They will not be able to interact with your events.');
        if (confirmed) {
            alert('User has been blocked and added to your blocked users list.');
            this.closeModal('reportModal');
        }
    }

    openReportCenter() {
        alert('Opening full report center with all reports and advanced filtering options.');
    }

    // Block/Unblock functionality
    blockUser(userId) {
        const confirmed = confirm('Block this user? They will not be able to attend your events or contact you.');
        if (confirmed) {
            // Add to blocked users list
            const blockedUser = {
                id: userId,
                name: 'New Blocked User',
                avatar: 'NU',
                blockedAt: new Date(),
                reason: 'Manual block'
            };

            this.blockedUsers.push(blockedUser);
            this.renderBlockedUsers();
            this.updateCounts();

            alert('User has been blocked successfully.');
        }
    }

    loadBlockedUsers() {
        // Mock blocked users data
        this.blockedUsers = [
            {
                id: 'user789',
                name: 'Alex Brown',
                avatar: 'AB',
                blockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                reason: 'Spam behavior'
            },
            {
                id: 'user321',
                name: 'Mike Johnson',
                avatar: 'MJ',
                blockedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
                reason: 'Inappropriate content'
            }
        ];
    }

    renderBlockedUsers() {
        // Blocked users are already rendered in HTML, this would update them dynamically
    }

    unblockUser(userId) {
        const user = this.blockedUsers.find(u => u.id === userId);
        if (!user) return;

        const confirmed = confirm(`Unblock ${user.name}? They will be able to interact with your events again.`);
        if (confirmed) {
            this.blockedUsers = this.blockedUsers.filter(u => u.id !== userId);
            this.renderBlockedUsers();
            this.updateCounts();
            alert(`${user.name} has been unblocked.`);
        }
    }

    viewAllBlocked() {
        alert('Opening full blocked users management page.');
    }

    // Photo/Video Consent Management
    loadConsentData() {
        // Load consent forms and settings
        this.consentForms = [
            {
                id: 'standard',
                name: 'Standard Photo Consent',
                description: 'Basic photography and video recording consent',
                template: 'standard_consent_template',
                active: true
            },
            {
                id: 'commercial',
                name: 'Commercial Use Consent',
                description: 'Consent for commercial and marketing use',
                template: 'commercial_consent_template',
                active: false
            }
        ];
    }

    updateConsentSettings() {
        const requireConsent = document.getElementById('requireConsent')?.checked;
        const consentReminders = document.getElementById('consentReminders')?.checked;

        // Save settings
        const settings = {
            requireConsent,
            consentReminders,
            updatedAt: new Date()
        };

        localStorage.setItem('consentSettings', JSON.stringify(settings));

        // Show confirmation
        this.showNotification('Consent settings updated successfully', 'success');
    }

    manageConsents() {
        this.loadConsentModalData();
        this.openModal('consentModal');
    }

    loadConsentModalData() {
        // Load attendee consent data
        this.renderAttendeeConsentList();
    }

    renderAttendeeConsentList() {
        const attendeeList = document.getElementById('attendeeConsentList');
        if (!attendeeList) return;

        // Mock attendee consent data
        const attendees = [
            { id: '1', name: 'Alice Johnson', email: 'alice@example.com', status: 'consented', avatar: 'AJ' },
            { id: '2', name: 'Bob Smith', email: 'bob@example.com', status: 'declined', avatar: 'BS' },
            { id: '3', name: 'Carol Davis', email: 'carol@example.com', status: 'pending', avatar: 'CD' },
            { id: '4', name: 'David Wilson', email: 'david@example.com', status: 'consented', avatar: 'DW' }
        ];

        attendeeList.innerHTML = attendees.map(attendee => `
            <div class="attendee-consent-item">
                <div class="attendee-avatar">${attendee.avatar}</div>
                <div class="attendee-info">
                    <strong>${attendee.name}</strong>
                    <span>${attendee.email}</span>
                </div>
                <span class="consent-status ${attendee.status}">${attendee.status}</span>
                <div class="consent-actions">
                    ${attendee.status === 'pending' ? `
                        <button onclick="sendConsentReminder('${attendee.id}')" class="action-btn-sm">
                            <i class="fas fa-bell"></i>
                        </button>
                    ` : ''}
                    <button onclick="viewConsentDetails('${attendee.id}')" class="action-btn-sm">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    switchConsentTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.consent-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab content
        const targetTab = document.getElementById(`consent${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Add active class to clicked button
        event.target.classList.add('active');
    }

    useTemplate(templateId) {
        alert(`Using ${templateId} consent template. You can customize it in the form editor.`);
    }

    filterConsent(filterType) {
        // Remove active class from all filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        event.target.classList.add('active');

        // Filter logic would go here
        console.log(`Filtering by: ${filterType}`);
    }

    sendConsentReminder(attendeeId) {
        alert('Consent reminder sent to attendee.');
    }

    viewConsentDetails(attendeeId) {
        alert('Opening detailed consent information for attendee.');
    }

    // Trust Level Management
    renderTrustLevel() {
        // Trust level is already rendered in HTML
        // This would update it dynamically based on user data
    }

    updateDashboardMetrics() {
        // Update metrics with real data
        const hostRating = document.getElementById('hostRating');
        const eventsHosted = document.getElementById('eventsHosted');
        const verificationScore = document.getElementById('verificationScore');

        if (hostRating) hostRating.textContent = '4.9';
        if (eventsHosted) eventsHosted.textContent = '47';
        if (verificationScore) verificationScore.textContent = '95%';
    }

    updateCounts() {
        const alertCount = document.getElementById('alertCount');
        const blockedCount = document.getElementById('blockedCount');

        if (alertCount) alertCount.textContent = this.reports.filter(r => r.status === 'pending').length;
        if (blockedCount) blockedCount.textContent = this.blockedUsers.length;
    }

    // Modal Management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }

    // Utility Functions
    formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes} minutes ago`;
        if (hours < 24) return `${hours} hours ago`;
        return `${days} days ago`;
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        // Style the notification
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

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Global functions for onclick handlers
function goBack() {
    window.history.back();
}

function closeModal(modalId) {
    safetyManager.closeModal(modalId);
}

function reviewReport(reportId) {
    safetyManager.reviewReport(reportId);
}

function blockUser(userId) {
    safetyManager.blockUser(userId);
}

function unblockUser(userId) {
    safetyManager.unblockUser(userId);
}

function openReportCenter() {
    safetyManager.openReportCenter();
}

function manageConsents() {
    safetyManager.manageConsents();
}

function viewAllBlocked() {
    safetyManager.viewAllBlocked();
}

function dismissReport() {
    safetyManager.dismissReport();
}

function warnUser() {
    safetyManager.warnUser();
}

function blockReportedUser() {
    safetyManager.blockReportedUser();
}

function switchConsentTab(tabName) {
    safetyManager.switchConsentTab(tabName);
}

function useTemplate(templateId) {
    safetyManager.useTemplate(templateId);
}

function filterConsent(filterType) {
    safetyManager.filterConsent(filterType);
}

function sendConsentReminder(attendeeId) {
    safetyManager.sendConsentReminder(attendeeId);
}

function viewConsentDetails(attendeeId) {
    safetyManager.viewConsentDetails(attendeeId);
}

function startBusinessVerification() {
    safetyManager.startBusinessVerification();
}

function startBackgroundCheck() {
    safetyManager.startBackgroundCheck();
}

function verifySocialMedia() {
    safetyManager.verifySocialMedia();
}

function viewEvidence(fileName) {
    alert(`Opening evidence file: ${fileName}`);
}

// Initialize the Safety & Trust Manager when the page loads
let safetyManager;
document.addEventListener('DOMContentLoaded', () => {
    safetyManager = new SafetyTrustManager();
});