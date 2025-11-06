// Google Apps Script Web App URL (MUST BE DEFINED FIRST!)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxEyQoGh0gn4nh7RAB9esq25-CpfByAnDU9eu_xwKbz_VW-JusSCSzkjK6rllYrXz3e/exec";

let allSuggestions = [];
let filteredSuggestions = [];
let currentSuggestion = null;

// Update admin profile in header
function updateAdminProfile(adminData) {
  const adminNameEl = document.getElementById("adminName");
  const adminRoleEl = document.getElementById("adminRole");

  if (adminNameEl) {
    adminNameEl.textContent = adminData.name;
  }

  if (adminRoleEl) {
    adminRoleEl.textContent = adminData.role;
  }

  // Update avatar with initials
  const avatar = document.querySelector(".user-avatar img");
  if (avatar && adminData.name) {
    const initials = adminData.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

    avatar.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%234A90E2'/%3E%3Ctext x='20' y='26' font-family='Arial' font-size='16' fill='white' text-anchor='middle' font-weight='600'%3E${initials}%3C/text%3E%3C/svg%3E`;
  }
}

// Load suggestions from Google Sheets
async function loadSuggestionsFromSheet() {
  const loadingState = document.getElementById("loadingState");
  const listContainer = document.getElementById("suggestionsList");

  try {
    // Show loading state
    if (loadingState) {
      loadingState.style.display = "flex";
    }
    if (listContainer) {
      listContainer.innerHTML = "";
    }

    console.log("Fetching suggestions from:", APPS_SCRIPT_URL);

    // Fetch data from Google Apps Script
    // IMPORTANT: Don't include Content-Type header for GET requests to avoid CORS preflight
    const response = await fetch(APPS_SCRIPT_URL + "?action=getSuggestions");

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received data:", data);

    if (data.success && data.suggestions) {
      // Transform the data
      allSuggestions = data.suggestions.map((item, index) => ({
        id: item.id || index + 1,
        department: item.department,
        userType: item.role,
        content: item.suggestion,
        email: item.senderEmail || "",
        status: item.status || "new",
        timestamp: new Date(item.timestamp),
        response: item.adminResponse || "",
        rowIndex: item.rowIndex, // Store row index for updates
      }));

      console.log("Processed suggestions:", allSuggestions.length);

      // Sort by newest first
      allSuggestions.sort((a, b) => b.timestamp - a.timestamp);

      filteredSuggestions = [...allSuggestions];

      // Hide loading state
      if (loadingState) {
        loadingState.style.display = "none";
      }

      // Display suggestions
      displaySuggestions(filteredSuggestions);
      updateTotalCount(filteredSuggestions.length);

      // Load first suggestion by default
      if (filteredSuggestions.length > 0) {
        viewSuggestion(filteredSuggestions[0].id);
      }
    } else {
      throw new Error(data.message || "Failed to load suggestions");
    }
  } catch (error) {
    console.error("Error loading suggestions:", error);

    if (loadingState) {
      loadingState.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ef4444;">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          <h3 style="margin-bottom: 8px; font-size: 18px;">Error Loading Suggestions</h3>
          <p style="color: #6b7280; margin-bottom: 16px; font-size: 14px;">${error.message}</p>
          <button onclick="loadSuggestionsFromSheet()" style="padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;">
            Retry
          </button>
        </div>
      `;
      loadingState.style.display = "flex";
    }
  }
}

// Display suggestions in the list
function displaySuggestions(suggestions) {
  const listContainer = document.getElementById("suggestionsList");

  if (!listContainer) return;

  if (suggestions.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #6b7280;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; opacity: 0.3;">
          <path d="M9 2L6 8H2L5 14L2 22H22L19 14L22 8H18L15 2H9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>No suggestions found matching your criteria.</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = suggestions
    .map(
      (suggestion, index) => `
    <div class="suggestion-item ${
      index === 0 ? "active" : ""
    }" onclick="viewSuggestion(${suggestion.id})" data-id="${suggestion.id}">
      <div class="suggestion-header">
        <span class="suggestion-dept">${getDepartmentDisplayName(
          suggestion.department
        )}</span>
        <span class="suggestion-time">${getTimeAgo(suggestion.timestamp)}</span>
      </div>
      <p class="suggestion-preview">${truncateText(suggestion.content, 100)}</p>
      <span class="status-badge ${suggestion.status}">${getStatusLabel(
        suggestion.status
      )}</span>
    </div>
  `
    )
    .join("");
}

// View suggestion details
function viewSuggestion(id) {
  currentSuggestion = allSuggestions.find((s) => s.id === id);

  if (!currentSuggestion) return;

  // Update active state in list
  document.querySelectorAll(".suggestion-item").forEach((item) => {
    item.classList.remove("active");
  });

  const clickedItem = document.querySelector(`[data-id="${id}"]`);
  if (clickedItem) {
    clickedItem.classList.add("active");
  }

  // Update detail view
  const detailSection = document.getElementById("detailSection");
  if (!detailSection) return;

  detailSection.innerHTML = `
    <div class="detail-content-wrapper">
      <div class="detail-meta">
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${currentSuggestion.userType}</span>
        </div>
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${getDepartmentDisplayName(currentSuggestion.department)}</span>
        </div>
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 6V12L16 14" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${formatDate(currentSuggestion.timestamp)}</span>
        </div>
        ${
          currentSuggestion.email
            ? `
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M22 6L12 13L2 6" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${currentSuggestion.email}</span>
        </div>
        `
            : ""
        }
      </div>

      <div class="detail-content">
        <h3 class="content-heading">Suggestion</h3>
        <p class="content-text">${currentSuggestion.content}</p>

        <h3 class="content-heading">Response</h3>
        <textarea
          class="response-textarea"
          id="responseText"
          placeholder="Type your official response here..."
          ${currentSuggestion.status === "responded" ? "readonly" : ""}
        >${currentSuggestion.response}</textarea>

        <div class="detail-actions">
          <button class="submit-response-btn" onclick="submitResponse()" ${
            currentSuggestion.status === "responded" ? "disabled" : ""
          }>
            ${
              currentSuggestion.status === "responded"
                ? "Already Responded"
                : "Submit Response"
            }
          </button>
        </div>
      </div>
    </div>
  `;
}

// Submit response
async function submitResponse() {
  if (!currentSuggestion) return;

  const responseText = document.getElementById("responseText").value.trim();

  if (!responseText) {
    showNotification("Please provide a response.", "error");
    return;
  }

  const submitBtn = document.querySelector(".submit-response-btn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const adminData = JSON.parse(sessionStorage.getItem("adminSession"));

    console.log("Submitting response for row:", currentSuggestion.rowIndex);

    // Send response to Google Apps Script using POST with redirect follow
    const response = await fetch(APPS_SCRIPT_URL, {
      redirect: "follow",
      method: "POST",
      body: JSON.stringify({
        action: "submitResponse",
        rowIndex: currentSuggestion.rowIndex,
        response: responseText,
        respondedBy: adminData.name,
        respondedAt: new Date().toISOString(),
      }),
    });

    console.log("Response status:", response.status);

    // Parse response text first, then JSON
    const text = await response.text();
    console.log("Response text:", text);

    const result = JSON.parse(text);
    console.log("Response result:", result);

    if (result.success) {
      // Update local data
      currentSuggestion.response = responseText;
      currentSuggestion.status = "responded";

      showNotification("Response submitted successfully!", "success");

      // Reload suggestions to reflect changes
      await loadSuggestionsFromSheet();

      // Reload current suggestion view
      viewSuggestion(currentSuggestion.id);
    } else {
      throw new Error(result.message || "Failed to submit response");
    }
  } catch (error) {
    console.error("Error submitting response:", error);
    showNotification("Error submitting response. Please try again.", "error");
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Response";
  }
}

// Apply filters
function applyFilters() {
  const statusFilter = document.getElementById("statusFilter").value;
  const deptFilter = document.getElementById("departmentFilter").value;
  const userTypeFilter = document.getElementById("userTypeFilter").value;

  filteredSuggestions = allSuggestions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesDept = deptFilter === "all" || s.department === deptFilter;
    const matchesUserType =
      userTypeFilter === "all" || s.userType === userTypeFilter;

    return matchesStatus && matchesDept && matchesUserType;
  });

  displaySuggestions(filteredSuggestions);
  updateTotalCount(filteredSuggestions.length);

  // Load first suggestion if available
  if (filteredSuggestions.length > 0) {
    viewSuggestion(filteredSuggestions[0].id);
  } else {
    document.getElementById("detailSection").innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px; opacity: 0.3;">
          <path d="M9 2L6 8H2L5 14L2 22H22L19 14L22 8H18L15 2H9Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3 style="font-size: 18px; margin-bottom: 8px;">No suggestions found</h3>
        <p>Try adjusting your filters.</p>
      </div>
    `;
  }
}

// Toggle sort menu
function toggleSortMenu() {
  const sortMenu = document.getElementById("sortMenu");
  sortMenu.classList.toggle("show");
}

// Close sort menu when clicking outside
document.addEventListener("click", function (event) {
  const sortBtn = document.querySelector(".sort-btn");
  const sortMenu = document.getElementById("sortMenu");

  if (
    sortMenu &&
    !sortBtn?.contains(event.target) &&
    !sortMenu.contains(event.target)
  ) {
    sortMenu.classList.remove("show");
  }
});

// Sort suggestions
function sortBy(method) {
  document.getElementById("currentSort").textContent =
    method.charAt(0).toUpperCase() + method.slice(1);

  switch (method) {
    case "newest":
      filteredSuggestions.sort((a, b) => b.timestamp - a.timestamp);
      break;
    case "oldest":
      filteredSuggestions.sort((a, b) => a.timestamp - b.timestamp);
      break;
  }

  displaySuggestions(filteredSuggestions);
  toggleSortMenu();
}

// Logout function
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    // Clear session data
    const adminData = JSON.parse(
      sessionStorage.getItem("adminSession") || "{}"
    );

    sessionStorage.removeItem("adminSession");

    // Log the logout activity
    const loginHistory = JSON.parse(localStorage.getItem("loginHistory")) || [];

    loginHistory.push({
      username: adminData.username,
      action: "logout",
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem("loginHistory", JSON.stringify(loginHistory));

    // Redirect to login page
    window.location.href = "admin-login.html";
  }
}

// Helper Functions
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return "just now";
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusLabel(status) {
  const labels = {
    new: "New",
    responded: "Responded",
  };
  return labels[status] || status;
}

function getDepartmentDisplayName(dept) {
  const shortNames = {
    "Department of Business Management": "Business Management",
    "Department of Accountancy and Finance": "Accountancy & Finance",
    "Department of Marketing Management": "Marketing Management",
    "Department of Tourism Management": "Tourism Management",
    Other: "Other",
  };
  return shortNames[dept] || dept;
}

function updateTotalCount(count) {
  const totalCountEl = document.getElementById("totalCount");
  if (totalCountEl) {
    totalCountEl.textContent = count;
  }
}

function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function showNotification(message, type = "success") {
  // Create notification element
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: ${type === "success" ? "#10b981" : "#ef4444"};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    font-size: 15px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Check authentication on page load (MUST BE AT THE END!)
(function checkAuth() {
  const adminSession = sessionStorage.getItem("adminSession");

  if (!adminSession) {
    // Not logged in, redirect to login page
    window.location.href = "admin-login.html";
    return;
  }

  // Parse admin data
  const adminData = JSON.parse(adminSession);

  // Update header with admin info
  updateAdminProfile(adminData);

  // Load suggestions data from Google Sheets
  loadSuggestionsFromSheet();
})();

// Initialize on page load
console.log("Admin Dashboard Loaded");
console.log("Apps Script URL:", APPS_SCRIPT_URL);
