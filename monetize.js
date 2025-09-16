// Eventbrite-style Monetize Page JavaScript
class MonetizeApp {
    constructor() {
        // Use environment-specific API URL
        this.apiBaseUrl = window.location.hostname === 'localhost'
            ? 'http://localhost:3003/api/monetize'
            : 'https://crowd-backend-zxxp.onrender.com/api/monetize';
        this.currentUser = null;
        this.applications = [];
        this.currentStep = 1;
        this.totalSteps = 4;
        this.applicationType = null;

        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        
        if (this.currentUser) {
            await this.loadMyApplications();
        }
    }

    async checkAuth() {
        try {
            if (window.authAPI && window.authAPI.isAuthenticated()) {
                this.currentUser = await window.authAPI.getCurrentUser();
                this.updateUIForAuthenticatedUser();
            } else {
                this.updateUIForUnauthenticatedUser();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.updateUIForUnauthenticatedUser();
        }
    }

    updateUIForAuthenticatedUser() {
        // Hide login/signup buttons, show user menu
        document.getElementById('loginBtn').style.display = 'none';
        document.getElementById('signupBtn').style.display = 'none';
        
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userInitials = document.getElementById('userInitials');
        
        if (userMenu && this.currentUser) {
            userMenu.style.display = 'block';
            
            // Show admin links if user is admin
            if (this.currentUser.isAdmin) {
                const adminLinks = document.querySelectorAll('.admin-only');
                adminLinks.forEach(link => {
                    link.style.display = 'flex';
                });
            }
            
            if (userName) userName.textContent = this.currentUser.username || 'User';
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

    updateUIForUnauthenticatedUser() {
        // Show login/signup buttons, hide user menu
        document.getElementById('loginBtn').style.display = 'inline-flex';
        document.getElementById('signupBtn').style.display = 'inline-flex';
        document.getElementById('userMenu').style.display = 'none';
    }

    setupEventListeners() {
        // Navigation buttons
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
        
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = 'signup.html';
            });
        }

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

        // Logout functionality
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // Form submission
        const applicationForm = document.getElementById('applicationForm');
        if (applicationForm) {
            applicationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitApplication();
            });
        }

        // Modal close handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('eb-modal-backdrop')) {
                this.closeModal();
            }
        });

        // Form navigation
        this.updateFormNavigation();
    }

    async logout() {
        try {
            if (window.authAPI) {
                await window.authAPI.logout();
            }
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout failed:', error);
            this.showNotification('Logout failed. Please try again.', 'error');
        }
    }

    showInfluencerForm() {
        if (!this.currentUser) {
            this.showNotification('Please log in to apply as a creator.', 'warning');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        this.applicationType = 'influencer';
        this.setupInfluencerForm();
        this.showModal('Apply as Creator');
    }

    showVenueForm() {
        if (!this.currentUser) {
            this.showNotification('Please log in to apply as a venue partner.', 'warning');
            setTimeout(() => window.location.href = 'login.html', 2000);
            return;
        }

        this.applicationType = 'venue';
        this.setupVenueForm();
        this.showModal('Apply as Venue Partner');
    }

    setupInfluencerForm() {
        this.totalSteps = 4;
        const form = document.getElementById('applicationForm');
        
        // Clear existing steps except first one
        const existingSteps = form.querySelectorAll('.eb-form-step:not([data-step="1"])');
        existingSteps.forEach(step => step.remove());

        // Add influencer-specific steps
        this.addInfluencerSteps(form);
        this.updateProgress();
    }

    setupVenueForm() {
        this.totalSteps = 4;
        const form = document.getElementById('applicationForm');
        
        // Clear existing steps except first one
        const existingSteps = form.querySelectorAll('.eb-form-step:not([data-step="1"])');
        existingSteps.forEach(step => step.remove());

        // Add venue-specific steps
        this.addVenueSteps(form);
        this.updateProgress();
    }

    addInfluencerSteps(form) {
        const step2HTML = `
            <div class="eb-form-step" data-step="2">
                <div class="eb-form-step-header">
                    <h3 class="eb-form-step-title">Social Media Presence</h3>
                    <p class="eb-form-step-subtitle">Tell us about your social media platforms</p>
                </div>
                <div class="eb-form-grid">
                    <div class="eb-form-group">
                        <label class="eb-form-label">Primary Niche *</label>
                        <select class="eb-form-select" name="niche" required>
                            <option value="">Select your niche</option>
                            <option value="music">Music & Entertainment</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="fitness">Fitness & Health</option>
                            <option value="food">Food & Dining</option>
                            <option value="travel">Travel</option>
                            <option value="fashion">Fashion</option>
                            <option value="tech">Technology</option>
                            <option value="nightlife">Nightlife & Parties</option>
                            <option value="business">Business</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Instagram Handle</label>
                        <input type="text" class="eb-form-input" name="instagram" placeholder="@username">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Instagram Followers</label>
                        <input type="number" class="eb-form-input" name="instagram_followers" placeholder="10000">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">TikTok Handle</label>
                        <input type="text" class="eb-form-input" name="tiktok" placeholder="@username">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">TikTok Followers</label>
                        <input type="number" class="eb-form-input" name="tiktok_followers" placeholder="5000">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">YouTube Channel</label>
                        <input type="text" class="eb-form-input" name="youtube" placeholder="Channel name or URL">
                    </div>
                </div>
            </div>
        `;

        const step3HTML = `
            <div class="eb-form-step" data-step="3">
                <div class="eb-form-step-header">
                    <h3 class="eb-form-step-title">Content & Engagement</h3>
                    <p class="eb-form-step-subtitle">Help us understand your content strategy</p>
                </div>
                <div class="eb-form-grid">
                    <div class="eb-form-group">
                        <label class="eb-form-label">Average Engagement Rate (%)</label>
                        <input type="number" class="eb-form-input" name="engagement" step="0.1" min="0" max="100" placeholder="5.5">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">YouTube Subscribers</label>
                        <input type="number" class="eb-form-input" name="youtube_followers" placeholder="1000">
                    </div>
                </div>
                <div class="eb-form-group">
                    <label class="eb-form-label">Content Types (Select all that apply)</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s;">
                            <input type="checkbox" name="content_types" value="posts" style="width: auto; margin: 0;"> Social Media Posts
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s;">
                            <input type="checkbox" name="content_types" value="stories" style="width: auto; margin: 0;"> Stories
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s;">
                            <input type="checkbox" name="content_types" value="reels" style="width: auto; margin: 0;"> Reels/Short Videos
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem; border-radius: 0.5rem; transition: background-color 0.2s;">
                            <input type="checkbox" name="content_types" value="videos" style="width: auto; margin: 0;"> Long-form Videos
                        </label>
                    </div>
                </div>
                <div class="eb-form-group">
                    <label class="eb-form-label">Previous Brand Partnerships</label>
                    <textarea class="eb-form-textarea" name="partnerships" rows="4" placeholder="Describe your experience with brand partnerships, notable collaborations, etc."></textarea>
                </div>
            </div>
        `;

        const step4HTML = `
            <div class="eb-form-step" data-step="4">
                <div class="eb-form-step-header">
                    <h3 class="eb-form-step-title">Rate Information</h3>
                    <p class="eb-form-step-subtitle">Help us understand your typical rates (optional)</p>
                </div>
                <div class="eb-form-grid">
                    <div class="eb-form-group">
                        <label class="eb-form-label">Rate per Post ($)</label>
                        <input type="number" class="eb-form-input" name="rate_post" min="0" placeholder="500">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Rate per Story ($)</label>
                        <input type="number" class="eb-form-input" name="rate_story" min="0" placeholder="200">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Rate per Reel ($)</label>
                        <input type="number" class="eb-form-input" name="rate_reel" min="0" placeholder="750">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Rate per Video ($)</label>
                        <input type="number" class="eb-form-input" name="rate_video" min="0" placeholder="1000">
                    </div>
                </div>
                <div class="eb-form-group">
                    <label class="eb-form-label">Website/Portfolio</label>
                    <input type="url" class="eb-form-input" name="website" placeholder="https://yourwebsite.com">
                </div>
            </div>
        `;

        const navigation = form.querySelector('.eb-form-navigation');
        navigation.insertAdjacentHTML('beforebegin', step2HTML + step3HTML + step4HTML);
    }

    addVenueSteps(form) {
        const step2HTML = `
            <div class="eb-form-step" data-step="2">
                <div class="eb-form-step-header">
                    <h3 class="eb-form-step-title">Venue Details</h3>
                    <p class="eb-form-step-subtitle">Tell us about your venue</p>
                </div>
                <div class="eb-form-grid">
                    <div class="eb-form-group">
                        <label class="eb-form-label">Venue Type *</label>
                        <select class="eb-form-select" name="venueType" required>
                            <option value="">Select venue type</option>
                            <option value="restaurant">Restaurant</option>
                            <option value="bar">Bar/Lounge</option>
                            <option value="nightclub">Nightclub</option>
                            <option value="event_space">Event Space</option>
                            <option value="hotel">Hotel/Conference Center</option>
                            <option value="outdoor">Outdoor Venue</option>
                            <option value="rooftop">Rooftop</option>
                            <option value="warehouse">Warehouse</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Maximum Capacity *</label>
                        <input type="number" class="eb-form-input" name="capacity" min="1" required placeholder="200">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Street Address *</label>
                        <input type="text" class="eb-form-input" name="address" required placeholder="123 Main Street">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">City *</label>
                        <input type="text" class="eb-form-input" name="city" required placeholder="New York">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">State *</label>
                        <input type="text" class="eb-form-input" name="state" required placeholder="NY">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">ZIP Code *</label>
                        <input type="text" class="eb-form-input" name="zipCode" required placeholder="10001">
                    </div>
                </div>
            </div>
        `;

        const step3HTML = `
            <div class="eb-form-step" data-step="3">
                <div class="eb-form-step-header">
                    <h3 class="eb-form-step-title">Event Types & Amenities</h3>
                    <p class="eb-form-step-subtitle">What can your venue accommodate?</p>
                </div>
                <div class="eb-form-group">
                    <label class="eb-form-label">Event Types (Select all that apply)</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="event_types" value="concerts" style="width: auto; margin: 0;"> Concerts/Live Music
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="event_types" value="parties" style="width: auto; margin: 0;"> Private Parties
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="event_types" value="corporate" style="width: auto; margin: 0;"> Corporate Events
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="event_types" value="weddings" style="width: auto; margin: 0;"> Weddings
                        </label>
                    </div>
                </div>
                <div class="eb-form-group">
                    <label class="eb-form-label">Amenities (Select all that apply)</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="amenities" value="sound_system" style="width: auto; margin: 0;"> Sound System
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="amenities" value="lighting" style="width: auto; margin: 0;"> Professional Lighting
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="amenities" value="bar" style="width: auto; margin: 0;"> Full Bar Service
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="amenities" value="parking" style="width: auto; margin: 0;"> Parking Available
                        </label>
                    </div>
                </div>
            </div>
        `;

        const step4HTML = `
            <div class="eb-form-step" data-step="4">
                <div class="eb-form-step-header">
                    <h3 class="eb-form-step-title">Pricing & Licenses</h3>
                    <p class="eb-form-step-subtitle">Final details about your venue</p>
                </div>
                <div class="eb-form-grid">
                    <div class="eb-form-group">
                        <label class="eb-form-label">Hourly Rate ($)</label>
                        <input type="number" class="eb-form-input" name="hourly_rate" min="0" placeholder="500">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Daily Rate ($)</label>
                        <input type="number" class="eb-form-input" name="daily_rate" min="0" placeholder="3000">
                    </div>
                    <div class="eb-form-group">
                        <label class="eb-form-label">Website</label>
                        <input type="url" class="eb-form-input" name="website" placeholder="https://yourvenue.com">
                    </div>
                </div>
                <div class="eb-form-group">
                    <label class="eb-form-label">Licenses & Permits (Check all that apply)</label>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="licenses" value="liquor" style="width: auto; margin: 0;"> Liquor License
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="licenses" value="music" style="width: auto; margin: 0;"> Music License
                        </label>
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; padding: 0.5rem;">
                            <input type="checkbox" name="licenses" value="event" style="width: auto; margin: 0;"> Event Permit
                        </label>
                    </div>
                </div>
            </div>
        `;

        const navigation = form.querySelector('.eb-form-navigation');
        navigation.insertAdjacentHTML('beforebegin', step2HTML + step3HTML + step4HTML);
    }

    showModal(title) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('applicationModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.currentStep = 1;
        this.updateProgress();
        this.showStep(1);
    }

    closeModal() {
        document.getElementById('applicationModal').style.display = 'none';
        document.body.style.overflow = 'auto';
        this.resetForm();
    }

    resetForm() {
        this.currentStep = 1;
        document.getElementById('applicationForm').reset();
        this.showStep(1);
        this.updateProgress();
    }

    nextStep() {
        if (this.validateCurrentStep()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.showStep(this.currentStep);
                this.updateProgress();
                this.updateFormNavigation();
            }
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
            this.updateProgress();
            this.updateFormNavigation();
        }
    }

    showStep(stepNumber) {
        const steps = document.querySelectorAll('.eb-form-step');
        steps.forEach(step => {
            step.classList.remove('eb-form-step--active');
            if (parseInt(step.dataset.step) === stepNumber) {
                step.classList.add('eb-form-step--active');
            }
        });
    }

    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const currentStepSpan = document.getElementById('currentStep');
        const totalStepsSpan = document.getElementById('totalSteps');
        
        if (progressFill) {
            const percentage = (this.currentStep / this.totalSteps) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        
        if (currentStepSpan) currentStepSpan.textContent = this.currentStep;
        if (totalStepsSpan) totalStepsSpan.textContent = this.totalSteps;
    }

    updateFormNavigation() {
        const prevBtn = document.getElementById('prevStep');
        const nextBtn = document.getElementById('nextStep');
        const submitBtn = document.getElementById('submitApp');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        }
        
        if (nextBtn && submitBtn) {
            if (this.currentStep < this.totalSteps) {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
            }
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.querySelector(`.eb-form-step[data-step="${this.currentStep}"]`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        
        for (let field of requiredFields) {
            if (!field.value.trim()) {
                field.focus();
                this.showNotification(`Please fill in all required fields.`, 'warning');
                return false;
            }
        }
        return true;
    }

    async submitApplication() {
        try {
            this.showLoading(true);

            const formData = new FormData(document.getElementById('applicationForm'));
            const applicationData = this.buildApplicationData(formData);

            const endpoint = this.applicationType === 'influencer' ? '/apply/influencer' : '/apply/venue';
            
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(applicationData)
            });

            const result = await response.json();

            if (response.ok) {
                this.closeModal();
                this.showSuccessModal();
                await this.loadMyApplications();
            } else {
                throw new Error(result.error || 'Application submission failed');
            }

        } catch (error) {
            console.error('Error submitting application:', error);
            this.showNotification(error.message || 'Failed to submit application. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    buildApplicationData(formData) {
        const baseData = {
            contactInfo: {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            },
            businessInfo: {
                businessName: formData.get('businessName'),
                website: formData.get('website')
            }
        };

        if (this.applicationType === 'influencer') {
            baseData.influencerDetails = {
                niche: formData.get('niche'),
                followerCount: {
                    instagram: parseInt(formData.get('instagram_followers')) || 0,
                    tiktok: parseInt(formData.get('tiktok_followers')) || 0,
                    youtube: parseInt(formData.get('youtube_followers')) || 0
                },
                avgEngagementRate: parseFloat(formData.get('engagement')) || 0,
                previousBrandPartnerships: formData.get('partnerships'),
                contentTypes: formData.getAll('content_types'),
                rateCard: {
                    post: parseInt(formData.get('rate_post')) || 0,
                    story: parseInt(formData.get('rate_story')) || 0,
                    reel: parseInt(formData.get('rate_reel')) || 0,
                    video: parseInt(formData.get('rate_video')) || 0
                }
            };
            baseData.businessInfo.socialMedia = {
                instagram: formData.get('instagram'),
                tiktok: formData.get('tiktok'),
                youtube: formData.get('youtube')
            };
        } else if (this.applicationType === 'venue') {
            baseData.venueDetails = {
                venueType: formData.get('venueType'),
                capacity: parseInt(formData.get('capacity')),
                location: {
                    address: formData.get('address'),
                    city: formData.get('city'),
                    state: formData.get('state'),
                    zipCode: formData.get('zipCode')
                },
                eventTypes: formData.getAll('event_types'),
                amenities: formData.getAll('amenities'),
                pricing: {
                    hourlyRate: parseInt(formData.get('hourly_rate')) || 0,
                    dailyRate: parseInt(formData.get('daily_rate')) || 0
                },
                licenses: {
                    liquorLicense: formData.getAll('licenses').includes('liquor'),
                    musicLicense: formData.getAll('licenses').includes('music'),
                    eventPermit: formData.getAll('licenses').includes('event')
                }
            };
        }

        return baseData;
    }

    async loadMyApplications() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/my-applications`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.applications = result.applications;
                this.displayMyApplications();
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    }

    displayMyApplications() {
        const applicationsSection = document.getElementById('myApplications');
        const applicationsList = document.getElementById('applicationsList');

        if (!applicationsSection || !applicationsList) return;

        if (this.applications.length > 0) {
            applicationsList.innerHTML = this.applications.map(app => this.renderApplicationItem(app)).join('');
            applicationsSection.style.display = 'block';
        }
    }

    renderApplicationItem(application) {
        const statusClass = `status-${application.status.replace(' ', '_')}`;
        const typeIcon = application.applicationType === 'influencer' ? 'fas fa-star' : 'fas fa-building';
        const submissionDate = new Date(application.submissionDate).toLocaleDateString();

        return `
            <div class="eb-application-item">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <div style="width: 40px; height: 40px; background: var(--eb-orange); border-radius: var(--eb-radius-full); display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="${typeIcon}"></i>
                        </div>
                        <div>
                            <h4 style="font-weight: 600; color: var(--eb-gray-900); margin-bottom: 0.25rem;">
                                ${application.applicationType.charAt(0).toUpperCase() + application.applicationType.slice(1)} Partnership
                            </h4>
                            <p style="color: var(--eb-gray-600); font-size: var(--eb-font-size-sm);">
                                ${application.businessInfo.businessName}
                            </p>
                        </div>
                    </div>
                    <span class="eb-requirement-tag" style="background: ${this.getStatusColor(application.status)}; color: white; padding: 0.25rem 0.75rem; border-radius: var(--eb-radius-full); font-size: var(--eb-font-size-xs); font-weight: 600;">
                        ${this.formatStatus(application.status)}
                    </span>
                </div>
                <div style="display: flex; gap: 2rem; color: var(--eb-gray-600); font-size: var(--eb-font-size-sm);">
                    <span><strong>Submitted:</strong> ${submissionDate}</span>
                    ${application.reviewDate ? `<span><strong>Last Review:</strong> ${new Date(application.reviewDate).toLocaleDateString()}</span>` : ''}
                </div>
                ${application.reviewerNotes ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: var(--eb-gray-50); border-radius: var(--eb-radius-lg);">
                        <strong style="color: var(--eb-gray-800);">Admin Notes:</strong>
                        <p style="margin-top: 0.5rem; color: var(--eb-gray-700);">${application.reviewerNotes}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    getStatusColor(status) {
        const colors = {
            'pending': '#f59e0b',
            'under_review': '#3b82f6',
            'approved': '#10b981',
            'rejected': '#ef4444',
            'needs_info': '#f59e0b'
        };
        return colors[status] || '#64748b';
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

    showSuccessModal() {
        document.getElementById('successModal').style.display = 'flex';
    }

    closeSuccessModal() {
        document.getElementById('successModal').style.display = 'none';
    }

    viewMyApplications() {
        this.closeSuccessModal();
        const myApplicationsSection = document.getElementById('myApplications');
        if (myApplicationsSection) {
            myApplicationsSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: var(--eb-radius-xl);
            box-shadow: var(--eb-shadow-xl);
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
                    <div style="color: var(--eb-gray-800); font-weight: 500; margin-bottom: 0.25rem;">
                        ${type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : type === 'success' ? 'Success' : 'Info'}
                    </div>
                    <div style="color: var(--eb-gray-600); font-size: var(--eb-font-size-sm);">
                        ${message}
                    </div>
                </div>
                <button onclick="this.parentNode.parentNode.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--eb-gray-400); padding: 0.25rem;">
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

// Global functions for inline event handlers
function showInfluencerForm() {
    if (window.monetizeApp) {
        window.monetizeApp.showInfluencerForm();
    }
}

function showVenueForm() {
    if (window.monetizeApp) {
        window.monetizeApp.showVenueForm();
    }
}

function closeModal() {
    if (window.monetizeApp) {
        window.monetizeApp.closeModal();
    }
}

function nextStep() {
    if (window.monetizeApp) {
        window.monetizeApp.nextStep();
    }
}

function previousStep() {
    if (window.monetizeApp) {
        window.monetizeApp.previousStep();
    }
}

function closeSuccessModal() {
    if (window.monetizeApp) {
        window.monetizeApp.closeSuccessModal();
    }
}

function viewMyApplications() {
    if (window.monetizeApp) {
        window.monetizeApp.viewMyApplications();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.monetizeApp = new MonetizeApp();
});