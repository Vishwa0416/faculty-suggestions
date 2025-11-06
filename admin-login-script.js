// Predefined admin accounts
const ADMIN_ACCOUNTS = [
  {
    id: 1,
    username: "hod.business@mgt.sab.ac.lk",
    password: "Business@FMS2024",
    role: "Head of Department",
    department: "Department of Business Management",
    name: "HOD - Business Management",
  },
  {
    id: 2,
    username: "hod.accountancy@mgt.sab.ac.lk",
    password: "Accountancy@FMS2024",
    role: "Head of Department",
    department: "Department of Accountancy and Finance",
    name: "HOD - Accountancy & Finance",
  },
  {
    id: 3,
    username: "hod.marketing@mgt.sab.ac.lk",
    password: "Marketing@FMS2024",
    role: "Head of Department",
    department: "Department of Marketing Management",
    name: "HOD - Marketing Management",
  },
  {
    id: 4,
    username: "hod.tourism@mgt.sab.ac.lk",
    password: "Tourism@FMS2024",
    role: "Head of Department",
    department: "Department of Tourism Management",
    name: "HOD - Tourism Management",
  },
  {
    id: 5,
    username: "ar.fms@mgt.sab.ac.lk",
    password: "AssistantReg@FMS2024",
    role: "Assistant Registrar",
    department: "Faculty of Management Studies",
    name: "Assistant Registrar",
  },
];

// Check if user is already logged in
function checkExistingSession() {
  const adminData = sessionStorage.getItem("adminSession");
  if (adminData) {
    // Redirect to admin dashboard
    window.location.href = "admin-dashboard.html";
  }
}

// Call on page load
checkExistingSession();

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");

  // Clear previous error
  errorMessage.classList.remove("show");
  errorMessage.textContent = "";

  // Validate inputs
  if (!username || !password) {
    showError("Please enter both username and password");
    return;
  }

  // Show loading state
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
  loginBtn.classList.add("loading");

  // Simulate network delay for better UX
  setTimeout(() => {
    // Find matching admin account
    const admin = ADMIN_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (admin) {
      // Successful login
      const sessionData = {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        department: admin.department,
        name: admin.name,
        loginTime: new Date().toISOString(),
      };

      // Store session data
      sessionStorage.setItem("adminSession", JSON.stringify(sessionData));
      localStorage.setItem("lastLogin", new Date().toISOString());

      // Log activity
      logLoginActivity(admin);

      // Show success message
      showSuccess("Login successful! Redirecting...");

      // Redirect to admin dashboard
      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1000);
    } else {
      // Failed login
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
      loginBtn.classList.remove("loading");

      showError("Invalid username or password. Please try again.");

      // Log failed attempt
      logFailedAttempt(username);
    }
  }, 1000);
}

// Show error message
function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
  errorMessage.style.background = "#fee";
  errorMessage.style.color = "#c33";
  errorMessage.style.borderColor = "#fcc";
}

// Show success message
function showSuccess(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
  errorMessage.style.background = "#efe";
  errorMessage.style.color = "#3c3";
  errorMessage.style.borderColor = "#cfc";
}

// Toggle password visibility
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eyeIcon");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeIcon.innerHTML = `
      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="#999" stroke-width="2" stroke-linecap="round"/>
    `;
  } else {
    passwordInput.type = "password";
    eyeIcon.innerHTML = `
      <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    `;
  }
}

// Show forgot password modal
function showForgotPassword(event) {
  event.preventDefault();
  const modal = document.getElementById("forgotPasswordModal");
  modal.classList.add("show");
}

// Close forgot password modal
function closeForgotPassword() {
  const modal = document.getElementById("forgotPasswordModal");
  modal.classList.remove("show");
}

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById("forgotPasswordModal");
  if (event.target === modal) {
    closeForgotPassword();
  }
};

// Log successful login activity
function logLoginActivity(admin) {
  const loginHistory = JSON.parse(localStorage.getItem("loginHistory")) || [];
  loginHistory.push({
    username: admin.username,
    name: admin.name,
    department: admin.department,
    timestamp: new Date().toISOString(),
    success: true,
  });
  // Keep only last 50 entries
  if (loginHistory.length > 50) {
    loginHistory.shift();
  }
  localStorage.setItem("loginHistory", JSON.stringify(loginHistory));
}

// Log failed login attempt
function logFailedAttempt(username) {
  const failedAttempts =
    JSON.parse(localStorage.getItem("failedAttempts")) || [];
  failedAttempts.push({
    username: username,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 50 entries
  if (failedAttempts.length > 50) {
    failedAttempts.shift();
  }
  localStorage.setItem("failedAttempts", JSON.stringify(failedAttempts));
}

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  // Close modal with Escape key
  if (event.key === "Escape") {
    closeForgotPassword();
  }
});

// Auto-focus username field on page load
window.addEventListener("load", function () {
  document.getElementById("username").focus();
});

// Prevent form submission on Enter in username field (UX improvement)
document.getElementById("username").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("password").focus();
  }
});

// Clear error message when user starts typing
document.getElementById("username").addEventListener("input", function () {
  const errorMessage = document.getElementById("errorMessage");
  if (errorMessage.classList.contains("show")) {
    errorMessage.classList.remove("show");
  }
});

document.getElementById("password").addEventListener("input", function () {
  const errorMessage = document.getElementById("errorMessage");
  if (errorMessage.classList.contains("show")) {
    errorMessage.classList.remove("show");
  }
});

// Console log for development (remove in production)
console.log("Admin Login System Initialized");
console.log("Available Admin Accounts:");
ADMIN_ACCOUNTS.forEach((admin) => {
  console.log(`- ${admin.name} (${admin.username})`);
});
