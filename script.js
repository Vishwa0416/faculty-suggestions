// Get the current year and set it in the footer
const currentYear = new Date().getFullYear();
document.getElementById("current-year").textContent = currentYear;

// Global variable to store search results
let currentSearchResults = [];

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxEyQoGh0gn4nh7RAB9esq25-CpfByAnDU9eu_xwKbz_VW-JusSCSzkjK6rllYrXz3e/exec";

let roleChosen = null;
let deptChosen = null;
let deptIcon = null;
let deptTheme = null;
let stepHistory = []; // Track step navigation history
let isAnonymous = false;

const deptMessages = {
  "Department of Business Management":
    "Share your insights on business education and management practices",
  "Department of Accountancy and Finance":
    "Help us improve financial education and accountancy programs",
  "Department of Marketing Management":
    "Share your ideas on marketing curriculum and industry connections",
  "Department of Tourism Management":
    "Tell us how we can enhance tourism and hospitality education",
  Other: "Share your feedback for other departments or general suggestions",
};

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
  // Set initial step in history
  stepHistory = [1];
});

function chooseRole(role) {
  roleChosen = role;
  showStep(2);
}

function selectDept(card, dept, icon, theme) {
  document
    .querySelectorAll(".dept-card")
    .forEach((c) => c.classList.remove("selected"));

  card.classList.add("selected");
  deptChosen = dept;
  deptIcon = icon;
  deptTheme = theme;

  setTimeout(() => showStep(3), 300);
}

function showStep(n) {
  // Hide all steps
  document
    .querySelectorAll(".step")
    .forEach((s) => s.classList.remove("active"));

  // Show the requested step
  const targetStep = document.getElementById("step" + n);
  if (targetStep) {
    targetStep.classList.add("active");
  }

  // Add to history (avoid duplicates)
  if (stepHistory.length === 0 || stepHistory[stepHistory.length - 1] !== n) {
    stepHistory.push(n);
  }

  // Apply department theme for step 3
  if (n === 3 && deptTheme) {
    applyDepartmentTheme();
  } else {
    document.body.className = "";
  }

  // Show/hide back button
  const backBtn = document.getElementById("globalBackBtn");
  if (backBtn) {
    backBtn.style.display = n === 1 ? "none" : "block";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goBack() {
  // Remove current step from history
  stepHistory.pop();

  // Get the previous step
  const prevStep = stepHistory[stepHistory.length - 1];

  if (prevStep) {
    // Remove the previous step from history before showing it
    // (showStep will add it back)
    stepHistory.pop();
    showStep(prevStep);
  } else {
    // Fallback to home if history is empty
    stepHistory = [];
    showStep(1);
  }
}

function applyDepartmentTheme() {
  document.body.className = `theme-${deptTheme}`;
  document.getElementById("bannerIcon").textContent = deptIcon;
  document.getElementById("bannerTitle").textContent = deptChosen;
  document.getElementById("bannerSubtitle").textContent =
    deptMessages[deptChosen] || "Share your valuable feedback with us";
  document.getElementById("roleBadge").textContent =
    roleChosen === "Teacher" ? "Lecturer" : roleChosen;
}

function nextStep() {
  if (!deptChosen) {
    showPopup("Please select a department", 3000, false);
    return;
  }
  showStep(3);
}

function updateCharCount() {
  const textarea = document.getElementById("suggestion");
  const charCount = document.getElementById("charCount");
  charCount.textContent = textarea.value.length;

  if (textarea.value.length > 4500) {
    charCount.style.color = "#ef4444";
  } else if (textarea.value.length > 4000) {
    charCount.style.color = "#f59e0b";
  } else {
    charCount.style.color = "#999";
  }
}

function showPopup(msg, time = 3000, success = true) {
  const p = document.getElementById("popup");
  p.style.display = "block";
  p.style.background = success ? "#22c55e" : "#ef4444";
  p.textContent = msg;
  setTimeout(() => (p.style.display = "none"), time);
}

function toggleAnonymous() {
  isAnonymous = document.getElementById("anonymousCheck").checked;
  const emailInput = document.getElementById("senderEmail");

  if (isAnonymous) {
    emailInput.disabled = true;
    emailInput.value = "";
    emailInput.placeholder = "Email disabled for anonymous submissions";
  } else {
    emailInput.disabled = false;
    emailInput.placeholder = "your.email@example.com";
  }
}

function generateTrackingId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${timestamp}-${random}`.toUpperCase();
}

// Enhanced submit function with proper navigation
async function submitSuggestion() {
  const suggestion = document.getElementById("suggestion").value.trim();
  let senderEmail = document.getElementById("senderEmail").value.trim();
  const hp = document.getElementById("hp_field").value;
  const submitBtn = document.getElementById("submitBtn");

  if (hp) {
    showPopup("Spam detected", 4000, false);
    return;
  }

  if (!suggestion) {
    showPopup("Please type a suggestion", 3000, false);
    return;
  }

  if (suggestion.length > 5000) {
    showPopup("Suggestion too long (max 5000 characters)", 3000, false);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  showPopup("Sending your suggestion...", 2000, true);

  let trackingId = null;
  if (isAnonymous) {
    trackingId = generateTrackingId();
    senderEmail = "ANONYMOUS";
  }

  try {
    await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role: roleChosen,
        department: deptChosen,
        suggestion: suggestion,
        senderEmail: senderEmail,
        timestamp: new Date().toISOString(),
        isAnonymous: isAnonymous,
        trackingId: trackingId,
      }),
    });

    if (isAnonymous) {
      // Show anonymous popup with tracking ID
      document.getElementById("trackingId").textContent = trackingId;
      document.getElementById("anonymous-popup").style.display = "flex";
    } else {
      showPopup("✅ Suggestion delivered — thank you!", 4000, true);
      setTimeout(() => {
        resetForm();
        // Reset navigation to home
        stepHistory = [];
        showStep(1);
      }, 2000);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = "Send Suggestion";
  } catch (err) {
    console.error(err);
    showPopup("❌ Network error. Please try again.", 5000, false);
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Suggestion";
  }
}

// Reset form and navigation
function resetForm() {
  document.getElementById("suggestion").value = "";
  document.getElementById("senderEmail").value = "";
  document.getElementById("anonymousCheck").checked = false;
  document.getElementById("senderEmail").disabled = false;
  isAnonymous = false;
  updateCharCount();

  // Don't reset department/role choices
  // deptChosen = null;
  // deptIcon = null;
  // deptTheme = null;
  // roleChosen = null;
}

function closeAnonymousPopup() {
  document.getElementById("anonymous-popup").style.display = "none";
  resetForm();
  // Reset navigation to home
  stepHistory = [];
  showStep(1);
}

function copyTrackingId() {
  const trackingId = document.getElementById("trackingId").textContent;
  navigator.clipboard
    .writeText(trackingId)
    .then(() => {
      showPopup("✅ Tracking ID copied to clipboard!", 2000, true);
    })
    .catch(() => {
      showPopup("❌ Failed to copy. Please copy manually.", 3000, false);
    });
}

// Reset all filters to default
function resetFilters() {
  document.getElementById("filterDepartment").value = "all";
  document.getElementById("filterDateFrom").value = "";
  document.getElementById("filterDateTo").value = "";
  document.getElementById("filterType").value = "all";
  showPopup("Filters reset", 2000, true);
}

async function downloadReport() {
  const downloadBtn = event.target;
  downloadBtn.disabled = true;
  downloadBtn.textContent = "Generating...";

  // Get filter values
  const filters = {
    department: document.getElementById("filterDepartment").value,
    dateFrom: document.getElementById("filterDateFrom").value,
    dateTo: document.getElementById("filterDateTo").value,
    type: document.getElementById("filterType").value,
  };

  console.log("Applying filters:", filters);
  showPopup("Generating filtered PDF report...", 3000, true);

  try {
    const url = `${APPS_SCRIPT_URL}?action=getPublicResponses`;
    console.log("Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log("Received data:", data);

    if (!data.success) {
      showPopup(
        "❌ " + (data.message || "Failed to fetch responses"),
        3000,
        false
      );
      downloadBtn.disabled = false;
      downloadBtn.textContent = "📄 Download Filtered Report (PDF)";
      return;
    }

    if (!data.responses || data.responses.length === 0) {
      showPopup("No admin responses available yet", 3000, false);
      downloadBtn.disabled = false;
      downloadBtn.textContent = "📄 Download Filtered Report (PDF)";
      return;
    }

    // Apply filters
    let filteredResponses = applyFilters(data.responses, filters);

    if (filteredResponses.length === 0) {
      showPopup("No responses match your filters", 3000, false);
      downloadBtn.disabled = false;
      downloadBtn.textContent = "📄 Download Filtered Report (PDF)";
      return;
    }

    console.log(
      "Generating PDF with",
      filteredResponses.length,
      "filtered responses"
    );
    generatePDFReport(filteredResponses, filters);
    showPopup(
      `✅ Report generated with ${filteredResponses.length} responses!`,
      2000,
      true
    );
  } catch (error) {
    console.error("Error:", error);
    showPopup("❌ Failed to generate report: " + error.message, 4000, false);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = "📄 Download Filtered Report (PDF)";
  }
}

// Apply filters to responses
function applyFilters(responses, filters) {
  return responses.filter((response) => {
    // Department filter
    if (
      filters.department !== "all" &&
      response.department !== filters.department
    ) {
      return false;
    }

    // Date range filter
    const responseDate = new Date(response.timestamp);

    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (responseDate < fromDate) {
        return false;
      }
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (responseDate > toDate) {
        return false;
      }
    }

    // Response type filter
    if (filters.type === "public" && response.isAnonymous) {
      return false;
    }
    if (filters.type === "anonymous" && !response.isAnonymous) {
      return false;
    }

    return true;
  });
}

function generatePDFReport(responses, filters = null) {
  const reportWindow = window.open("", "_blank");

  if (!reportWindow) {
    showPopup("❌ Please allow popups to view the report", 4000, false);
    return;
  }

  // Build filter summary text
  let filterSummary = "";
  if (filters) {
    const parts = [];
    if (filters.department !== "all") {
      parts.push(`Department: ${filters.department}`);
    }
    if (filters.dateFrom) {
      parts.push(`From: ${new Date(filters.dateFrom).toLocaleDateString()}`);
    }
    if (filters.dateTo) {
      parts.push(`To: ${new Date(filters.dateTo).toLocaleDateString()}`);
    }
    if (filters.type !== "all") {
      parts.push(
        `Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`
      );
    }

    if (parts.length > 0) {
      filterSummary = `<div class="filter-summary">
        <strong>📋 Applied Filters:</strong> ${parts.join(" | ")}
      </div>`;
    }
  }

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Faculty Suggestions Report</title>
      <meta charset="utf-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          margin: 40px; 
          background: #f5f7fa;
          color: #333;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        h1 { 
          color: #4a90e2; 
          text-align: center; 
          margin-bottom: 10px;
          font-size: 32px;
        }
        .header-info {
          text-align: center;
          color: #666;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        .date { font-weight: 600; margin-bottom: 5px; }
        .count { font-size: 14px; }
        .filter-summary {
          background: #fef3c7;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-size: 13px;
          color: #78350f;
          border: 1px solid #fcd34d;
        }
        .response-item { 
          border: 2px solid #e5e7eb; 
          padding: 24px; 
          margin-bottom: 24px; 
          border-radius: 12px;
          page-break-inside: avoid;
          background: #fafbfc;
        }
        .response-item.anonymous {
          background: #fffbeb;
          border: 2px solid #fbbf24;
        }
        .response-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }
        .tracking-id { 
          background: #fef3c7; 
          padding: 8px 14px; 
          border-radius: 6px;
          display: inline-block;
          font-weight: bold;
          color: #92400e;
          font-size: 14px;
          border: 2px solid #fbbf24;
        }
        .anonymous-badge {
          background: #fee2e2;
          color: #991b1b;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #fca5a5;
        }
        .department { 
          color: #4a90e2; 
          font-weight: bold; 
          font-size: 16px;
        }
        .role-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #e3f2fd;
          color: #1976d2;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }
        .suggestion { 
          margin: 16px 0; 
          font-style: italic;
          line-height: 1.6;
          color: #444;
        }
        .suggestion-label {
          font-weight: 600;
          color: #333;
          margin-bottom: 8px;
          display: block;
        }
        .admin-response { 
          background: #f0fdf4; 
          padding: 16px; 
          margin-top: 16px;
          border-left: 4px solid #22c55e;
          border-radius: 6px;
        }
        .admin-response.anonymous-response {
          margin-top: 0;
        }
        .admin-response-label {
          font-weight: 600;
          color: #166534;
          margin-bottom: 8px;
          display: block;
        }
        .response-text {
          color: #15803d;
          line-height: 1.6;
        }
        .metadata { 
          color: #666; 
          font-size: 12px; 
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .metadata-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .privacy-note {
          background: #fef3c7;
          padding: 12px;
          border-radius: 6px;
          font-size: 13px;
          color: #78350f;
          text-align: center;
          font-style: italic;
        }
        .print-btn {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background: #4a90e2;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(74,144,226,0.3);
          transition: all 0.3s;
          z-index: 1000;
        }
        .print-btn:hover {
          background: #357abd;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74,144,226,0.4);
        }
        @media print {
          .print-btn { display: none; }
          body { background: white; margin: 0; }
          .container { box-shadow: none; padding: 20px; }
          .response-item { border-color: #ccc; }
        }
        @media (max-width: 768px) {
          body { margin: 20px; }
          .container { padding: 20px; }
          .response-header { flex-direction: column; }
          .print-btn { 
            position: static; 
            width: 100%; 
            margin-bottom: 20px; 
          }
        }
      </style>
    </head>
    <body>
      <button class="print-btn" onclick="window.print()">
        🖨️ Print / Save as PDF
      </button>
      
      <div class="container">
        <h1>📋 Faculty Suggestions Response Report</h1>
        <div class="header-info">
          <p class="date">Generated: ${new Date().toLocaleString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</p>
          <p class="count">Total Responses: ${responses.length}</p>
        </div>
        ${filterSummary}
  `;

  responses.forEach((item, index) => {
    const respondedDate = new Date(item.respondedAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );

    if (item.isAnonymous && item.trackingId) {
      htmlContent += `
        <div class="response-item anonymous">
          <div class="response-header">
            <span class="anonymous-badge">🔒 Anonymous Submission</span>
            <span class="tracking-id">🔖 ID: ${item.trackingId}</span>
          </div>
          
          <div class="privacy-note">
            📌 This is an anonymous submission. Details are hidden to protect privacy.
          </div>
          
          <div class="admin-response anonymous-response">
            <span class="admin-response-label">📨 Admin Response:</span>
            <div class="response-text">${
              item.adminResponse || "No response"
            }</div>
          </div>
          
          <div class="metadata">
            <span class="metadata-item">
              <strong>✅ Responded:</strong> ${respondedDate}
            </span>
            <span class="metadata-item">
              <strong>👤 By:</strong> ${item.respondedBy || "Admin"}
            </span>
          </div>
        </div>
      `;
    } else {
      const submittedDate = new Date(item.timestamp).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "short",
          day: "numeric",
        }
      );

      htmlContent += `
        <div class="response-item">
          <div class="response-header">
            <div>
              <span class="department">${item.department || "N/A"}</span>
              <span class="role-badge">${item.role || "N/A"}</span>
            </div>
          </div>
          
          <div>
            <span class="suggestion-label">💬 Suggestion:</span>
            <div class="suggestion">${item.suggestion || "N/A"}</div>
          </div>
          
          <div class="admin-response">
            <span class="admin-response-label">📨 Admin Response:</span>
            <div class="response-text">${
              item.adminResponse || "No response"
            }</div>
          </div>
          
          <div class="metadata">
            <span class="metadata-item">
              <strong>📅 Submitted:</strong> ${submittedDate}
            </span>
            <span class="metadata-item">
              <strong>✅ Responded:</strong> ${respondedDate}
            </span>
            <span class="metadata-item">
              <strong>👤 By:</strong> ${item.respondedBy || "Admin"}
            </span>
          </div>
        </div>
      `;
    }
  });

  htmlContent += `
      </div>
    </body>
    </html>
  `;

  reportWindow.document.write(htmlContent);
  reportWindow.document.close();
}

// Search by Tracking ID
async function searchByTrackingId() {
  const trackingId = document
    .getElementById("trackingIdInput")
    .value.trim()
    .toUpperCase();

  if (!trackingId) {
    showPopup("Please enter a tracking ID", 3000, false);
    return;
  }

  showPopup("Searching...", 2000, true);

  try {
    const url = `${APPS_SCRIPT_URL}?action=searchByTrackingId&trackingId=${encodeURIComponent(
      trackingId
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      showPopup("❌ " + data.message, 3000, false);
      return;
    }

    if (data.results.length === 0) {
      showPopup("No suggestion found with this tracking ID", 3000, false);
      return;
    }

    currentSearchResults = data.results;
    displaySearchResults(data.results, "Tracking ID: " + trackingId);
  } catch (error) {
    console.error(error);
    showPopup("❌ Search failed. Please try again.", 3000, false);
  }
}

// Search by Email
async function searchByEmail() {
  const email = document.getElementById("emailInput").value.trim();

  if (!email) {
    showPopup("Please enter an email address", 3000, false);
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showPopup("Please enter a valid email address", 3000, false);
    return;
  }

  showPopup("Searching...", 2000, true);

  try {
    const url = `${APPS_SCRIPT_URL}?action=searchByEmail&email=${encodeURIComponent(
      email
    )}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) {
      showPopup("❌ " + data.message, 3000, false);
      return;
    }

    if (data.results.length === 0) {
      showPopup("No suggestions found for this email", 3000, false);
      return;
    }

    currentSearchResults = data.results;
    displaySearchResults(data.results, "Results for: " + email);
  } catch (error) {
    console.error(error);
    showPopup("❌ Search failed. Please try again.", 3000, false);
  }
}

// Display Search Results in Popup
function displaySearchResults(results, title) {
  document.getElementById("searchResultsTitle").textContent = title;
  const content = document.getElementById("searchResultsContent");

  if (results.length === 0) {
    content.innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found</p>
      </div>
    `;
  } else {
    let html = "";
    results.forEach((item) => {
      const status = item.status === "responded" ? "responded" : "pending";
      const statusText =
        item.status === "responded" ? "✅ Responded" : "⏳ Pending";
      const submittedDate = new Date(item.timestamp).toLocaleDateString();

      html += `
        <div class="result-item ${status}">
          <div class="result-header">
            <span class="result-dept">${item.department}</span>
            <span class="result-status ${status}">${statusText}</span>
          </div>
          
          ${
            item.isAnonymous && item.trackingId
              ? `
            <div style="background: #fef3c7; padding: 6px 10px; border-radius: 4px; margin-bottom: 8px; font-size: 12px;">
              🔖 Tracking ID: <strong>${item.trackingId}</strong>
            </div>
          `
              : ""
          }
          
          <div class="result-suggestion">
            <strong>Suggestion:</strong> ${item.suggestion}
          </div>
          
          ${
            item.adminResponse
              ? `
            <div class="result-response">
              <div class="result-response-label">📨 Admin Response:</div>
              <div class="result-response-text">${item.adminResponse}</div>
            </div>
          `
              : '<p style="color: #f59e0b; font-size: 13px; margin-top: 8px;">⏳ Waiting for admin response...</p>'
          }
          
          <div class="result-date">
            Submitted: ${submittedDate}
            ${
              item.respondedAt
                ? ` | Responded: ${new Date(
                    item.respondedAt
                  ).toLocaleDateString()}`
                : ""
            }
          </div>
        </div>
      `;
    });
    content.innerHTML = html;
  }

  document.getElementById("search-results-popup").style.display = "flex";
}

// Download Search Results as PDF
function downloadSearchResults() {
  if (currentSearchResults.length === 0) {
    showPopup("No results to download", 2000, false);
    return;
  }

  generatePDFReport(
    currentSearchResults.filter((r) => r.status === "responded")
  );
  showPopup("✅ PDF generated!", 2000, true);
}

function toggleFilters() {
  const wrapper = document.getElementById("filtersWrapper");
  const icon = document.getElementById("filterToggleIcon");
  const text = document.getElementById("filterToggleText");

  if (wrapper.style.display === "none") {
    wrapper.style.display = "block";
    text.textContent = "Hide Filters";
    icon.classList.add("rotated");
  } else {
    wrapper.style.display = "none";
    text.textContent = "Show Filters";
    icon.classList.remove("rotated");
  }
}

updateCharCount();

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (event) {
    const now = new Date().getTime();
    if (now - lastTouchEnd <= 300) {
      event.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

window.onclick = function (event) {
  const aboutPopup = document.getElementById("about-popup");
  const itPopup = document.getElementById("it-popup");
  const anonPopup = document.getElementById("anonymous-popup");

  if (event.target === aboutPopup) aboutPopup.style.display = "none";
  if (event.target === itPopup) itPopup.style.display = "none";
  if (event.target === anonPopup) anonPopup.style.display = "none";
};
