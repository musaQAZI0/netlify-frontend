// Admin Monetize Applications Management
class AdminMonetizeApp {
    constructor() {
        // Use environment-specific API URL
        this.apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3003/api/monetize'
            : 'https://crowd-backend-zxxp.onrender.com/api/monetize';
        this.currentUser = null;
        this.applications = [];
        this.stats = {};
        this.currentPage = 1;
        this.totalPages = 1;
        this.limit = 20;
        this.currentApplicationId = null;

        this.init();
    }

    async init() {
        await this.checkAuth();
        if (this.currentUser && this.currentUser.isAdmin) {
            this.setupEventListeners();
            await this.loadStats();
            await this.loadApplications();
        } else {
            this.redirectToLogin();
        }
    }

    async checkAuth() {
        try {
            const adminToken = localStorage.getItem('adminToken');
            if (!adminToken) {
                this.redirectToLogin();
                return;
            }

            // Validate admin session
            const response = await fetch(this.apiBaseUrl.replace('/monetize', '/admin/validate'), {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.currentUser = result.admin;
                this.updateUIForAuthenticatedUser();
            } else {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminUser');
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Admin auth check failed:', error);
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            this.redirectToLogin();
        }
    }

    redirectToLogin() {
        const currentUrl = encodeURIComponent(window.location.pathname);
        window.location.href = `admin-login.html?redirect=${currentUrl}`;
    }

    updateUIForAuthenticatedUser() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userInitials = document.getElementById('userInitials');

        if (this.currentUser) {
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
        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // User menu toggle
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

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchApplications(e.target.value);
                }, 500);
            });
        }

        // Status form
        const statusForm = document.getElementById('statusForm');
        if (statusForm) {
            statusForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.updateApplicationStatus();
            });
        }

        // Filter changes
        ['statusFilter', 'typeFilter', 'sortBy'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.applyFilters());
            }
        });
    }

    async logout() {
        try {
            // Call admin logout endpoint
            const adminToken = localStorage.getItem('adminToken');
            if (adminToken) {
                await fetch(this.apiBaseUrl.replace('/monetize', '/admin/logout'), {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                    }
                });
            }

            // Clear admin session
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');

            // Redirect to admin access page
            window.location.href = 'admin-access.html';
        } catch (error) {
            console.error('Admin logout failed:', error);
            // Still clear local storage even if API call fails
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            window.location.href = 'admin-access.html';
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                this.stats = result;
                this.displayStats();
            } else {
                throw new Error(result.error || 'Failed to load stats');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            this.showNotification('Failed to load statistics', 'error');
        }
    }

    displayStats() {
        const container = document.getElementById('statsContainer');
        if (!container) return;

        const statsHTML = `
            <div class="stat-card">
                <div class="stat-number">${this.stats.total || 0}</div>
                <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.pending || 0}</div>
                <div class="stat-label">Pending Review</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.approved || 0}</div>
                <div class="stat-label">Approved</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.influencers || 0}</div>
                <div class="stat-label">Influencers</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.venues || 0}</div>
                <div class="stat-label">Venues</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.stats.recentApplications || 0}</div>
                <div class="stat-label">This Week</div>
            </div>
        `;

        container.innerHTML = statsHTML;
    }

    async loadApplications(page = 1) {
        try {
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            const typeFilter = document.getElementById('typeFilter')?.value || '';
            const sortBy = document.getElementById('sortBy')?.value || 'submissionDate';

            const params = new URLSearchParams({
                page: page.toString(),
                limit: this.limit.toString(),
                sortBy,
                sortOrder: 'desc'
            });

            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('type', typeFilter);

            const response = await fetch(`${this.apiBaseUrl}/admin/applications?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                this.applications = result.applications;
                this.currentPage = result.pagination.page;
                this.totalPages = result.pagination.pages;
                this.displayApplications();
                this.displayPagination();
            } else {
                throw new Error(result.error || 'Failed to load applications');
            }
        } catch (error) {
            console.error('Error loading applications:', error);
            this.showNotification('Failed to load applications', 'error');
        }
    }

    displayApplications() {
        const container = document.getElementById('applicationsContainer');
        if (!container) return;

        if (this.applications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox fa-3x" style="color: #ddd; margin-bottom: 1rem;"></i>
                    <h3>No Applications Found</h3>
                    <p>No monetize applications match your current filters.</p>
                </div>
            `;
            return;
        }

        const applicationsHTML = this.applications.map(app => this.renderApplicationCard(app)).join('');
        container.innerHTML = `<div class="application-grid">${applicationsHTML}</div>`;
    }

    renderApplicationCard(app) {
        const typeIcon = app.applicationType === 'influencer' ? 'fas fa-star' : 'fas fa-building';
        const typeClass = `app-type-${app.applicationType}`;
        const statusClass = `status-${app.status.replace('_', '_')}`;

        const submissionDate = new Date(app.submissionDate).toLocaleDateString();
        const lastUpdate = new Date(app.lastUpdated).toLocaleDateString();

        // Get key metrics based on type
        let keyMetrics = '';
        if (app.applicationType === 'influencer' && app.influencerDetails) {
            const totalFollowers = app.totalFollowers || 0;
            const niche = app.influencerDetails.niche || 'Not specified';
            keyMetrics = `
                <div class="detail-item">
                    <div class="detail-label">Total Followers</div>
                    <div class="detail-value">${totalFollowers.toLocaleString()}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Niche</div>
                    <div class="detail-value">${niche}</div>
                </div>
            `;
        } else if (app.applicationType === 'venue' && app.venueDetails) {
            const capacity = app.venueDetails.capacity || 0;
            const venueType = app.venueDetails.venueType || 'Not specified';
            keyMetrics = `
                <div class="detail-item">
                    <div class="detail-label">Capacity</div>
                    <div class="detail-value">${capacity} people</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Venue Type</div>
                    <div class="detail-value">${venueType}</div>
                </div>
            `;
        }

        return `
            <div class="application-item">
                <div class="app-header">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div class="app-type-icon ${typeClass}">
                            <i class="${typeIcon}"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; color: #333;">${app.businessInfo.businessName}</h3>
                            <p style="margin: 0.25rem 0 0 0; color: #666; font-size: 0.9rem;">
                                ${app.contactInfo.fullName} • ${app.contactInfo.email}
                            </p>
                        </div>
                    </div>
                    <div class="status-badge ${statusClass}">
                        ${this.formatStatus(app.status)}
                    </div>
                </div>

                <div class="app-details">
                    <div class="detail-item">
                        <div class="detail-label">Application ID</div>
                        <div class="detail-value">${app.applicationId || app._id.slice(-6)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Type</div>
                        <div class="detail-value">${app.applicationType}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Submitted</div>
                        <div class="detail-value">${submissionDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Last Updated</div>
                        <div class="detail-value">${lastUpdate}</div>
                    </div>
                    ${keyMetrics}
                </div>

                ${app.reviewerNotes ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                        <strong>Review Notes:</strong>
                        <p style="margin: 0.5rem 0 0 0; color: #666;">${app.reviewerNotes}</p>
                    </div>
                ` : ''}

                <div class="app-actions">
                    <button class="btn btn-view" onclick="viewApplication('${app._id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-review" onclick="updateStatus('${app._id}')">
                        <i class="fas fa-edit"></i> Update Status
                    </button>
                    ${app.status === 'pending' ? `
                        <button class="btn btn-approve" onclick="quickStatusUpdate('${app._id}', 'approved')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-reject" onclick="quickStatusUpdate('${app._id}', 'rejected')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    formatStatus(status) {
        const statusMap = {
            'pending': 'Pending Review',
            'under_review': 'Under Review',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'needs_info': 'Needs Information'
        };
        return statusMap[status] || status;
    }

    displayPagination() {
        const container = document.getElementById('paginationContainer');
        if (!container || this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="loadPage(${this.currentPage - 1})">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }

        // Page numbers
        for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, this.currentPage + 2); i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            paginationHTML += `<button class="page-btn ${activeClass}" onclick="loadPage(${i})">${i}</button>`;
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            paginationHTML += `<button class="page-btn" onclick="loadPage(${this.currentPage + 1})">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        container.innerHTML = paginationHTML;
    }

    async searchApplications(query) {
        if (!query.trim()) {
            await this.loadApplications();
            return;
        }

        try {
            const statusFilter = document.getElementById('statusFilter')?.value || '';
            const typeFilter = document.getElementById('typeFilter')?.value || '';

            const params = new URLSearchParams({ q: query });
            if (statusFilter) params.append('status', statusFilter);
            if (typeFilter) params.append('type', typeFilter);

            const response = await fetch(`${this.apiBaseUrl}/admin/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                this.applications = result.applications;
                this.displayApplications();
                // Hide pagination for search results
                document.getElementById('paginationContainer').innerHTML = '';
            } else {
                throw new Error(result.error || 'Search failed');
            }
        } catch (error) {
            console.error('Error searching applications:', error);
            this.showNotification('Search failed', 'error');
        }
    }

    async viewApplication(applicationId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/application/${applicationId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            const result = await response.json();
            if (response.ok) {
                this.showApplicationDetails(result.application);
            } else {
                throw new Error(result.error || 'Failed to load application details');
            }
        } catch (error) {
            console.error('Error loading application details:', error);
            this.showNotification('Failed to load application details', 'error');
        }
    }

    showApplicationDetails(app) {
        const modal = document.getElementById('applicationModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');

        modalTitle.textContent = `${app.businessInfo.businessName} - ${app.applicationType} Application`;

        let detailsHTML = `
            <div style="display: grid; gap: 2rem;">
                <!-- Contact Information -->
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Contact Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Full Name:</strong> ${app.contactInfo.fullName}</div>
                        <div><strong>Email:</strong> ${app.contactInfo.email}</div>
                        <div><strong>Phone:</strong> ${app.contactInfo.phone}</div>
                    </div>
                </div>

                <!-- Business Information -->
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Business Information</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Business Name:</strong> ${app.businessInfo.businessName}</div>
                        ${app.businessInfo.website ? `<div><strong>Website:</strong> <a href="${app.businessInfo.website}" target="_blank">${app.businessInfo.website}</a></div>` : ''}
                    </div>
                </div>
        `;

        if (app.applicationType === 'influencer' && app.influencerDetails) {
            const details = app.influencerDetails;
            detailsHTML += `
                <!-- Influencer Details -->
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Influencer Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Niche:</strong> ${details.niche || 'Not specified'}</div>
                        <div><strong>Instagram:</strong> ${details.followerCount?.instagram?.toLocaleString() || 0} followers</div>
                        <div><strong>TikTok:</strong> ${details.followerCount?.tiktok?.toLocaleString() || 0} followers</div>
                        <div><strong>YouTube:</strong> ${details.followerCount?.youtube?.toLocaleString() || 0} subscribers</div>
                        <div><strong>Engagement Rate:</strong> ${details.avgEngagementRate || 0}%</div>
                        <div><strong>Total Followers:</strong> ${app.totalFollowers?.toLocaleString() || 0}</div>
                    </div>
                    ${details.contentTypes?.length ? `
                        <div style="margin-top: 1rem;">
                            <strong>Content Types:</strong> ${details.contentTypes.join(', ')}
                        </div>
                    ` : ''}
                    ${details.previousBrandPartnerships ? `
                        <div style="margin-top: 1rem;">
                            <strong>Previous Brand Partnerships:</strong>
                            <p style="margin-top: 0.5rem; color: #666;">${details.previousBrandPartnerships}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        if (app.applicationType === 'venue' && app.venueDetails) {
            const details = app.venueDetails;
            detailsHTML += `
                <!-- Venue Details -->
                <div>
                    <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Venue Details</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div><strong>Venue Type:</strong> ${details.venueType || 'Not specified'}</div>
                        <div><strong>Capacity:</strong> ${details.capacity || 0} people</div>
                        <div><strong>Hourly Rate:</strong> $${details.pricing?.hourlyRate || 0}</div>
                        <div><strong>Daily Rate:</strong> $${details.pricing?.dailyRate || 0}</div>
                    </div>
                    ${details.location ? `
                        <div style="margin-top: 1rem;">
                            <strong>Location:</strong>
                            ${details.location.address}, ${details.location.city}, ${details.location.state} ${details.location.zipCode}
                        </div>
                    ` : ''}
                    ${details.eventTypes?.length ? `
                        <div style="margin-top: 1rem;">
                            <strong>Event Types:</strong> ${details.eventTypes.join(', ')}
                        </div>
                    ` : ''}
                    ${details.amenities?.length ? `
                        <div style="margin-top: 1rem;">
                            <strong>Amenities:</strong> ${details.amenities.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Application Status
        detailsHTML += `
            <div>
                <h3 style="color: var(--primary-color); margin-bottom: 1rem;">Application Status</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div><strong>Status:</strong> <span class="status-badge status-${app.status}">${this.formatStatus(app.status)}</span></div>
                    <div><strong>Submitted:</strong> ${new Date(app.submissionDate).toLocaleDateString()}</div>
                    <div><strong>Last Updated:</strong> ${new Date(app.lastUpdated).toLocaleDateString()}</div>
                    ${app.reviewDate ? `<div><strong>Reviewed:</strong> ${new Date(app.reviewDate).toLocaleDateString()}</div>` : ''}
                </div>
                ${app.reviewerNotes ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #f8f9fa; border-radius: 6px;">
                        <strong>Review Notes:</strong>
                        <p style="margin: 0.5rem 0 0 0; color: #666;">${app.reviewerNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        detailsHTML += '</div>';
        modalBody.innerHTML = detailsHTML;
        modal.style.display = 'block';
    }

    updateStatus(applicationId) {
        this.currentApplicationId = applicationId;
        const modal = document.getElementById('statusModal');
        modal.style.display = 'block';
    }

    async updateApplicationStatus() {
        try {
            const newStatus = document.getElementById('newStatus').value;
            const notes = document.getElementById('reviewNotes').value;

            if (!newStatus) {
                this.showNotification('Please select a status', 'warning');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/admin/application/${this.currentApplicationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status: newStatus, notes })
            });

            const result = await response.json();
            if (response.ok) {
                this.showNotification('Application status updated successfully', 'success');
                this.closeStatusModal();
                await this.loadApplications(this.currentPage);
                await this.loadStats();
            } else {
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            this.showNotification('Failed to update application status', 'error');
        }
    }

    async quickStatusUpdate(applicationId, status) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/admin/application/${applicationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify({ status })
            });

            const result = await response.json();
            if (response.ok) {
                this.showNotification(`Application ${status} successfully`, 'success');
                await this.loadApplications(this.currentPage);
                await this.loadStats();
            } else {
                throw new Error(result.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating application status:', error);
            this.showNotification('Failed to update application status', 'error');
        }
    }

    closeModal() {
        document.getElementById('applicationModal').style.display = 'none';
    }

    closeStatusModal() {
        document.getElementById('statusModal').style.display = 'none';
        document.getElementById('statusForm').reset();
        this.currentApplicationId = null;
    }

    applyFilters() {
        this.currentPage = 1;
        this.loadApplications();
    }

    loadPage(page) {
        this.loadApplications(page);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            max-width: 400px;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            border-left: 4px solid ${type === 'error' ? '#dc3545' : type === 'warning' ? '#ffc107' : type === 'success' ? '#28a745' : '#007bff'};
        `;

        notification.innerHTML = `
            <div style="padding: 1rem; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;">
                <div style="flex: 1;">
                    <div style="color: #333; font-weight: 500; margin-bottom: 0.25rem;">
                        ${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Info'}
                    </div>
                    <div style="color: #666; font-size: 0.9rem;">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; padding: 0.25rem;">
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

// Global functions for HTML onclick handlers
function viewApplication(id) {
    window.adminMonetizeApp.viewApplication(id);
}

function updateStatus(id) {
    window.adminMonetizeApp.updateStatus(id);
}

function quickStatusUpdate(id, status) {
    window.adminMonetizeApp.quickStatusUpdate(id, status);
}

function closeModal() {
    window.adminMonetizeApp.closeModal();
}

function closeStatusModal() {
    window.adminMonetizeApp.closeStatusModal();
}

function applyFilters() {
    window.adminMonetizeApp.applyFilters();
}

function loadPage(page) {
    window.adminMonetizeApp.loadPage(page);
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminMonetizeApp = new AdminMonetizeApp();
});