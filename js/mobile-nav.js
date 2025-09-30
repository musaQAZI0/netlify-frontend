// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', function() {
    // Create mobile menu toggle button if it doesn't exist
    const header = document.querySelector('.header');
    const navContainer = document.querySelector('.nav-container');
    
    if (header && navContainer && !document.querySelector('.mobile-menu-toggle')) {
        // Create mobile menu toggle button
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        
        // Create mobile menu
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-menu';
        
        // Clone search section for mobile
        const searchSection = document.querySelector('.search-section');
        if (searchSection) {
            const mobileSearch = searchSection.cloneNode(true);
            mobileSearch.className = 'mobile-search-section';
            mobileMenu.appendChild(mobileSearch);
        }
        
        // Clone nav links for mobile
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const mobileNavLinks = navLinks.cloneNode(true);
            mobileNavLinks.className = 'mobile-nav-links';
            mobileMenu.appendChild(mobileNavLinks);
        }
        
        // Add toggle button to nav container
        navContainer.appendChild(mobileToggle);
        
        // Add mobile menu to body
        document.body.appendChild(mobileMenu);
        
        // Handle mobile menu toggle
        mobileToggle.addEventListener('click', function() {
            const isActive = mobileMenu.classList.contains('active');
            
            if (isActive) {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            } else {
                mobileMenu.classList.add('active');
                document.body.classList.add('mobile-menu-open');
                mobileToggle.setAttribute('aria-expanded', 'true');
            }
        });
        
        // Close mobile menu when clicking outside
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close mobile menu when clicking on a link
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('mobile-menu-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Set initial ARIA attributes
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
    }
    
    // Touch-friendly enhancements
    enhanceTouchInteractions();
    
    // Viewport height fix for mobile browsers
    fixMobileViewportHeight();
    
    // Optimize for mobile performance
    optimizeMobilePerformance();
});

// Enhance touch interactions for better mobile experience
function enhanceTouchInteractions() {
    // Add touch feedback to buttons
    const buttons = document.querySelectorAll('button, .btn, .social-btn, .filter-tab, .event-card, .city-card, .interest-tag');
    
    buttons.forEach(button => {
        if (!button.classList.contains('touch-enhanced')) {
            button.classList.add('touch-enhanced');
            
            // Add touch start/end handlers for visual feedback
            button.addEventListener('touchstart', function() {
                this.classList.add('touching');
            }, { passive: true });
            
            button.addEventListener('touchend', function() {
                this.classList.remove('touching');
            }, { passive: true });
            
            button.addEventListener('touchcancel', function() {
                this.classList.remove('touching');
            }, { passive: true });
        }
    });
}

// Fix mobile viewport height issues (iOS Safari address bar)
function fixMobileViewportHeight() {
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    // Set initial value
    setViewportHeight();
    
    // Update on resize (handles iOS Safari address bar)
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
}

// Optimize performance for mobile devices
function optimizeMobilePerformance() {
    // Debounce scroll events
    let scrollTimeout;
    const handleScroll = () => {
        if (scrollTimeout) {
            window.cancelAnimationFrame(scrollTimeout);
        }
        scrollTimeout = window.requestAnimationFrame(() => {
            // Handle scroll-based functionality here
            handleScrollEffects();
        });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Optimize image loading for mobile
    optimizeImageLoading();
    
    // Reduce motion for users who prefer it
    respectReducedMotion();
}

// Handle scroll effects efficiently
function handleScrollEffects() {
    const header = document.querySelector('.header');
    if (header) {
        const scrolled = window.pageYOffset > 10;
        header.classList.toggle('scrolled', scrolled);
    }
}

// Optimize image loading for mobile devices
function optimizeImageLoading() {
    // Add loading="lazy" to images that don't have it
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => {
        img.setAttribute('loading', 'lazy');
    });
    
    // Optimize background images for mobile
    const bgImages = document.querySelectorAll('[style*="background-image"]');
    bgImages.forEach(element => {
        if (window.innerWidth <= 768) {
            const style = element.getAttribute('style');
            if (style && style.includes('background-image')) {
                // You can add mobile-specific image optimization here
                element.style.backgroundSize = 'cover';
                element.style.backgroundPosition = 'center';
            }
        }
    });
}

// Respect user's reduced motion preferences
function respectReducedMotion() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
        // Disable animations for users who prefer reduced motion
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
                scroll-behavior: auto !important;
            }
        `;
        document.head.appendChild(style);
    }
}

// Utility function to detect mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
        || window.innerWidth <= 768;
}

// Utility function to detect touch support
function hasTouchSupport() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
}

// Export functions for use in other scripts
window.MobileNavigation = {
    isMobileDevice,
    hasTouchSupport,
    enhanceTouchInteractions,
    fixMobileViewportHeight,
    optimizeMobilePerformance
};

// Add CSS for mobile menu animations and touch feedback
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
    /* Mobile menu styles */
    .mobile-menu-toggle {
        display: none;
    }
    
    @media (max-width: 768px) {
        .mobile-menu-toggle {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            width: 44px;
            height: 44px;
            padding: 0.5rem;
        }
        
        .mobile-menu-toggle span {
            display: block;
            width: 25px;
            height: 3px;
            background: #1A3A4F;
            margin: 3px 0;
            transition: 0.3s;
            border-radius: 2px;
        }
        
        .mobile-menu-toggle[aria-expanded="true"] span:nth-child(1) {
            transform: rotate(-45deg) translate(-6px, 6px);
        }
        
        .mobile-menu-toggle[aria-expanded="true"] span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-toggle[aria-expanded="true"] span:nth-child(3) {
            transform: rotate(45deg) translate(-6px, -6px);
        }
    }
    
    /* Touch feedback */
    .touch-enhanced.touching {
        transform: scale(0.95);
        opacity: 0.8;
        transition: all 0.1s ease;
    }
    
    /* Mobile viewport height fix */
    .login-container,
    .hero,
    .hero-logged-in {
        min-height: 100vh;
        min-height: calc(var(--vh, 1vh) * 100);
    }
    
    /* Body lock when mobile menu is open */
    body.mobile-menu-open {
        overflow: hidden;
        position: fixed;
        width: 100%;
    }
    
    /* Improve scrolling on iOS */
    .mobile-menu {
        -webkit-overflow-scrolling: touch;
    }
    
    /* Better button sizes for touch */
    @media (max-width: 768px) {
        button,
        .btn,
        input[type="submit"],
        input[type="button"],
        a.button {
            min-height: 44px;
            min-width: 44px;
        }
        
        /* Increase tap target for small elements */
        .social-btn,
        .filter-tab,
        .nav-links a {
            min-height: 48px;
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }
`;

document.head.appendChild(mobileStyles);