// Google Apps Script Web App URL
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxEyQoGh0gn4nh7RAB9esq25-CpfByAnDU9eu_xwKbz_VW-JusSCSzkjK6rllYrXz3e/exec";

let allSuggestions = [];
let filteredSuggestions = [];
let currentSuggestion = null;
let currentAdmin = null;

// Department colors for super admin badges
const DEPARTMENT_COLORS = {
  "Department of Business Management": "#3a7bd5",
  "Department of Accountancy and Finance": "#ef473a",
  "Department of Marketing Management": "#2c2c2c",
  "Department of Tourism Management": "#38ef7d",
  Other: "#8e2de2",
};

// Get department initials for avatar
function getDepartmentInitials(department) {
  const initials = {
    "Department of Business Management": "BM",
    "Department of Accountancy and Finance": "AF",
    "Department of Marketing Management": "MM",
    "Department of Tourism Management": "TM",
    "Faculty of Management Studies": "AR",
  };
  return initials[department] || "AD";
}

// Get clean department name for display
function getCleanDepartmentName(department) {
  const names = {
    "Department of Business Management": "Business Management",
    "Department of Accountancy and Finance": "Accountancy & Finance",
    "Department of Marketing Management": "Marketing Management",
    "Department of Tourism Management": "Tourism Management",
    "Faculty of Management Studies": "Faculty Administration",
  };
  return names[department] || department;
}

// For super admin - show full names
function getFullDepartmentName(department) {
  return department; // Return as-is (full name)
}

// Update admin profile in header
function updateAdminProfile(adminData) {
  currentAdmin = adminData;

  const adminNameEl = document.getElementById("adminName");
  const adminRoleEl = document.getElementById("adminRole");

  if (adminNameEl) {
    // Show clean department name
    if (adminData.accessLevel === "department") {
      adminNameEl.textContent = getCleanDepartmentName(adminData.department);
    } else if (adminData.accessLevel === "all") {
      adminNameEl.textContent = "Faculty Administration";
    } else if (adminData.accessLevel === "superadmin") {
      adminNameEl.textContent = "Super Administrator";
    }
  }

  if (adminRoleEl) {
    // Show role clearly
    let roleText = adminData.role;
    if (adminData.accessLevel === "superadmin") {
      roleText = "Read-Only Access";
    }
    adminRoleEl.textContent = roleText;
  }

  // Update avatar with department initials or icon
  const avatar = document.querySelector(".user-avatar img");
  if (avatar) {
    if (adminData.accessLevel === "superadmin") {
      // Show crown icon for super admin with light background
      avatar.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23e0e7ff' stroke='%234f46e5' stroke-width='2'/%3E%3Cpath d='M20 15C17.2 15 15 17.2 15 20C15 22.8 17.2 25 20 25C22.8 25 25 22.8 25 20C25 17.2 22.8 15 20 15Z' fill='none' stroke='%234f46e5' stroke-width='1.5'/%3E%3Cpath d='M20 13V11M20 29V27M27 20H29M11 20H13M25.5 14.5L26.9 13.1M13.1 26.9L14.5 25.5M25.5 25.5L26.9 26.9M13.1 13.1L14.5 14.5' stroke='%234f46e5' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E`;
    } else {
      const initials = getDepartmentInitials(adminData.department);
      const color = DEPARTMENT_COLORS[adminData.department] || "#4A90E2";

      avatar.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${encodeURIComponent(
        color
      )}'/%3E%3Ctext x='20' y='26' font-family='Arial' font-size='14' fill='white' text-anchor='middle' font-weight='700'%3E${initials}%3C/text%3E%3C/svg%3E`;
    }
  }

  // Hide department filter for department admins and AR
  if (
    adminData.accessLevel === "department" ||
    adminData.accessLevel === "all"
  ) {
    const deptFilterGroup = document.querySelector(
      ".filter-group:has(#departmentFilter)"
    );
    if (deptFilterGroup) {
      deptFilterGroup.style.display = "none";
    }
  }
}

// Load suggestions from Google Sheets with role-based filtering - WITH LOADING STATE
async function loadSuggestionsFromSheet() {
  const loadingState = document.getElementById("loadingState");
  const listContainer = document.getElementById("suggestionsList");

  try {
    // START LOADING STATE
    if (loadingState) {
      loadingState.style.display = "flex";
    }
    if (listContainer) {
      listContainer.innerHTML = "";
    }

    // Disable sidebar filters
    disableSection(".sidebar");

    // Disable header logout button
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.disabled = true;
      logoutBtn.style.opacity = "0.5";
      logoutBtn.style.pointerEvents = "none";
    }

    // Disable sort dropdown
    const sortBtn = document.querySelector(".sort-btn");
    if (sortBtn) {
      sortBtn.disabled = true;
      sortBtn.style.opacity = "0.5";
      sortBtn.style.pointerEvents = "none";
    }

    console.log("Fetching suggestions from:", APPS_SCRIPT_URL);
    console.log("Current admin:", currentAdmin);

    const response = await fetch(APPS_SCRIPT_URL + "?action=getSuggestions", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Received data:", data);

    if (data.success && data.suggestions) {
      // Transform the data
      let suggestions = data.suggestions.map((item, index) => ({
        id: item.id || index + 1,
        department: item.department,
        userType: item.role,
        content: item.suggestion,
        email: item.senderEmail || "",
        status: item.status || "new",
        timestamp: new Date(item.timestamp),
        response: item.adminResponse || "",
        respondedBy: item.respondedBy || "",
        isAnonymous: item.isAnonymous || false,
        trackingId: item.trackingId || "",
        rowIndex: item.rowIndex,
      }));

      // Apply department-based filtering based on access level
      if (currentAdmin.accessLevel === "department") {
        suggestions = suggestions.filter(
          (s) => s.department === currentAdmin.department
        );
        console.log(
          `Filtered to ${currentAdmin.department}: ${suggestions.length} suggestions`
        );
      } else if (currentAdmin.accessLevel === "all") {
        console.log(
          `Assistant Registrar - Showing all ${suggestions.length} suggestions`
        );
      } else if (currentAdmin.accessLevel === "superadmin") {
        console.log(
          `Super Admin - Viewing all ${suggestions.length} suggestions (read-only)`
        );
      }

      allSuggestions = suggestions;
      allSuggestions.sort((a, b) => b.timestamp - a.timestamp);
      filteredSuggestions = [...allSuggestions];

      if (loadingState) {
        loadingState.style.display = "none";
      }

      displaySuggestions(filteredSuggestions);
      updateTotalCount(filteredSuggestions.length);

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
  } finally {
    // END LOADING STATE - ALWAYS RUNS
    enableSection(".sidebar");

    // Re-enable logout button
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
      logoutBtn.disabled = false;
      logoutBtn.style.opacity = "";
      logoutBtn.style.pointerEvents = "";
    }

    // Re-enable sort dropdown
    const sortBtn = document.querySelector(".sort-btn");
    if (sortBtn) {
      sortBtn.disabled = false;
      sortBtn.style.opacity = "";
      sortBtn.style.pointerEvents = "";
    }
  }
}

// Helper function to normalize user type class
function getUserTypeClass(userType) {
  if (userType === "Teacher" || userType === "Lecturer") {
    return "lecturer";
  }
  return userType.toLowerCase();
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
        <p>No suggestions found.</p>
      </div>
    `;
    return;
  }

  const isSuperAdmin = currentAdmin.accessLevel === "superadmin";

  // Update subtitle for super admin
  if (isSuperAdmin) {
    const subtitleEl = document.querySelector(".section-subtitle");
    if (subtitleEl) {
      subtitleEl.innerHTML = `View and monitor <span id="totalCount">${suggestions.length}</span> submitted suggestions.`;
    }
  }

  listContainer.innerHTML = suggestions
    .map(
      (suggestion, index) => `
    <div class="suggestion-item ${
      index === 0 ? "active" : ""
    }" onclick="viewSuggestion(${suggestion.id})" data-id="${suggestion.id}" ${
        isSuperAdmin
          ? `data-dept-color="${
              DEPARTMENT_COLORS[suggestion.department]
            }" style="border-left: 4px solid ${
              DEPARTMENT_COLORS[suggestion.department]
            };"`
          : ""
      }>
      <div class="suggestion-header">
        <div class="suggestion-header-left">
          ${
            isSuperAdmin
              ? `<span class="suggestion-dept-tag" style="
                  background: ${DEPARTMENT_COLORS[suggestion.department]}15;
                  color: ${DEPARTMENT_COLORS[suggestion.department]};
                  padding: 4px 10px;
                  border-radius: 6px;
                  font-size: 11px;
                  font-weight: 600;
                  letter-spacing: 0.3px;
                  border: 1px solid ${
                    DEPARTMENT_COLORS[suggestion.department]
                  }30;
                  display: inline-block;
                ">${getDepartmentDisplayName(suggestion.department)}</span>`
              : ``
          }
        </div>
        <span class="suggestion-time">${getTimeAgo(suggestion.timestamp)}</span>
      </div>
      <p class="suggestion-preview">${truncateText(suggestion.content, 100)}</p>
      <div class="suggestion-footer">
        <div class="status-badges-group">
          <span class="status-badge ${suggestion.status}">${getStatusLabel(
        suggestion.status
      )}</span>
          <span class="status-badge user-type ${getUserTypeClass(
            suggestion.userType
          )}">${
        suggestion.userType === "Teacher" ? "Lecturer" : suggestion.userType
      }</span>
          <span class="status-badge privacy ${
            suggestion.isAnonymous ? "anonymous" : "public"
          }">${suggestion.isAnonymous ? "Anonymous" : "Public"}</span>
        </div>
        ${
          suggestion.respondedBy
            ? `<span class="responded-by">by ${
                isSuperAdmin ? suggestion.respondedBy : "You"
              }</span>`
            : ""
        }
      </div>
    </div>
  `
    )
    .join("");

  // Apply department hover colors AFTER rendering
  if (isSuperAdmin) {
    applyDepartmentHoverColors();
  }
}

// Apply dynamic hover colors for super admin department cards
function applyDepartmentHoverColors() {
  const items = document.querySelectorAll(".suggestion-item[data-dept-color]");

  items.forEach((item) => {
    const deptColor = item.getAttribute("data-dept-color");

    // Convert hex to RGB for lighter backgrounds
    const rgb = hexToRgb(deptColor);
    const hoverBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`;
    const activeBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

    item.style.setProperty("--dept-hover-bg", hoverBg);
    item.style.setProperty("--dept-active-bg", activeBg);
    item.style.setProperty("--dept-border-color", deptColor);
  });
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 74, g: 144, b: 226 }; // Default to blue
}

// View suggestion details
function viewSuggestion(id) {
  currentSuggestion = allSuggestions.find((s) => s.id === id);

  if (!currentSuggestion) return;

  document.querySelectorAll(".suggestion-item").forEach((item) => {
    item.classList.remove("active");
  });

  const clickedItem = document.querySelector(`[data-id="${id}"]`);
  if (clickedItem) {
    clickedItem.classList.add("active");
  }

  const detailSection = document.getElementById("detailSection");
  if (!detailSection) return;

  const isReadOnly = currentAdmin.accessLevel === "superadmin";
  const isAlreadyResponded = currentSuggestion.status === "responded";
  const isSuperAdmin = currentAdmin.accessLevel === "superadmin";

  detailSection.innerHTML = `
    <div class="detail-content-wrapper">
      ${
        isReadOnly
          ? `
      <div class="superadmin-notice">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
          <path d="M12 8V12" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="#f59e0b"/>
        </svg>
        <span>Viewing as Super Administrator (Read-Only Mode)</span>
      </div>
      `
          : ""
      }
      
      <div class="detail-meta">
        ${
          isSuperAdmin
            ? `
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="${
              DEPARTMENT_COLORS[currentSuggestion.department]
            }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="${
              DEPARTMENT_COLORS[currentSuggestion.department]
            }" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span style="color: ${
            DEPARTMENT_COLORS[currentSuggestion.department]
          }; font-weight: 600;">${getDepartmentDisplayName(
                currentSuggestion.department
              )}</span>
        </div>
        `
            : ""
        }
        <div class="meta-item">
          ${
            currentSuggestion.userType === "Teacher" ||
            currentSuggestion.userType === "Lecturer"
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 14L21 9L12 4L3 9L12 14Z" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 14V22" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 11.5V16.5C16 17.163 15.7366 17.7989 15.2678 18.2678C14.7989 18.7366 14.163 19 13.5 19H10.5C9.83696 19 9.20107 18.7366 8.73223 18.2678C8.26339 17.7989 8 17.163 8 16.5V11.5" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 9V13" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span style="color: #fb923c; font-weight: 600;">Lecturer</span>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="#8b5cf6" stroke-width="2" fill="none"/>
                <path d="M8 2V6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 2V6" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M3 10H21" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 14H8.01" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 14H12.01" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M16 14H16.01" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M8 18H8.01" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
                <path d="M12 18H12.01" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span style="color: #8b5cf6; font-weight: 600;">Student</span>`
          }
        </div>
        <div class="meta-item">
          ${
            currentSuggestion.isAnonymous
              ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="11" width="14" height="11" rx="2" stroke="#f59e0b" stroke-width="2" fill="none"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                <circle cx="12" cy="16" r="1" fill="#f59e0b"/>
              </svg>`
              : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="#10b981" stroke-width="2"/>
                <path d="M16 11L18 13L22 9" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>`
          }
          <span style="color: ${
            currentSuggestion.isAnonymous ? "#f59e0b" : "#10b981"
          }; font-weight: 600;">
            ${currentSuggestion.isAnonymous ? "Anonymous" : "Public"}
          </span>
        </div>
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 6V12L16 14" stroke="#4A90E2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>${formatDate(currentSuggestion.timestamp)}</span>
        </div>
        ${
          currentSuggestion.email && !currentSuggestion.isAnonymous
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
        ${
          currentSuggestion.isAnonymous && currentSuggestion.trackingId
            ? `
        <div class="meta-item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="#f59e0b" stroke-width="2" fill="none"/>
            <line x1="7" y1="8" x2="7" y2="16" stroke="#f59e0b" stroke-width="2"/>
            <line x1="10" y1="8" x2="10" y2="16" stroke="#f59e0b" stroke-width="2"/>
            <line x1="13" y1="8" x2="13" y2="16" stroke="#f59e0b" stroke-width="2"/>
            <line x1="17" y1="8" x2="17" y2="16" stroke="#f59e0b" stroke-width="2"/>
          </svg>
          <span style="font-family: monospace; font-size: 12px; background: #fef3c7; padding: 2px 8px; border-radius: 4px; color: #92400e;">ID: ${currentSuggestion.trackingId}</span>
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
          placeholder="${
            isReadOnly
              ? "Read-only mode - Cannot edit responses"
              : "Type your official response here..."
          }"
          ${isReadOnly || isAlreadyResponded ? "readonly" : ""}
        >${currentSuggestion.response}</textarea>

        ${
          isAlreadyResponded && currentSuggestion.respondedBy
            ? `
        <div class="response-info">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Responded by: <strong>${
            isSuperAdmin ? currentSuggestion.respondedBy : "You"
          }</strong></span>
        </div>
        `
            : ""
        }

        ${
          !isReadOnly
            ? `
        <div class="detail-actions">
          <button class="submit-response-btn" onclick="submitResponse()" ${
            isAlreadyResponded ? "disabled" : ""
          }>
            ${isAlreadyResponded ? "Already Responded" : "Submit Response"}
          </button>
        </div>
        `
            : ""
        }
      </div>
    </div>
  `;
}

// Submit response (only for non-super admins)
async function submitResponse() {
  if (!currentSuggestion) return;

  if (currentAdmin.accessLevel === "superadmin") {
    showNotification(
      "Super Administrator cannot submit responses (read-only mode)",
      "error"
    );
    return;
  }

  const responseText = document.getElementById("responseText").value.trim();

  if (!responseText) {
    showNotification("Please provide a response.", "error");
    return;
  }

  const submitBtn = document.querySelector(".submit-response-btn");
  const responseTextarea = document.getElementById("responseText");

  // START LOADING STATE
  showGlobalLoading("Submitting your response...");
  disableNavigation();
  setButtonLoading(submitBtn, "Submitting...");

  // Disable response textarea
  responseTextarea.disabled = true;
  responseTextarea.style.opacity = "0.6";

  // Disable clicking on other suggestions
  disableSection(".suggestions-list");

  // Disable sidebar filters
  disableSection(".sidebar");

  try {
    console.log("Submitting response for row:", currentSuggestion.rowIndex);

    updateLoadingMessage("Saving to database...");

    // ✅ FIX: Use no-cors mode for POST requests to Google Apps Script
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // ✅ CRITICAL: This prevents CORS errors
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "submitResponse",
        rowIndex: currentSuggestion.rowIndex,
        response: responseText,
        respondedBy: currentAdmin.name,
        respondedAt: new Date().toISOString(),
      }),
    });

    console.log("Response sent (no-cors mode)");

    // ✅ With no-cors mode, we can't read the response
    // But if no error was thrown, the request was sent successfully

    // Update local state
    currentSuggestion.response = responseText;
    currentSuggestion.status = "responded";
    currentSuggestion.respondedBy = currentAdmin.name;

    updateLoadingMessage("Response submitted successfully!");

    showNotification("Response submitted successfully!", "success");

    // Wait a moment before reloading
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Reload suggestions to get updated data from server
    await loadSuggestionsFromSheet();

    // Re-view the current suggestion to show updated state
    viewSuggestion(currentSuggestion.id);
  } catch (error) {
    console.error("Error submitting response:", error);
    showNotification(
      "Error submitting response. Please check your connection and try again.",
      "error"
    );

    // Re-enable on error
    responseTextarea.disabled = false;
    responseTextarea.style.opacity = "";
    submitBtn.disabled = false;
  } finally {
    // END LOADING STATE - ALWAYS RUNS
    hideGlobalLoading();
    enableNavigation();
    removeButtonLoading(submitBtn);
    enableSection(".suggestions-list");
    enableSection(".sidebar");

    // Re-enable textarea if not already responded
    if (currentSuggestion.status !== "responded") {
      responseTextarea.disabled = false;
      responseTextarea.style.opacity = "";
    }
  }
}

// Apply filters
function applyFilters() {
  const statusFilter = document.getElementById("statusFilter").value;
  const deptFilter =
    document.getElementById("departmentFilter")?.value || "all";
  const userTypeFilter = document.getElementById("userTypeFilter").value;

  filteredSuggestions = allSuggestions.filter((s) => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;

    let matchesDept = true;
    if (currentAdmin.accessLevel !== "department") {
      matchesDept = deptFilter === "all" || s.department === deptFilter;
    }

    const matchesUserType =
      userTypeFilter === "all" || s.userType === userTypeFilter;

    return matchesStatus && matchesDept && matchesUserType;
  });

  displaySuggestions(filteredSuggestions);
  updateTotalCount(filteredSuggestions.length);

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

// Reset filters
function resetFilters() {
  document.getElementById("statusFilter").value = "all";
  if (document.getElementById("departmentFilter")) {
    document.getElementById("departmentFilter").value = "all";
  }
  document.getElementById("userTypeFilter").value = "all";
  applyFilters();
  showNotification("Filters reset successfully", "success");
}

function toggleSortMenu() {
  const sortMenu = document.getElementById("sortMenu");
  sortMenu.classList.toggle("show");
}

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

function logout() {
  // Create styled popup
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    animation: fadeIn 0.3s ease;
  `;

  popup.innerHTML = `
    <div style="
      background: white;
      padding: 32px;
      border-radius: 16px;
      max-width: 420px;
      width: 90%;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
      text-align: center;
    ">
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-bottom: 16px;">
        <circle cx="12" cy="12" r="10" stroke="#f59e0b" stroke-width="2"/>
        <path d="M12 8V12" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        <circle cx="12" cy="16" r="1" fill="#f59e0b"/>
      </svg>
      <h2 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">Confirm Logout</h2>
      <p style="color: #6b7280; font-size: 15px; margin-bottom: 24px; line-height: 1.5;">
        Are you sure you want to logout from the admin dashboard?
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="cancelLogout" style="
          padding: 12px 28px;
          background: #6b7280;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        ">Cancel</button>
        <button id="confirmLogout" style="
          padding: 12px 28px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        ">Logout</button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // Add hover effects
  const cancelBtn = popup.querySelector("#cancelLogout");
  const confirmBtn = popup.querySelector("#confirmLogout");

  cancelBtn.onmouseover = () => (cancelBtn.style.background = "#4b5563");
  cancelBtn.onmouseout = () => (cancelBtn.style.background = "#6b7280");

  confirmBtn.onmouseover = () => (confirmBtn.style.background = "#dc2626");
  confirmBtn.onmouseout = () => (confirmBtn.style.background = "#ef4444");

  // Handle cancel
  cancelBtn.onclick = () => document.body.removeChild(popup);
  popup.onclick = (e) => {
    if (e.target === popup) document.body.removeChild(popup);
  };

  // Handle confirm logout
  confirmBtn.onclick = () => {
    const adminData = JSON.parse(
      sessionStorage.getItem("adminSession") || "{}"
    );
    sessionStorage.removeItem("adminSession");
    localStorage.setItem("lastLogin", new Date().toISOString());

    const loginHistory = JSON.parse(localStorage.getItem("loginHistory")) || [];
    loginHistory.push({
      username: adminData.username,
      action: "logout",
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem("loginHistory", JSON.stringify(loginHistory));
    window.location.href = "admin-login.html";
  };
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
  // Return full department names for better clarity
  return dept;
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

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

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

(function checkAuth() {
  const adminSession = sessionStorage.getItem("adminSession");

  if (!adminSession) {
    window.location.href = "admin-login.html";
    return;
  }

  const adminData = JSON.parse(adminSession);
  updateAdminProfile(adminData);
  loadSuggestionsFromSheet();
})();

console.log("Admin Dashboard Loaded");
console.log("Apps Script URL:", APPS_SCRIPT_URL);
