// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function () {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });
  }

  // Contact Form Handling
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleFormSubmit);
  }

  // Smooth Scrolling for Anchor Links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const headerHeight = document.querySelector('.main-header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // Add scroll effect to header
  window.addEventListener('scroll', function () {
    const header = document.querySelector('.main-header');
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Initialize animations on scroll
  initScrollAnimations();
});

// Form Submission Handler
function handleFormSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const formValues = Object.fromEntries(formData);

  // Basic form validation
  if (!validateForm(formValues)) {
    return;
  }

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...';
  submitBtn.disabled = true;

  // Simulate form submission (replace with actual API call)
  setTimeout(() => {
    // Reset form
    e.target.reset();

    // Show success message
    showNotification('Thank you! We\'ll be in touch soon.', 'success');

    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;

    // In a real implementation, you would send the data to your server:
    // sendFormData(formValues);
  }, 2000);
}

// Form Validation
function validateForm(values) {
  const required = ['firstName', 'lastName', 'email'];
  const errors = [];

  // Check required fields
  required.forEach(field => {
    if (!values[field] || values[field].trim() === '') {
      errors.push(`${field.charAt(0).toUpperCase() + field.slice(1)} is required`);
    }
  });

  // Validate email format
  if (values.email && !isValidEmail(values.email)) {
    errors.push('Please enter a valid email address');
  }

  // Show errors if any
  if (errors.length > 0) {
    showNotification(errors.join('\n'), 'error');
    return false;
  }

  return true;
}

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <div class="notification-content">
            <p>${message}</p>
            <button class="notification-close">&times;</button>
        </div>
    `;

  // Add styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease;
    `;

  // Add close functionality
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => notification.remove());

  // Add to page
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
}

// Scroll animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animateElements = document.querySelectorAll('.stat-item, .feature-card, .feature-item, .testimonial-content');
  animateElements.forEach(el => {
    el.classList.add('animate-element');
    observer.observe(el);
  });
}

// Counter animation for stats
function animateCounters() {
  const counters = document.querySelectorAll('.stat-number');

  counters.forEach(counter => {
    const target = counter.textContent;
    const numericValue = parseInt(target.replace(/\D/g, ''));
    const suffix = target.replace(/\d/g, '');

    let current = 0;
    const increment = numericValue / 100;

    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        counter.textContent = target;
        clearInterval(timer);
      } else {
        counter.textContent = Math.floor(current) + suffix;
      }
    }, 20);
  });
}

// Initialize counter animation when stats section comes into view
const statsObserver = new IntersectionObserver(function (entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounters();
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', function () {
  const statsSection = document.querySelector('.stats-section');
  if (statsSection) {
    statsObserver.observe(statsSection);
  }
});

// Function to send form data to server (implement based on your backend)
function sendFormData(formData) {
  // Example implementation:
  /*
  fetch('/api/contact', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => {
      if (data.success) {
          showNotification('Thank you! We\'ll be in touch soon.', 'success');
      } else {
          showNotification('Sorry, there was an error. Please try again.', 'error');
      }
  })
  .catch(error => {
      console.error('Error:', error);
      showNotification('Sorry, there was an error. Please try again.', 'error');
  });
  */
}

// Analytics tracking (implement based on your analytics provider)
function trackEvent(eventName, eventData = {}) {
  // Example for Google Analytics:
  /*
  if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
  }
  */

  // Example for other analytics:
  /*
  if (typeof analytics !== 'undefined') {
      analytics.track(eventName, eventData);
  }
  */

  console.log('Event tracked:', eventName, eventData);
}

// Track form submissions
document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function () {
      trackEvent('Contact Form Submitted', {
        page: window.location.pathname,
        timestamp: new Date().toISOString()
      });
    });
  }

  // Track CTA clicks
  const ctaButtons = document.querySelectorAll('.cta-button, .btn-primary');
  ctaButtons.forEach(button => {
    button.addEventListener('click', function () {
      trackEvent('CTA Clicked', {
        buttonText: this.textContent.trim(),
        page: window.location.pathname
      });
    });
  });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .animate-element {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;
    }
    
    .animate-element.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
    }
    
    .main-header.scrolled {
        background-color: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
    }
    
    /* Mobile menu styles */
    @media (max-width: 792px) {
        .nav-links.active {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 20px;
            gap: 15px;
        }
        
        .mobile-menu-btn.active span:nth-child(1) {
            transform: rotate(-45deg) translate(-5px, 6px);
        }
        
        .mobile-menu-btn.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-menu-btn.active span:nth-child(3) {
            transform: rotate(45deg) translate(-5px, -6px);
        }
    }
`;
document.head.appendChild(style);