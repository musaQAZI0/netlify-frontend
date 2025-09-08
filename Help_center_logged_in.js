// Article data with corresponding page links
const articlesData = {
  attending: [
    { title: "Find your tickets", icon: "file-text", link: "./Help_Center_sub_parts/Your_tickets_new.html" },
    { title: "Request a refund", icon: "dollar-sign", link: "./Help_Center_sub_parts/Request a refund.html" },
    { title: "Contact the event organizer", icon: "message-circle", link: "./Help_Center_sub_parts/Contact_organizer_help_center.html" },
    { title: "What is this charge from Crowd?", icon: "credit-card", link: "./Help_Center_sub_parts/Buy_and_register_help_center_new.html" },
    { title: "Transfer tickets to someone else", icon: "send", link: "./Help_Center_sub_parts/Your_tickets_new.html" },
    { title: "Edit your order information", icon: "file-text", link: "./Help_Center_sub_parts/Your_tickets_new.html" },
  ],
  organizing: [
    { title: "Create and edit ticket types", icon: "file-text", link: "./Help_Center_sub_parts/Create and edit ticket types.html" },
    { title: "Add images and video to your event", icon: "file-text", link: "./Help_Center_sub_parts/Add images and video to your event.html" },
    { title: "Add and manage your payout methods", icon: "credit-card", link: "./Help_Center_sub_parts/Add and manage your payout methods.html" },
    { title: "Troubleshoot delayed or missing payouts", icon: "dollar-sign", link: "./Help_Center_sub_parts/Troubleshoot delayed or missing payouts.html" },
    { title: "Email your registered attendees", icon: "send", link: "./Help_Center_sub_parts/Marketing_an_event_help_center.html" },
    { title: "Issue a full or partial refund", icon: "dollar-sign", link: "./Help_Center_sub_parts/Issue a full or partial refund.html" },
  ],
}

// Topic mapping to sub-part pages (logged-in versions)
const topicMapping = {
  "Buy and register": "./Help_Center_sub_parts/Buy_and_register_help_center_new.html",
  "Your tickets": "./Help_Center_sub_parts/Your_tickets_new.html",
  "Your account": "./Help_Center_sub_parts/Your_account_new.html",
  "Terms and policies": "./Help_Center_sub_parts/Terms and policies.html"
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
  renderArticles()
  setupTabListeners()
  setupSearchListener()
  setupButtonListeners()
  loadUserData()
  loadUserTickets()
})

// Load user data and populate UI
async function loadUserData() {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    // If no token, redirect to regular help center
    window.location.href = './Help_center.html'
    return
  }

  // First try to get user data from localStorage
  const storedUser = localStorage.getItem('currentUser')
  if (storedUser) {
    try {
      const userData = JSON.parse(storedUser)
      populateUserData(userData)
    } catch (error) {
      console.error('Error parsing stored user data:', error)
    }
  }

  // Then try to fetch fresh data from API
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.user) {
        // Update localStorage with fresh data
        localStorage.setItem('currentUser', JSON.stringify(data.user))
        populateUserData(data.user)
      } else {
        // Invalid token, redirect to regular help center
        localStorage.removeItem('authToken')
        localStorage.removeItem('currentUser')
        window.location.href = './Help_center.html'
      }
    } else {
      // If API call fails but we have stored user data, continue with that
      if (!storedUser) {
        localStorage.removeItem('authToken')
        window.location.href = './Help_center.html'
      }
    }
  } catch (error) {
    console.error('Auth check failed:', error)
    // If API is not available but we have stored user data, continue
    if (!storedUser) {
      // Fallback: try to get user data from any stored format
      const fallbackUserData = getUserDataFromStorage()
      if (fallbackUserData) {
        populateUserData(fallbackUserData)
      } else {
        // Last resort: redirect to regular help center
        window.location.href = './Help_center.html'
      }
    }
  }
}

// Try to get user data from various storage formats
function getUserDataFromStorage() {
  // Try different possible storage keys
  const possibleKeys = ['currentUser', 'user', 'userData', 'authUser']
  
  for (const key of possibleKeys) {
    const data = localStorage.getItem(key)
    if (data) {
      try {
        const parsed = JSON.parse(data)
        if (parsed && (parsed.name || parsed.firstName || parsed.username || parsed.email)) {
          return parsed
        }
      } catch (error) {
        continue
      }
    }
  }
  
  return null
}

// Populate user data in the UI
function populateUserData(user) {
  // Update header user information
  const headerUserName = document.getElementById('headerUserNameLogged')
  const headerUserInitials = document.getElementById('headerUserInitialsLogged')
  const headerUserRole = document.getElementById('headerUserRole')
  const welcomeUserInitial = document.getElementById('welcomeUserInitial')
  const helpCardTitle = document.getElementById('helpCardTitle')
  const helpCardDescription = document.getElementById('helpCardDescription')

  // Extract user data with flexible field names
  let firstName = user.firstName || user.first_name || user.name || 'User'
  let lastName = user.lastName || user.last_name || ''
  
  // If name is a single field, try to split it
  if (!lastName && firstName.includes(' ')) {
    const nameParts = firstName.split(' ')
    firstName = nameParts[0]
    lastName = nameParts.slice(1).join(' ')
  }
  
  // Handle case where only email is available
  if (firstName === 'User' && user.email) {
    firstName = user.email.split('@')[0].replace(/[._]/g, ' ')
    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  }
  
  // Handle username as fallback
  if (firstName === 'User' && user.username) {
    firstName = user.username.charAt(0).toUpperCase() + user.username.slice(1)
  }

  const fullName = `${firstName} ${lastName}`.trim()
  const initials = `${firstName.charAt(0)}${lastName.charAt(0) || firstName.charAt(1) || ''}`.toUpperCase()
  
  // Determine user role
  let roleText = 'Attendee' // default
  if (user.isOrganizer || user.is_organizer || user.role === 'organizer' || user.userType === 'organizer') {
    roleText = 'Event Organizer'
  } else if (user.role === 'admin' || user.userType === 'admin' || user.isAdmin) {
    roleText = 'Administrator'
  }

  console.log('Populating user data:', { fullName, initials, roleText, user })

  if (headerUserName) {
    headerUserName.textContent = fullName
  }
  
  if (headerUserInitials) {
    headerUserInitials.textContent = initials
  }
  
  if (headerUserRole) {
    headerUserRole.textContent = roleText
  }
  
  if (welcomeUserInitial) {
    welcomeUserInitial.textContent = firstName.charAt(0).toUpperCase()
  }
  
  if (helpCardTitle) {
    helpCardTitle.textContent = `Welcome back, ${firstName}!`
  }
  
  if (helpCardDescription) {
    helpCardDescription.textContent = `You're logged in as ${roleText}. Browse help articles tailored to your account and events.`
  }

  // Update tab content based on user role
  const isOrganizer = user.isOrganizer || user.is_organizer || user.role === 'organizer' || user.userType === 'organizer'
  if (isOrganizer) {
    // Show organizing tab as active for organizers
    const organizingTab = document.querySelector('[data-tab="organizing"]')
    const attendingTab = document.querySelector('[data-tab="attending"]')
    if (organizingTab && attendingTab) {
      attendingTab.classList.remove('active')
      organizingTab.classList.add('active')
      currentTab = 'organizing'
      renderArticles()
    }
  }
}

// Render articles based on current tab
function renderArticles() {
  const articlesGrid = document.getElementById("articlesGrid")
  const articles = articlesData[currentTab]

  articlesGrid.innerHTML = articles
    .map(
      (article) => `
        <div class="article-card" onclick="handleArticleClick('${article.title}')">
            <div class="article-icon">
                ${icons[article.icon]}
            </div>
            <div class="article-title">${article.title}</div>
        </div>
    `,
    )
    .join("")
}

// Setup tab button listeners
function setupTabListeners() {
  const tabButtons = document.querySelectorAll(".tab-button")

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
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

  searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase()
    console.log("Searching for:", query)
    // Add search functionality here
  })

  searchInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault()
      const query = this.value.trim()
      if (query) {
        console.log("Search submitted:", query)
        alert("Search functionality would be implemented here for: " + query)
      }
    }
  })
}

// Setup button listeners
function setupButtonListeners() {
  // User dropdown items
  const viewProfileDropdown = document.getElementById("viewProfileDropdown")
  if (viewProfileDropdown) {
    viewProfileDropdown.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("View profile clicked")
      alert("View profile functionality would be implemented here")
      toggleUserDropdown()
    })
  }

  const accountSettingsDropdown = document.getElementById("accountSettingsDropdown")
  if (accountSettingsDropdown) {
    accountSettingsDropdown.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Account settings clicked")
      alert("Account settings functionality would be implemented here")
      toggleUserDropdown()
    })
  }

  const organizerDashboardDropdown = document.getElementById("organizerDashboardDropdown")
  if (organizerDashboardDropdown) {
    organizerDashboardDropdown.addEventListener("click", (e) => {
      e.preventDefault()
      console.log("Organizer dashboard clicked")
      window.location.href = './organizer-dashboard.html'
      toggleUserDropdown()
    })
  }

  // Logout dropdown item
  const logoutDropdownLogged = document.getElementById("logoutDropdownLogged")
  if (logoutDropdownLogged) {
    logoutDropdownLogged.addEventListener("click", () => {
      handleLogout()
    })
  }

  // Contact button
  const contactButton = document.querySelector(".contact-button")
  if (contactButton) {
    contactButton.addEventListener("click", () => {
      console.log("Contact support clicked")
      alert("Contact support functionality would be implemented here")
    })
  }

  // Initial ticket button setup (will be re-attached after ticket loading)
  attachTicketButtonListeners()

  // Topic cards
  const topicCards = document.querySelectorAll(".topic-card")
  topicCards.forEach((card) => {
    card.addEventListener("click", function () {
      const topicTitle = this.querySelector("span").textContent
      console.log("Topic clicked:", topicTitle)
      
      // Check if we have a mapping for this topic
      if (topicMapping[topicTitle]) {
        window.location.href = topicMapping[topicTitle]
      } else {
        alert("Topic navigation would be implemented here for: " + topicTitle)
      }
    })
  })

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const userProfile = e.target.closest('.user-profile-logged')
    const userDropdown = document.getElementById('userDropdownLogged')
    
    if (!userProfile && userDropdown) {
      userDropdown.classList.remove('show')
    }
  })
}

// Toggle user dropdown
function toggleUserDropdown() {
  const userDropdown = document.getElementById('userDropdownLogged')
  if (userDropdown) {
    userDropdown.classList.toggle('show')
  }
}

// Handle article clicks
function handleArticleClick(articleTitle) {
  console.log("Article clicked:", articleTitle)
  
  // Find the article in the current tab's data
  const articles = articlesData[currentTab]
  const article = articles.find(a => a.title === articleTitle)
  
  if (article && article.link) {
    // Navigate to the corresponding help page
    window.location.href = article.link
  } else {
    alert("Article navigation would be implemented here for: " + articleTitle)
  }
}

// Handle logout
async function handleLogout() {
  const token = localStorage.getItem('authToken')
  
  if (token) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  localStorage.removeItem('authToken')
  localStorage.removeItem('currentUser')
  
  console.log('User logged out')
  alert('Logged out successfully!')
  
  // Redirect to regular help center
  window.location.href = './Help_center.html'
}

// Handle footer link clicks
document.addEventListener("click", (e) => {
  if (e.target.matches(".footer-column a, .footer-links a")) {
    e.preventDefault()
    const linkText = e.target.textContent
    console.log("Footer link clicked:", linkText)
    alert("Navigation would be implemented here for: " + linkText)
  }
})

// Load user tickets and orders
async function loadUserTickets() {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    return
  }

  // Show loading state
  showTicketsLoading()

  try {
    // Fetch user's tickets/orders from the API
    const response = await fetch('/api/users/tickets', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success) {
        displayTickets(data.tickets || [])
      } else {
        showEmptyTicketsState()
      }
    } else if (response.status === 404) {
      // If endpoint doesn't exist, try alternative approach
      await loadUserTicketsAlternative()
    } else {
      console.error('Failed to load tickets')
      showEmptyTicketsState()
    }
  } catch (error) {
    console.error('Error loading tickets:', error)
    // Try alternative approach or show empty state
    await loadUserTicketsAlternative()
  }
}

// Alternative method to load tickets (from events the user registered for)
async function loadUserTicketsAlternative() {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    showEmptyTicketsState()
    return
  }

  try {
    // Try to get user's event registrations
    const response = await fetch('/api/users/events', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.events) {
        const upcomingEvents = data.events.filter(event => {
          const eventDate = new Date(event.date)
          return eventDate > new Date()
        })
        displayEventsAsTickets(upcomingEvents)
      } else {
        showEmptyTicketsState()
      }
    } else {
      // Fallback: try to get all events and filter by user
      await loadAllEventsForUser()
    }
  } catch (error) {
    console.error('Error loading user events:', error)
    showEmptyTicketsState()
  }
}

// Fallback: Load all events and filter by current user
async function loadAllEventsForUser() {
  const userData = localStorage.getItem('currentUser')
  if (!userData) {
    showEmptyTicketsState()
    return
  }

  try {
    const user = JSON.parse(userData)
    const response = await fetch('/api/events', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      if (data.success && data.events) {
        // Filter events where user might have tickets (this is a simplified approach)
        // In a real system, you'd have a proper tickets/orders table
        const userEvents = data.events.filter(event => {
          // Check if user is in attendees list or has registered
          return event.attendees && event.attendees.some(attendee => 
            attendee.userId === user.id || attendee.email === user.email
          )
        })
        
        const upcomingEvents = userEvents.filter(event => {
          const eventDate = new Date(event.date)
          return eventDate > new Date()
        })
        
        displayEventsAsTickets(upcomingEvents)
      } else {
        showEmptyTicketsState()
      }
    } else {
      showEmptyTicketsState()
    }
  } catch (error) {
    console.error('Error loading events for user:', error)
    showEmptyTicketsState()
  }
}

// Show loading state for tickets
function showTicketsLoading() {
  const ticketsCard = document.querySelector('.my-tickets-card')
  if (ticketsCard) {
    ticketsCard.innerHTML = `
      <div class="my-tickets-content">
        <h2 class="tickets-title">My tickets</h2>
        <div class="no-orders-section">
          <div class="loading-spinner"></div>
          <p class="no-orders-text">Loading your tickets...</p>
        </div>
      </div>
    `
  }
}

// Display tickets/orders
function displayTickets(tickets) {
  if (!tickets || tickets.length === 0) {
    showEmptyTicketsState()
    return
  }

  const upcomingTickets = tickets.filter(ticket => {
    const eventDate = new Date(ticket.eventDate)
    return eventDate > new Date()
  })

  if (upcomingTickets.length === 0) {
    showEmptyTicketsState('No upcoming orders', tickets.length > 0)
    return
  }

  const ticketsCard = document.querySelector('.my-tickets-card')
  if (ticketsCard) {
    ticketsCard.innerHTML = `
      <div class="my-tickets-content">
        <h2 class="tickets-title">My tickets</h2>
        <div class="tickets-list">
          ${upcomingTickets.map(ticket => createTicketCard(ticket)).join('')}
        </div>
        <div class="tickets-actions">
          <button class="find-tickets-btn">Find my tickets</button>
          <button class="browse-events-btn">Browse events</button>
        </div>
      </div>
    `
    
    // Re-attach event listeners
    attachTicketButtonListeners()
  }
}

// Display events as tickets (alternative format)
function displayEventsAsTickets(events) {
  if (!events || events.length === 0) {
    showEmptyTicketsState()
    return
  }

  const ticketsCard = document.querySelector('.my-tickets-card')
  if (ticketsCard) {
    ticketsCard.innerHTML = `
      <div class="my-tickets-content">
        <h2 class="tickets-title">My tickets</h2>
        <div class="tickets-list">
          ${events.map(event => createEventTicketCard(event)).join('')}
        </div>
        <div class="tickets-actions">
          <button class="find-tickets-btn">Find my tickets</button>
          <button class="browse-events-btn">Browse events</button>
        </div>
      </div>
    `
    
    // Re-attach event listeners
    attachTicketButtonListeners()
  }
}

// Create ticket card HTML
function createTicketCard(ticket) {
  const eventDate = new Date(ticket.eventDate)
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return `
    <div class="ticket-card" data-ticket-id="${ticket.id}">
      <div class="ticket-info">
        <h3 class="ticket-event-name">${ticket.eventName}</h3>
        <p class="ticket-date">${formattedDate} at ${formattedTime}</p>
        <p class="ticket-location">${ticket.location || 'Location TBD'}</p>
        <div class="ticket-quantity">
          <span class="ticket-count">${ticket.quantity || 1} ticket${(ticket.quantity || 1) > 1 ? 's' : ''}</span>
          <span class="ticket-status ${ticket.status || 'confirmed'}">${ticket.status || 'Confirmed'}</span>
        </div>
      </div>
      <div class="ticket-actions">
        <button class="view-ticket-btn" onclick="viewTicket('${ticket.id}')">View ticket</button>
      </div>
    </div>
  `
}

// Create event ticket card HTML (alternative format)
function createEventTicketCard(event) {
  const eventDate = new Date(event.date)
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return `
    <div class="ticket-card" data-event-id="${event.id}">
      <div class="ticket-info">
        <h3 class="ticket-event-name">${event.title}</h3>
        <p class="ticket-date">${formattedDate} at ${formattedTime}</p>
        <p class="ticket-location">${event.location || 'Location TBD'}</p>
        <div class="ticket-quantity">
          <span class="ticket-count">1 ticket</span>
          <span class="ticket-status confirmed">Registered</span>
        </div>
      </div>
      <div class="ticket-actions">
        <button class="view-ticket-btn" onclick="viewEvent('${event.id}')">View event</button>
      </div>
    </div>
  `
}

// Show empty tickets state
function showEmptyTicketsState(message = 'No upcoming orders', hasPastTickets = false) {
  const ticketsCard = document.querySelector('.my-tickets-card')
  if (ticketsCard) {
    ticketsCard.innerHTML = `
      <div class="my-tickets-content">
        <h2 class="tickets-title">My tickets</h2>
        
        <div class="no-orders-section">
          <div class="no-orders-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="no-orders-text">${message}</p>
          ${hasPastTickets ? '<a href="#" class="view-past-orders">View past orders</a>' : ''}
        </div>
        
        <div class="tickets-actions">
          <button class="find-tickets-btn">Find my tickets</button>
          <button class="browse-events-btn">Browse events</button>
        </div>
      </div>
    `
    
    // Re-attach event listeners
    attachTicketButtonListeners()
  }
}

// Attach event listeners to ticket buttons
function attachTicketButtonListeners() {
  // Find tickets button
  const findTicketsBtn = document.querySelector('.find-tickets-btn')
  if (findTicketsBtn) {
    findTicketsBtn.addEventListener('click', () => {
      window.location.href = './Help_Center_sub_parts/Your_tickets_new.html'
    })
  }

  // Browse events button
  const browseEventsBtn = document.querySelector('.browse-events-btn')
  if (browseEventsBtn) {
    browseEventsBtn.addEventListener('click', () => {
      window.location.href = './index.html'
    })
  }

  // View past orders link
  const viewPastOrdersLink = document.querySelector('.view-past-orders')
  if (viewPastOrdersLink) {
    viewPastOrdersLink.addEventListener('click', (e) => {
      e.preventDefault()
      showPastOrders()
    })
  }
}

// View individual ticket
function viewTicket(ticketId) {
  console.log('View ticket:', ticketId)
  window.location.href = `./Help_Center_sub_parts/Your_tickets_new.html?ticket=${ticketId}`
}

// View individual event
function viewEvent(eventId) {
  console.log('View event:', eventId)
  window.location.href = `./event-preview.html?id=${eventId}`
}

// Show past orders (placeholder)
function showPastOrders() {
  console.log('Show past orders')
  alert('Past orders functionality would be implemented here')
}

// Global function for back navigation from sub-parts
window.navigateToHelpCenter = function() {
  window.location.href = './Help_center_logged_in.html'
}