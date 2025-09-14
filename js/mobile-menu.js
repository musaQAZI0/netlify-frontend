/**
 * Mobile Menu Functionality for Crowd Platform
 * Handles responsive navigation and mobile interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeResponsiveSearch();
    handleWindowResize();
});

/**
 * Initialize mobile navigation menu
 */
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const searchSection = document.querySelector('.search-section');

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', function() {
            toggleMobileNav();
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.nav-container') && navLinks) {
            navLinks.classList.remove('active');
            if (searchSection) {
                searchSection.classList.remove('active');
            }
            updateToggleIcon();
        }
    });

    // Close mobile menu when clicking on a nav link
    if (navLinks) {
        const navLinksItems = navLinks.querySelectorAll('a');
        navLinksItems.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navLinks.classList.remove('active');
                    if (searchSection) {
                        searchSection.classList.remove('active');
                    }
                    updateToggleIcon();
                }
            });
        });
    }
}

/**
 * Toggle mobile navigation menu
 */
function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    const searchSection = document.querySelector('.search-section');
    
    if (navLinks) {
        navLinks.classList.toggle('active');
        
        // Also toggle search section on mobile
        if (searchSection) {
            searchSection.classList.toggle('active');
        }
        
        updateToggleIcon();
    }
}

/**
 * Update mobile toggle icon based on menu state
 */
function updateToggleIcon() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileToggle && navLinks) {
        if (navLinks.classList.contains('active')) {
            mobileToggle.innerHTML = '<span></span><span></span><span></span>';
            mobileToggle.classList.add('active');
            // Animate hamburger to X
            mobileToggle.style.transform = 'rotate(90deg)';
        } else {
            mobileToggle.innerHTML = '☰';
            mobileToggle.classList.remove('active');
            mobileToggle.style.transform = 'rotate(0deg)';
        }
    }
}

/**
 * Initialize responsive search functionality
 */
function initializeResponsiveSearch() {
    const searchToggle = document.createElement('button');
    searchToggle.className = 'search-toggle-mobile';
    searchToggle.innerHTML = '🔍';
    searchToggle.style.display = 'none';
    
    const navContainer = document.querySelector('.nav-container');
    if (navContainer) {
        navContainer.appendChild(searchToggle);
    }
    
    searchToggle.addEventListener('click', function() {
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            searchSection.classList.toggle('active');
            
            // Focus on search input when opened
            if (searchSection.classList.contains('active')) {
                const searchInput = searchSection.querySelector('.search-input');
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            }
        }
    });
    
    // Show/hide search toggle based on screen size
    function updateSearchToggle() {
        if (window.innerWidth <= 768) {
            searchToggle.style.display = 'block';
        } else {
            searchToggle.style.display = 'none';
            const searchSection = document.querySelector('.search-section');
            if (searchSection) {
                searchSection.classList.remove('active');
            }
        }
    }
    
    window.addEventListener('resize', updateSearchToggle);
    updateSearchToggle();
}

/**
 * Handle window resize events
 */
function handleWindowResize() {
    let resizeTimeout;
    
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const navLinks = document.querySelector('.nav-links');
            const searchSection = document.querySelector('.search-section');
            
            // Reset mobile menu on desktop
            if (window.innerWidth > 768) {
                if (navLinks) {
                    navLinks.classList.remove('active');
                }
                if (searchSection) {
                    searchSection.classList.remove('active');
                }
                updateToggleIcon();
            }
            
            // Update mobile-specific elements
            updateMobileElements();
        }, 250);
    });
}

/**
 * Update mobile-specific elements based on screen size
 */
function updateMobileElements() {
    const isMobile = window.innerWidth <= 768;
    const isTablet = window.innerWidth <= 1024;
    
    // Handle card layouts
    const eventGrids = document.querySelectorAll('.events-grid, .event-cards, .cards-container');
    eventGrids.forEach(grid => {
        if (isMobile) {
            grid.style.gridTemplateColumns = '1fr';
        } else if (isTablet) {
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
        } else {
            grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        }
    });
    
    // Handle modal positions on mobile
    const modals = document.querySelectorAll('.modal, .popup');
    modals.forEach(modal => {
        if (isMobile) {
            modal.style.margin = '1rem';
            modal.style.maxHeight = '90vh';
        } else {
            modal.style.margin = '';
            modal.style.maxHeight = '';
        }
    });
}

/**
 * Initialize touch gestures for mobile
 */
function initializeTouchGestures() {
    let touchStartX = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    document.addEventListener('touchend', function(e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const navLinks = document.querySelector('.nav-links');
        
        if (touchEndX < touchStartX - swipeThreshold) {
            // Swipe left - close mobile menu
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                updateToggleIcon();
            }
        }
        
        if (touchEndX > touchStartX + swipeThreshold) {
            // Swipe right - open mobile menu (if at edge)
            if (touchStartX < 50 && navLinks && !navLinks.classList.contains('active')) {
                navLinks.classList.add('active');
                updateToggleIcon();
            }
        }
    }
}

/**
 * Initialize responsive tables
 */
function initializeResponsiveTables() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
        if (!table.closest('.table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

/**
 * Initialize responsive images
 */
function initializeResponsiveImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.style.maxWidth) {
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
        }
    });
}

/**
 * Initialize mobile-friendly forms
 */
function initializeMobileForms() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Add mobile-friendly attributes
            if (input.type === 'email') {
                input.setAttribute('inputmode', 'email');
            }
            if (input.type === 'tel') {
                input.setAttribute('inputmode', 'tel');
            }
            if (input.type === 'number') {
                input.setAttribute('inputmode', 'numeric');
            }
            
            // Improve mobile keyboard behavior
            if (input.name && input.name.toLowerCase().includes('search')) {
                input.setAttribute('inputmode', 'search');
            }
        });
    });
}

/**
 * Global function for backward compatibility
 */
window.toggleMobileNav = toggleMobileNav;

/**
 * Initialize all mobile features when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initializeTouchGestures();
        initializeResponsiveTables();
        initializeResponsiveImages();
        initializeMobileForms();
    });
} else {
    initializeTouchGestures();
    initializeResponsiveTables();
    initializeResponsiveImages();
    initializeMobileForms();
}

/**
 * Add CSS for mobile toggle animation if not present
 */
function addMobileToggleCSS() {
    const styleId = 'mobile-toggle-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .mobile-menu-toggle {
                transition: transform 0.3s ease;
            }
            
            .mobile-menu-toggle.active span:nth-child(1) {
                transform: rotate(45deg) translate(5px, 5px);
            }
            
            .mobile-menu-toggle.active span:nth-child(2) {
                opacity: 0;
            }
            
            .mobile-menu-toggle.active span:nth-child(3) {
                transform: rotate(-45deg) translate(7px, -6px);
            }
            
            .search-toggle-mobile {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.5rem;
                margin-left: 0.5rem;
            }
            
            .table-responsive {
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            
            @media (max-width: 768px) {
                .table-responsive table {
                    min-width: 600px;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add mobile styles
addMobileToggleCSS();