// Tickets Profile JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Search functionality
  const searchInput = document.querySelector(".search-input")
  const searchIcon = document.querySelector(".search-icon")

  searchInput.addEventListener("focus", () => {
    searchIcon.style.opacity = "0.8"
  })

  searchInput.addEventListener("blur", () => {
    searchIcon.style.opacity = "0.6"
  })

  // Profile edit button
  const editButton = document.querySelector(".edit-button")
  editButton.addEventListener("click", () => {
    alert("Edit profile functionality would be implemented here")
  })

  // Verify email button
  const verifyButton = document.querySelector(".verify-button")
  verifyButton.addEventListener("click", () => {
    // Simulate email verification process
    verifyButton.textContent = "Sending verification email..."
    verifyButton.disabled = true

    setTimeout(() => {
      verifyButton.textContent = "Verification email sent!"
      verifyButton.style.background = "#28a745"

      setTimeout(() => {
        verifyButton.textContent = "Verify your email"
        verifyButton.disabled = false
        verifyButton.style.background = "#3d64ff"
      }, 3000)
    }, 2000)
  })

  // See past orders button
  const pastOrdersButton = document.querySelector(".see-past-orders")
  pastOrdersButton.addEventListener("click", () => {
    // Simulate loading past orders
    const ordersContent = document.querySelector(".orders-content")
    const loadingMessage = document.createElement("div")
    loadingMessage.className = "loading-message"
    loadingMessage.innerHTML = "<p>Loading past orders...</p>"
    loadingMessage.style.textAlign = "center"
    loadingMessage.style.padding = "20px"
    loadingMessage.style.color = "#666"

    ordersContent.appendChild(loadingMessage)

    setTimeout(() => {
      loadingMessage.innerHTML = "<p>No past orders found.</p>"
    }, 2000)
  })

  // Find my tickets link
  const findTicketsLink = document.querySelector(".alert-link")
  findTicketsLink.addEventListener("click", (e) => {
    e.preventDefault()
    alert("Find my tickets functionality would redirect to ticket search page")
  })

  // Navigation dropdowns (simulate hover effect)
  const navItems = document.querySelectorAll(".nav-item")
  navItems.forEach((item) => {
    item.addEventListener("mouseenter", function () {
      this.style.color = "#333"
    })

    item.addEventListener("mouseleave", function () {
      this.style.color = "#666"
    })
  })

  // User menu dropdown simulation
  const userMenu = document.querySelector(".user-menu")
  userMenu.addEventListener("click", () => {
    alert(
      "User menu dropdown would appear here with options like:\n- Account Settings\n- My Events\n- Help\n- Sign Out",
    )
  })

  // Region selector
  const regionSelect = document.querySelector(".region-select")
  regionSelect.addEventListener("change", function () {
    console.log("Region changed to:", this.value)
    // In a real application, this would change the locale/language
  })

  // Profile stats click handlers
  const stats = document.querySelectorAll(".stat")
  stats.forEach((stat) => {
    stat.addEventListener("click", function () {
      const statType = this.textContent.split(" ")[1] // Get 'orders', 'likes', or 'following'
      alert(`${statType.charAt(0).toUpperCase() + statType.slice(0, -1)} page would be displayed here`)
    })
  })

  // Interests section click handler
  const interestsHeader = document.querySelector(".interests-header")
  interestsHeader.addEventListener("click", () => {
    alert("Interests management page would be displayed here")
  })

  // Smooth scrolling for internal links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()
      const target = document.querySelector(this.getAttribute("href"))
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
    })
  })

  // Add loading animation for buttons
  function addLoadingState(button, originalText, loadingText) {
    button.textContent = loadingText
    button.disabled = true
    button.style.opacity = "0.7"

    setTimeout(() => {
      button.textContent = originalText
      button.disabled = false
      button.style.opacity = "1"
    }, 2000)
  }

  // Responsive navigation toggle (for mobile)
  function createMobileMenu() {
    if (window.innerWidth <= 768) {
      const headerRight = document.querySelector(".header-right")
      const mobileToggle = document.createElement("button")
      mobileToggle.className = "mobile-menu-toggle"
      mobileToggle.innerHTML = "☰"
      mobileToggle.style.cssText = `
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                display: none;
            `

      if (window.innerWidth <= 480) {
        mobileToggle.style.display = "block"
        headerRight.appendChild(mobileToggle)
      }
    }
  }

  // Initialize mobile menu on load and resize
  createMobileMenu()
  window.addEventListener("resize", createMobileMenu)

  // Add fade-in animation for main content
  const mainContent = document.querySelector(".main-content")
  mainContent.style.opacity = "0"
  mainContent.style.transform = "translateY(20px)"
  mainContent.style.transition = "opacity 0.6s ease, transform 0.6s ease"

  setTimeout(() => {
    mainContent.style.opacity = "1"
    mainContent.style.transform = "translateY(0)"
  }, 100)

  console.log("Eventbrite Tickets Profile page loaded successfully!")
})

// Additional utility functions
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.textContent = message
  notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#3d64ff"};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// Add CSS animation for notifications
const style = document.createElement("style")
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
`
document.head.appendChild(style)
