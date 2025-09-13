// Admin Applications Dashboard JavaScript
class AdminApplicationsDashboard {
    constructor() {
        this.apiBaseUrl = '/api/monetize';
        this.currentUser = null;
        this.applications = [];
        this.filteredApplications = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.totalPages = 1;
        this.currentFilters = {
            type: '',
            status: '',
            search: ''
        };
        
        this.init();
    }

    async init() {
        await this.checkAdminAuth();
        this.setupEventListeners();
        await this.loadStats();
        await this.loadApplications();
    }

    async checkAdminAuth() {
        try {
            if (!window.authAPI || !window.authAPI.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }

            this.currentUser = await window.authAPI.getCurrentUser();
            
            if (!this.currentUser.isAdmin) {
                this.showNotification('Admin access required', 'error');
                setTimeout(() => window.location.href = 'index.html', 2000);
                return;
            }

            this.updateUserInfo();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        }
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const userInitials = document.getElementById('userInitials');

            if (userName) userName.textContent = this.currentUser.username || 'Admin';
            if (userEmail) userEmail.textContent = this.currentUser.email;
            
            if (userInitials) {
                const initials = (this.currentUser.username || this.currentUser.email)
                    .split(' ')
                    .map(word => word[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                userInitials.textContent = initials;
            }
        }
    }

    setupEventListeners() {
        // User menu
        const userAvatarBtn = document.getElementById('userAvatarBtn');
        const userDropdown = document.getElementById('userDropdown');
        
        if (userAvatarBtn && userDropdown) {
            userAvatarBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // Filters
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.applyFilters();
        });

        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.currentFilters.status = e.target.value;
            this.applyFilters();
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.currentFilters.search = e.target.value;
            this.applyFilters();
        });

        // Actions
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadApplications();
            this.loadStats();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToCSV();
        });

        // Pagination
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderApplications();
                this.updatePagination();
            }
        });

        document.getElementById('nextPage').addEventListener('click', () => {
            if (this.currentPage < this.totalPages) {
                this.currentPage++;
                this.renderApplications();
                this.updatePagination();
            }
        });

        // Status update
        document.getElementById('statusSelect').addEventListener('change', (e) => {
            const partnershipTerms = document.getElementById('partnershipTerms');
            if (e.target.value === 'approved') {
                partnershipTerms.style.display = 'block';
            } else {
                partnershipTerms.style.display = 'none';
            }
        });

        document.getElementById('updateStatusBtn').addEventListener('click', () => {
            this.updateApplicationStatus();
        });
    }

    async logout() {
        try {
            if (window.authAPI) {
                await window.authAPI.logout();
            }
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateStatsDisplay(stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        document.getElementById('totalApplications').textContent = stats.totalApplications || 0;
        document.getElementById('pendingApplications').textContent = stats.pendingApplications || 0;
        document.getElementById('approvedApplications').textContent = stats.approvedApplications || 0;
        
        // Calculate estimated monthly revenue (simplified calculation)
        const estimatedRevenue = (stats.approvedApplications || 0) * 1500; // Average partner value
        document.getElementById('monthlyRevenue').textContent = `$${estimatedRevenue.toLocaleString()}`;
    }

    async loadApplications() {
        this.showLoading(true);
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/applications`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.applications = data.applications || [];
                this.applyFilters();
            } else {
                throw new Error('Failed to load applications');
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            this.showNotification('Failed to load applications', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    applyFilters() {
        this.filteredApplications = this.applications.filter(app => {
            const matchesType = !this.currentFilters.type || app.applicationType === this.currentFilters.type;
            const matchesStatus = !this.currentFilters.status || app.status === this.currentFilters.status;
            const matchesSearch = !this.currentFilters.search || 
                app.businessInfo.businessName.toLowerCase().includes(this.currentFilters.search.toLowerCase()) ||
                app.contactInfo.fullName.toLowerCase().includes(this.currentFilters.search.toLowerCase()) ||
                app.contactInfo.email.toLowerCase().includes(this.currentFilters.search.toLowerCase());

            return matchesType && matchesStatus && matchesSearch;
        });

        this.currentPage = 1;
        this.totalPages = Math.ceil(this.filteredApplications.length / this.itemsPerPage);
        this.renderApplications();
        this.updatePagination();
        this.updateResultsCount();
    }

    renderApplications() {
        const tableBody = document.getElementById('applicationsTableBody');
        const table = document.getElementById('applicationsTable');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredApplications.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        table.style.display = 'block';
        emptyState.style.display = 'none';

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageApplications = this.filteredApplications.slice(startIndex, endIndex);

        tableBody.innerHTML = pageApplications.map(app => this.renderApplicationRow(app)).join('');
    }

    renderApplicationRow(app) {
        const submissionDate = new Date(app.submissionDate).toLocaleDateString();
        const typeIcon = app.applicationType === 'influencer' ? 'fas fa-star' : 'fas fa-building';
        
        return `
            <tr onclick="adminApp.viewApplication('${app._id}')">
                <td>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 32px; height: 32px; background: var(--admin-primary); border-radius: var(--admin-radius-full); display: flex; align-items: center; justify-content: center; color: white; font-size: 12px;">
                            <i class="${typeIcon}"></i>
                        </div>
                        <div>
                            <div style="font-weight: 600; color: var(--admin-gray-900);">${app.contactInfo.fullName}</div>
                            <div style="font-size: 12px; color: var(--admin-gray-500);">${app.businessInfo.businessName}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="admin-type-badge admin-type-badge--${app.applicationType}">
                        <i class="${typeIcon}"></i>
                        ${app.applicationType.charAt(0).toUpperCase() + app.applicationType.slice(1)}
                    </span>
                </td>
                <td>
                    <span class="admin-status-badge admin-status-badge--${app.status}">
                        ${this.formatStatus(app.status)}
                    </span>
                </td>
                <td>
                    <div style="color: var(--admin-gray-700);">${submissionDate}</div>
                    <div style="font-size: 11px; color: var(--admin-gray-500);">${this.getTimeAgo(app.submissionDate)}</div>
                </td>
                <td>
                    <div style="color: var(--admin-gray-700);">${app.contactInfo.email}</div>
                    <div style="font-size: 11px; color: var(--admin-gray-500);">${app.contactInfo.phone}</div>
                </td>
                <td>
                    <button class="admin-action-btn" onclick="event.stopPropagation(); adminApp.viewApplication('${app._id}')">
                        View Details
                    </button>
                </td>
            </tr>
        `;
    }

    async viewApplication(applicationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/application/${applicationId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showApplicationModal(data.application);
            } else {
                throw new Error('Failed to load application details');
            }
        } catch (error) {
            console.error('Error loading application:', error);
            this.showNotification('Failed to load application details', 'error');
        }
    }

    showApplicationModal(application) {
        const modal = document.getElementById('applicationModal');
        const detailsContainer = document.getElementById('applicationDetails');
        const statusSelect = document.getElementById('statusSelect');
        const adminNotes = document.getElementById('adminNotes');

        // Store current application for updates
        this.currentApplication = application;

        // Set current status and notes
        statusSelect.value = application.status;
        adminNotes.value = application.reviewerNotes || '';

        // Show/hide partnership terms based on current status
        const partnershipTerms = document.getElementById('partnershipTerms');
        if (application.status === 'approved') {
            partnershipTerms.style.display = 'block';
            document.getElementById('commissionRate').value = application.partnershipTerms?.commissionRate || '';
            document.getElementById('minimumRevenue').value = application.partnershipTerms?.minimumRevenue || '';
            document.getElementById('contractDuration').value = application.partnershipTerms?.contractDuration || '';
        } else {
            partnershipTerms.style.display = 'none';
        }

        // Render application details
        detailsContainer.innerHTML = this.renderApplicationDetails(application);

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    renderApplicationDetails(app) {
        const typeIcon = app.applicationType === 'influencer' ? 'fas fa-star' : 'fas fa-building';
        let detailsHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--admin-gray-200);">
                <div style="width: 48px; height: 48px; background: var(--admin-primary); border-radius: var(--admin-radius-full); display: flex; align-items: center; justify-content: center; color: white;">
                    <i class="${typeIcon}"></i>
                </div>
                <div>
                    <h3 style="color: var(--admin-gray-900); margin-bottom: 0.25rem;">${app.contactInfo.fullName}</h3>
                    <p style="color: var(--admin-gray-600); margin-bottom: 0.25rem;">${app.businessInfo.businessName}</p>
                    <span class="admin-status-badge admin-status-badge--${app.status}">${this.formatStatus(app.status)}</span>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                <div>
                    <h4 style="color: var(--admin-gray-800); margin-bottom: 0.75rem; font-size: 14px;">Contact Information</h4>
                    <div style="background: var(--admin-gray-50); padding: 1rem; border-radius: var(--admin-radius-lg);">
                        <p><strong>Email:</strong> ${app.contactInfo.email}</p>
                        <p><strong>Phone:</strong> ${app.contactInfo.phone}</p>
                    </div>
                </div>
                <div>
                    <h4 style="color: var(--admin-gray-800); margin-bottom: 0.75rem; font-size: 14px;">Business Info</h4>
                    <div style="background: var(--admin-gray-50); padding: 1rem; border-radius: var(--admin-radius-lg);">
                        <p><strong>Business:</strong> ${app.businessInfo.businessName}</p>
                        ${app.businessInfo.website ? `<p><strong>Website:</strong> <a href="${app.businessInfo.website}" target="_blank">${app.businessInfo.website}</a></p>` : ''}
                    </div>
                </div>
            </div>
        `;

        if (app.applicationType === 'influencer' && app.influencerDetails) {
            const details = app.influencerDetails;
            detailsHTML += `
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--admin-gray-800); margin-bottom: 0.75rem; font-size: 14px;">Influencer Details</h4>
                    <div style="background: var(--admin-gray-50); padding: 1rem; border-radius: var(--admin-radius-lg);">
                        <p><strong>Niche:</strong> ${details.niche || 'Not specified'}</p>
                        <p><strong>Engagement Rate:</strong> ${details.avgEngagementRate || 0}%</p>
                        
                        <div style="margin-top: 1rem;">
                            <strong>Follower Count:</strong>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.5rem; margin-top: 0.5rem;">
                                ${details.followerCount?.instagram ? `<span>📷 ${details.followerCount.instagram.toLocaleString()}</span>` : ''}
                                ${details.followerCount?.tiktok ? `<span>🎵 ${details.followerCount.tiktok.toLocaleString()}</span>` : ''}
                                ${details.followerCount?.youtube ? `<span>📺 ${details.followerCount.youtube.toLocaleString()}</span>` : ''}
                            </div>
                        </div>

                        ${details.contentTypes && details.contentTypes.length > 0 ? `
                            <div style="margin-top: 1rem;">
                                <strong>Content Types:</strong>
                                <div style="margin-top: 0.5rem;">
                                    ${details.contentTypes.map(type => `<span style="background: var(--admin-primary); color: white; padding: 0.25rem 0.5rem; border-radius: var(--admin-radius-md); font-size: 11px; margin-right: 0.5rem;">${type}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${details.previousBrandPartnerships ? `
                            <div style="margin-top: 1rem;">
                                <strong>Previous Partnerships:</strong>
                                <p style="margin-top: 0.5rem; font-size: 13px; color: var(--admin-gray-600);">${details.previousBrandPartnerships}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        if (app.applicationType === 'venue' && app.venueDetails) {
            const details = app.venueDetails;
            detailsHTML += `
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: var(--admin-gray-800); margin-bottom: 0.75rem; font-size: 14px;">Venue Details</h4>
                    <div style="background: var(--admin-gray-50); padding: 1rem; border-radius: var(--admin-radius-lg);">
                        <p><strong>Type:</strong> ${details.venueType || 'Not specified'}</p>
                        <p><strong>Capacity:</strong> ${details.capacity || 'Not specified'} people</p>
                        
                        <div style="margin-top: 1rem;">
                            <strong>Location:</strong>
                            <p style="margin-top: 0.25rem;">${details.location?.address || ''}</p>
                            <p>${details.location?.city || ''}, ${details.location?.state || ''} ${details.location?.zipCode || ''}</p>
                        </div>

                        ${details.eventTypes && details.eventTypes.length > 0 ? `
                            <div style="margin-top: 1rem;">
                                <strong>Event Types:</strong>
                                <div style="margin-top: 0.5rem;">
                                    ${details.eventTypes.map(type => `<span style="background: var(--admin-gray-600); color: white; padding: 0.25rem 0.5rem; border-radius: var(--admin-radius-md); font-size: 11px; margin-right: 0.5rem;">${type}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${details.amenities && details.amenities.length > 0 ? `
                            <div style="margin-top: 1rem;">
                                <strong>Amenities:</strong>
                                <div style="margin-top: 0.5rem;">
                                    ${details.amenities.map(amenity => `<span style="background: var(--admin-success); color: white; padding: 0.25rem 0.5rem; border-radius: var(--admin-radius-md); font-size: 11px; margin-right: 0.5rem;">${amenity.replace('_', ' ')}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}

                        ${details.pricing && (details.pricing.hourlyRate || details.pricing.dailyRate) ? `
                            <div style="margin-top: 1rem;">
                                <strong>Pricing:</strong>
                                <div style="margin-top: 0.5rem;">
                                    ${details.pricing.hourlyRate ? `<span>$${details.pricing.hourlyRate}/hour</span>` : ''}
                                    ${details.pricing.dailyRate ? `<span style="margin-left: 1rem;">$${details.pricing.dailyRate}/day</span>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        detailsHTML += `
            <div>
                <h4 style="color: var(--admin-gray-800); margin-bottom: 0.75rem; font-size: 14px;">Application Timeline</h4>
                <div style="background: var(--admin-gray-50); padding: 1rem; border-radius: var(--admin-radius-lg);">
                    <p><strong>Submitted:</strong> ${new Date(app.submissionDate).toLocaleDateString()}</p>
                    ${app.reviewDate ? `<p><strong>Last Review:</strong> ${new Date(app.reviewDate).toLocaleDateString()}</p>` : ''}
                    ${app.approvalDate ? `<p><strong>Approved:</strong> ${new Date(app.approvalDate).toLocaleDateString()}</p>` : ''}
                </div>
            </div>
        `;

        return detailsHTML;
    }

    async updateApplicationStatus() {
        if (!this.currentApplication) return;

        const status = document.getElementById('statusSelect').value;
        const notes = document.getElementById('adminNotes').value;
        const partnershipTerms = {};

        if (status === 'approved') {
            partnershipTerms.commissionRate = parseFloat(document.getElementById('commissionRate').value) || 0;
            partnershipTerms.minimumRevenue = parseFloat(document.getElementById('minimumRevenue').value) || 0;
            partnershipTerms.contractDuration = parseInt(document.getElementById('contractDuration').value) || 12;
        }

        try {
            this.showLoadingOverlay(true);

            const response = await fetch(`${this.apiBaseUrl}/application/${this.currentApplication._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    status,
                    notes,
                    partnershipTerms: status === 'approved' ? partnershipTerms : undefined
                })
            });

            if (response.ok) {
                this.closeApplicationModal();
                this.showSuccessModal();
                await this.loadApplications();
                await this.loadStats();
            } else {
                const result = await response.json();
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            this.showNotification(error.message || 'Failed to update application status', 'error');
        } finally {
            this.showLoadingOverlay(false);
        }
    }

    closeApplicationModal() {
        document.getElementById('applicationModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.currentApplication = null;
    }

    showSuccessModal() {
        document.getElementById('successModal').style.display = 'flex';
    }

    closeSuccessModal() {
        document.getElementById('successModal').style.display = 'none';
    }

    updateResultsCount() {
        const count = this.filteredApplications.length;
        const countText = count === 1 ? '1 application' : `${count} applications`;
        document.getElementById('resultsCount').textContent = countText;
    }

    updatePagination() {
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const pageInfo = document.getElementById('pageInfo');
        const pagination = document.getElementById('pagination');

        if (this.totalPages <= 1) {
            pagination.style.display = 'none';
            return;
        }

        pagination.style.display = 'flex';
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === this.totalPages;
        pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'under_review': 'Under Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'needs_info': 'Needs Info'
        };
        return statusMap[status] || status;
    }

    getTimeAgo(date) {
        const now = new Date();
        const past = new Date(date);
        const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
        
        if (diffInHours < 24) {
            return `${diffInHours}h ago`;
        } else {
            const diffInDays = Math.floor(diffInHours / 24);
            return `${diffInDays}d ago`;
        }
    }

    exportToCSV() {
        const headers = ['Name', 'Email', 'Business', 'Type', 'Status', 'Submitted', 'Phone'];
        const csvContent = [
            headers.join(','),
            ...this.filteredApplications.map(app => [
                `"${app.contactInfo.fullName}"`,
                `"${app.contactInfo.email}"`,
                `"${app.businessInfo.businessName}"`,
                app.applicationType,
                app.status,
                new Date(app.submissionDate).toLocaleDateString(),
                `"${app.contactInfo.phone}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applications_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    showLoading(show) {
        document.getElementById('applicationsLoading').style.display = show ? 'block' : 'none';
    }

    showLoadingOverlay(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: var(--admin-radius-xl);
            box-shadow: var(--admin-shadow-xl);
            z-index: 9999;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            border-left: 4px solid ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
        `;
        
        notification.innerHTML = `
            <div style="padding: 1rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
                <div style="flex: 1;">
                    <div style="color: var(--admin-gray-800); font-weight: 500; margin-bottom: 0.25rem;">
                        ${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Info'}
                    </div>
                    <div style="color: var(--admin-gray-600); font-size: 13px;">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--admin-gray-400);">
                    ×
                </button>
            </div>
        `;

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Global functions for modal controls
function closeApplicationModal() {
    if (window.adminApp) {
        window.adminApp.closeApplicationModal();
    }
}

function closeSuccessModal() {
    if (window.adminApp) {
        window.adminApp.closeSuccessModal();
    }
}

// Initialize the admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApplicationsDashboard();
});