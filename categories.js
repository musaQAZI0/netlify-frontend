// Category Navigation System
class CategoryManager {
    constructor() {
        this.categories = [
            {
                id: 'nightlife',
                name: 'Nightlife',
                icon: '🌙',
                description: 'Electrify your nights with parties, music, comedy, and more.',
                page: 'NIGHTLIFE.html',
                color: '#8B5CF6',
                subcategories: ['Parties', 'Clubs', 'Bars', 'Music Events', 'Comedy Shows']
            },
            {
                id: 'music',
                name: 'Music',
                icon: '🎵',
                description: 'Live concerts, festivals, and musical performances.',
                page: 'music.html',
                color: '#EF4444',
                subcategories: ['Concerts', 'Festivals', 'Live Music', 'DJ Events']
            },
            {
                id: 'food-drink',
                name: 'Food & Drink',
                icon: '🍕',
                description: 'Food festivals, wine tastings, and culinary experiences.',
                page: 'food-drink.html',
                color: '#F59E0B',
                subcategories: ['Food Festivals', 'Wine Tasting', 'Cooking Classes', 'Restaurant Events']
            },
            {
                id: 'business',
                name: 'Business',
                icon: '💼',
                description: 'Networking events, conferences, and professional development.',
                page: 'business.html',
                color: '#059669',
                subcategories: ['Conferences', 'Networking', 'Workshops', 'Seminars']
            },
            {
                id: 'arts',
                name: 'Arts & Culture',
                icon: '🎨',
                description: 'Art exhibitions, theater shows, and cultural events.',
                page: 'arts.html',
                color: '#DC2626',
                subcategories: ['Exhibitions', 'Theater', 'Museums', 'Cultural Events']
            },
            {
                id: 'sports',
                name: 'Sports & Fitness',
                icon: '⚽',
                description: 'Sports events, fitness classes, and outdoor activities.',
                page: 'sports.html',
                color: '#2563EB',
                subcategories: ['Sports Events', 'Fitness Classes', 'Outdoor Activities', 'Tournaments']
            },
            {
                id: 'community',
                name: 'Community',
                icon: '👥',
                description: 'Local meetups, social gatherings, and community events.',
                page: 'community.html',
                color: '#7C3AED',
                subcategories: ['Meetups', 'Social Events', 'Volunteering', 'Local Events']
            },
            {
                id: 'family',
                name: 'Family & Education',
                icon: '👨‍👩‍👧‍👦',
                description: 'Family-friendly events, workshops, and educational activities.',
                page: 'family.html',
                color: '#059669',
                subcategories: ['Kids Events', 'Educational', 'Family Activities', 'Workshops']
            }
        ];
        
        this.currentCategory = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.detectCurrentCategory();
    }

    // Detect current category based on page URL
    detectCurrentCategory() {
        const currentPage = window.location.pathname.split('/').pop().toLowerCase();
        this.currentCategory = this.categories.find(cat => 
            currentPage.includes(cat.id) || currentPage === cat.page
        );
    }

    // Navigate to category page
    navigateToCategory(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        if (category) {
            // Store category preference if user is logged in
            if (window.authManager?.isUserAuthenticated()) {
                this.updateUserPreferences(categoryId);
            }
            
            // Navigate to category page
            window.location.href = category.page;
        }
    }

    // Update user preferences
    async updateUserPreferences(categoryId) {
        const user = window.authManager?.getCurrentUser();
        if (user) {
            try {
                await fetch('/api/user/preferences', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${window.authManager.getStoredToken()}`
                    },
                    body: JSON.stringify({
                        userId: user.id,
                        preferences: {
                            ...user.preferences,
                            recentCategories: [categoryId, ...(user.preferences?.recentCategories || [])].slice(0, 5)
                        }
                    })
                });
            } catch (error) {
                console.error('Failed to update user preferences:', error);
                // Fallback to local storage
                this.updateLocalPreferences(categoryId);
            }
        }
    }

    // Update local preferences
    updateLocalPreferences(categoryId) {
        const user = window.authManager?.getCurrentUser();
        if (user) {
            const recentCategories = user.preferences?.recentCategories || [];
            user.preferences = {
                ...user.preferences,
                recentCategories: [categoryId, ...recentCategories.filter(id => id !== categoryId)].slice(0, 5)
            };
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.authManager.currentUser = user;
        }
    }

    // Get categories for user
    getCategoriesForUser() {
        const user = window.authManager?.getCurrentUser();
        let categories = [...this.categories];

        if (user?.preferences?.recentCategories) {
            // Sort by recent usage
            const recentIds = user.preferences.recentCategories;
            categories.sort((a, b) => {
                const aIndex = recentIds.indexOf(a.id);
                const bIndex = recentIds.indexOf(b.id);
                
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                
                return aIndex - bIndex;
            });
        }

        return categories;
    }

    // Create category navigation HTML
    createCategoryNavigation() {
        const categories = this.getCategoriesForUser();
        
        return `
            <div class="category-navigation">
                <div class="category-grid">
                    ${categories.map(category => `
                        <div class="category-card" data-category="${category.id}" 
                             onclick="categoryManager.navigateToCategory('${category.id}')"
                             style="--category-color: ${category.color}">
                            <div class="category-icon">${category.icon}</div>
                            <h3 class="category-title">${category.name}</h3>
                            <p class="category-description">${category.description}</p>
                            <div class="category-subcategories">
                                ${category.subcategories.slice(0, 3).map(sub => `
                                    <span class="subcategory-tag">${sub}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Add category navigation styles
    addCategoryStyles() {
        if (document.getElementById('category-styles')) return;

        const style = document.createElement('style');
        style.id = 'category-styles';
        style.textContent = `
            .category-navigation {
                padding: 40px 24px;
                background: rgba(255, 255, 255, 0.95);
                margin: 40px 24px;
                border-radius: 24px;
                backdrop-filter: blur(10px);
            }

            .category-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 24px;
                max-width: 1200px;
                margin: 0 auto;
            }

            .category-card {
                background: white;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
                transition: all 0.3s ease;
                cursor: pointer;
                border: 2px solid transparent;
                position: relative;
                overflow: hidden;
            }

            .category-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--category-color);
            }

            .category-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                border-color: var(--category-color);
            }

            .category-icon {
                font-size: 2.5rem;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                justify-content: flex-start;
            }

            .category-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #333;
                margin-bottom: 8px;
            }

            .category-description {
                color: #666;
                font-size: 14px;
                line-height: 1.5;
                margin-bottom: 16px;
            }

            .category-subcategories {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .subcategory-tag {
                background: rgba(0, 0, 0, 0.05);
                color: #666;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
            }

            .category-card:hover .subcategory-tag {
                background: var(--category-color);
                color: white;
            }

            @media (max-width: 768px) {
                .category-grid {
                    grid-template-columns: 1fr;
                    gap: 16px;
                }
                
                .category-navigation {
                    margin: 20px 16px;
                    padding: 24px 16px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for auth state changes
        window.addEventListener('authStateChanged', (e) => {
            this.updateCategoryNavigation();
        });

        // Handle category clicks in existing elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-category]')) {
                const categoryId = e.target.closest('[data-category]').dataset.category;
                this.navigateToCategory(categoryId);
            }
        });
    }

    // Update category navigation when auth state changes
    updateCategoryNavigation() {
        const existingNav = document.querySelector('.category-navigation');
        if (existingNav) {
            existingNav.outerHTML = this.createCategoryNavigation();
        }
    }

    // Get current category
    getCurrentCategory() {
        return this.currentCategory;
    }

    // Get category by ID
    getCategoryById(id) {
        return this.categories.find(cat => cat.id === id);
    }

    // Search categories
    searchCategories(query) {
        const lowerQuery = query.toLowerCase();
        return this.categories.filter(category => 
            category.name.toLowerCase().includes(lowerQuery) ||
            category.description.toLowerCase().includes(lowerQuery) ||
            category.subcategories.some(sub => sub.toLowerCase().includes(lowerQuery))
        );
    }
}

// Initialize category manager
window.categoryManager = new CategoryManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}