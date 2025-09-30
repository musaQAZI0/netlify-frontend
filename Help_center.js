// Article data with corresponding page links
const articlesData = {
  attending: [
    { title: "Find your tickets", icon: "file-text", link: "Your tickets.html" },
    { title: "Request a refund", icon: "dollar-sign", link: "Request a refund.html" },
    { title: "Contact the event organizer", icon: "message-circle", link: "Contact_organizer.html" },
    { title: "What is this charge from Crowd?", icon: "credit-card", link: "Buy_and_register.html" },
    { title: "Transfer tickets to someone else", icon: "send", link: "Your tickets.html" },
    { title: "Edit your order information", icon: "file-text", link: "Managing_orders.html" },
  ],
  organizing: [
    { title: "Create and edit ticket types", icon: "file-text", link: "Create and edit ticket types.html" },
    { title: "Add images and video to your event", icon: "file-text", link: "Add images and video to your event.html" },
    { title: "Add and manage your payout methods", icon: "credit-card", link: "Add and manage your payout methods.html" },
    { title: "Troubleshoot delayed or missing payouts", icon: "dollar-sign", link: "Troubleshoot delayed or missing payout.html" },
    { title: "Email your registered attendees", icon: "send", link: "Marketing_an_event_help_center.html" },
    { title: "Issue a full or partial refund", icon: "dollar-sign", link: "Issue a full or partial refund.html" },
  ],
}

// Topic mapping to pages
const topicMapping = {
  "Buy and register": "Buy_and_register.html",
  "Your tickets": "Your tickets.html",
  "Your account": "Your account.html",
  "Terms and policies": "Terms and policies.html"
}

// Logged-in versions mapping
const topicMappingLoggedIn = {
  "Buy and register": "Buy_and_register_new.html",
  "Your tickets": "Your tickets.html",
  "Your account": "Your account.html",
  "Terms and policies": "Terms and policies_new.html"
}

// SVG icons
const icons = {
  "file-text":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14,2 14,8 20,8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10,9 9,9 8,9"></polyline></svg>',
  "dollar-sign":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
  "message-circle":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
  "credit-card":
    '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>',
  send: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22,2 15,22 11,13 2,9 22,2"></polygon></svg>',
}

// Current active tab
let currentTab = "attending"

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  console.log("Help Center JavaScript loaded successfully!")
  renderArticles()
  setupTabListeners()
  setupSearchListener()
  setupButtonListeners()
  showLoginPrompt()

  console.log("All event listeners setup complete")
})

// Render articles based on current tab - NO INLINE ONCLICK
function renderArticles() {
  console.log("Rendering articles for tab:", currentTab)
  const articlesGrid = document.getElementById("articlesGrid")

  if (!articlesGrid) {
    console.error("Articles grid element not found!")
    return
  }

  const articles = articlesData[currentTab]
  console.log("Articles to render:", articles)

  // Create articles without inline onclick - CSP compliant
  articlesGrid.innerHTML = articles
    .map(
      (article, index) => `
        <div class="article-card" data-article-title="${article.title}" data-article-link="${article.link}">
            <div class="article-icon">
                ${icons[article.icon]}
            </div>
            <div class="article-title">${article.title}</div>
        </div>
    `,
    )
    .join("")

  // Add event listeners after creating the HTML
  setupArticleClickListeners()
  console.log("Articles rendered and event listeners added")
}

// Setup article click listeners - CSP compliant way
function setupArticleClickListeners() {
  const articleCards = document.querySelectorAll('.article-card')

  articleCards.forEach(card => {
    card.addEventListener('click', function () {
      const articleTitle = this.getAttribute('data-article-title')
      const articleLink = this.getAttribute('data-article-link')

      console.log("Article clicked:", articleTitle)
      console.log("Navigating to:", articleLink)

      if (articleLink) {
        window.location.href = articleLink
      } else {
        console.error("No link found for article:", articleTitle)
        alert("Page coming soon for: " + articleTitle)
      }
    })

    // Add visual feedback
    card.style.cursor = 'pointer'
  })

  console.log(`Added click listeners to ${articleCards.length} article cards`)
}

// Setup tab button listeners
function setupTabListeners() {
  const tabButtons = document.querySelectorAll(".tab-button")
  console.log("Found tab buttons:", tabButtons.length)

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      console.log("Tab clicked:", this.dataset.tab)

      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"))

      // Add active class to clicked button
      this.classList.add("active")

      // Update current tab
      currentTab = this.dataset.tab

      // Re-render articles
      renderArticles()
    })
  })
}

// Setup search functionality
function setupSearchListener() {
  const searchInput = document.getElementById("searchInput")

  if (!searchInput) {
    console.error("Search input not found!")
    return
  }

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase()
    console.log("Searching for:", query)
  })

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault()
      const query = this.value.trim()
      if (query) {
        console.log("Search submitted:", query)
        performSearch(query)
      }
    }
  })

  console.log("Search listeners setup complete")
}

// Perform search functionality
function performSearch(query) {
  const searchablePages = [
    { title: "Buy and Register", url: "Buy_and_register.html", keywords: ["buy", "purchase", "register", "payment", "charge"] },
    { title: "Your Tickets", url: "Your tickets.html", keywords: ["tickets", "find", "transfer", "download"] },
    { title: "Your Account", url: "Your account.html", keywords: ["account", "profile", "settings", "personal"] },
    { title: "Terms and Policies", url: "Terms and policies.html", keywords: ["terms", "policies", "legal", "privacy"] },
    { title: "Request a Refund", url: "Request a refund.html", keywords: ["refund", "cancel", "money back"] },
    { title: "Contact Organizer", url: "Contact_organizer.html", keywords: ["contact", "organizer", "message", "help"] },
    { title: "Create Ticket Types", url: "Create and edit ticket types.html", keywords: ["create", "ticket", "types", "edit"] },
    { title: "Add Media", url: "Add images and video to your event.html", keywords: ["images", "video", "media", "upload"] },
    { title: "Payout Methods", url: "Add and manage your payout methods.html", keywords: ["payout", "payment", "methods", "bank"] },
    { title: "Payout Issues", url: "Troubleshoot delayed or missing payout.html", keywords: ["troubleshoot", "delayed", "missing", "payout"] },
    { title: "Marketing", url: "Marketing_an_event_help_center.html", keywords: ["marketing", "email", "attendees", "promote"] },
    { title: "Issue Refunds", url: "Issue a full or partial refund.html", keywords: ["issue", "refund", "partial", "full"] },
    { title: "Managing Orders", url: "Managing_orders.html", keywords: ["orders", "manage", "edit", "update"] },
    { title: "Payouts and Taxes", url: "Payouts and taxes.html", keywords: ["payouts", "taxes", "financial", "earnings"] }
  ]

  const matches = searchablePages.filter(page =>
    page.title.toLowerCase().includes(query) ||
    page.keywords.some(keyword => keyword.includes(query))
  )

  if (matches.length === 1) {
    console.log("Single match found, navigating to:", matches[0].url)
    window.location.href = matches[0].url
  } else if (matches.length > 1) {
    console.log("Multiple matches found:", matches)
    const firstMatch = matches[0]
    const matchTitles = matches.map(m => m.title).join(', ')
    if (confirm(`Found ${matches.length} matches: ${matchTitles}. Navigate to "${firstMatch.title}"?`)) {
      window.location.href = firstMatch.url
    }
  } else {
    alert(`No results found for "${query}". Try searching for topics like tickets, refunds, account, or payments.`)
  }
}

// Setup button listeners
function setupButtonListeners() {
  console.log("Setting up button listeners...")

  // Header login button
  const headerLoginBtn = document.getElementById("headerLoginBtn")
  if (headerLoginBtn) {
    console.log("Header login button found")
    headerLoginBtn.addEventListener("click", () => {
      console.log("Header login clicked")
      // For now, just show alert since we don't have a login page
      alert("Would redirect to login page - login.html")
      // Uncomment when you have a login page:
      // window.location.href = "login.html"
    })
  } else {
    console.error("Header login button not found!")
  }

  // Contact button
  const contactButton = document.querySelector(".contact-button")
  if (contactButton) {
    console.log("Contact button found")
    contactButton.addEventListener("click", () => {
      console.log("Contact support clicked - navigating to Contact_organizer.html")
      window.location.href = "Contact_organizer.html"
    })
  } else {
    console.error("Contact button not found!")
  }

  // Topic cards - Using event delegation for CSP compliance
  const topicsSection = document.querySelector(".topics-section")
  if (topicsSection) {
    topicsSection.addEventListener("click", function (e) {
      const topicCard = e.target.closest(".topic-card")
      if (topicCard) {
        const topicTitle = topicCard.querySelector("span").textContent
        console.log("Topic clicked:", topicTitle)

        // Check if user is logged in (simplified for now)
        const token = localStorage.getItem('authToken')
        const isLoggedIn = token && token.length > 0

        // Choose appropriate mapping
        const mapping = isLoggedIn ? topicMappingLoggedIn : topicMapping

        if (mapping[topicTitle]) {
          console.log("Navigating to:", mapping[topicTitle])
          window.location.href = mapping[topicTitle]
        } else {
          console.error("No URL mapping found for topic:", topicTitle)
          alert("Page coming soon for: " + topicTitle)
        }
      }
    })
    console.log("Topic section click listener added")
  } else {
    console.error("Topics section not found!")
  }

  // User profile dropdown (if available)
  const userProfile = document.getElementById("headerUserProfile")
  const userDropdown = document.getElementById("userDropdown")
  if (userProfile && userDropdown) {
    userProfile.addEventListener("click", (e) => {
      e.stopPropagation()
      userDropdown.classList.toggle("show")
    })

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      userDropdown.classList.remove("show")
    })

    // Prevent dropdown from closing when clicking inside it
    userDropdown.addEventListener("click", (e) => {
      e.stopPropagation()
    })
  }

  // Edit profile dropdown item
  const editProfileDropdown = document.getElementById("editProfileDropdown")
  if (editProfileDropdown) {
    editProfileDropdown.addEventListener("click", () => {
      console.log("Edit profile clicked")
      window.location.href = "Your account.html"
    })
  }

  // Logout dropdown item
  const logoutDropdown = document.getElementById("logoutDropdown")
  if (logoutDropdown) {
    logoutDropdown.addEventListener("click", () => {
      console.log("Logout clicked")
      handleLogout()
    })
  }

  console.log("Button listeners setup complete")
}

// Show login prompt
function showLoginPrompt() {
  console.log("Showing login prompt")

  const headerLoginBtn = document.getElementById('headerLoginBtn')
  const headerUserProfile = document.getElementById('headerUserProfile')

  if (headerLoginBtn) {
    headerLoginBtn.style.display = 'block'
    console.log("Login button shown")
  } else {
    console.error("Header login button not found!")
  }

  if (headerUserProfile) {
    headerUserProfile.style.display = 'none'
  }

  // Update help card
  const helpCardTitle = document.getElementById('helpCardTitle')
  const helpCardDescription = document.getElementById('helpCardDescription')

  if (helpCardTitle) {
    helpCardTitle.textContent = 'Get help faster'
  }
  if (helpCardDescription) {
    helpCardDescription.textContent = 'Log in for resources tailored to your account, tickets, and events.'
  }
}

// Handle logout
function handleLogout() {
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
  showLoginPrompt()

  // Close dropdown if open
  const userDropdown = document.getElementById('userDropdown')
  if (userDropdown) {
    userDropdown.classList.remove('show')
  }

  console.log('User logged out')
}

// Handle footer link clicks using event delegation
document.addEventListener("click", (e) => {
  if (e.target.matches(".footer-column a, .footer-links a")) {
    e.preventDefault()
    const linkText = e.target.textContent
    console.log("Footer link clicked:", linkText)

    // Map some footer links to actual pages
    const footerLinkMapping = {
      "Contact support": "Contact_organizer.html",
      "Help": "Help_center.html",
      "Terms": "Terms and policies.html",
      "Privacy": "Terms and policies.html"
    }

    if (footerLinkMapping[linkText]) {
      window.location.href = footerLinkMapping[linkText]
    } else {
      alert("Page coming soon: " + linkText)
    }
  }
})

// Debug function
window.debugHelpCenter = function () {
  console.log("=== HELP CENTER DEBUG INFO ===")
  console.log("Current tab:", currentTab)
  console.log("Articles data:", articlesData)
  console.log("Topic mapping:", topicMapping)
  console.log("Page location:", window.location.href)
  console.log("Available elements:")
  console.log("- Articles grid:", !!document.getElementById("articlesGrid"))
  console.log("- Search input:", !!document.getElementById("searchInput"))
  console.log("- Topic cards:", document.querySelectorAll(".topic-card").length)
  console.log("- Tab buttons:", document.querySelectorAll(".tab-button").length)
  console.log("- Login button:", !!document.getElementById("headerLoginBtn"))
  console.log("- Contact button:", !!document.querySelector(".contact-button"))

  // Test navigation
  console.log("Testing topic mappings:")
  Object.entries(topicMapping).forEach(([topic, url]) => {
    console.log(`- ${topic} → ${url}`)
  })
}

console.log("CSP-compliant Help Center JS loaded successfully!")
console.log("Run debugHelpCenter() in console for debug info.")