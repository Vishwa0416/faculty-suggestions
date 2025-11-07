// Predefined admin accounts
const ADMIN_ACCOUNTS = [
  {
    id: 1,
    username: "hod.business@mgt.sab.ac.lk",
    password: "Business@FMS2024",
    role: "Head of Department",
    department: "Department of Business Management",
    name: "HOD - Business Management",
    accessLevel: "department", // Can only see own department
  },
  {
    id: 2,
    username: "hod.accountancy@mgt.sab.ac.lk",
    password: "Accountancy@FMS2024",
    role: "Head of Department",
    department: "Department of Accountancy and Finance",
    name: "HOD - Accountancy & Finance",
    accessLevel: "department",
  },
  {
    id: 3,
    username: "hod.marketing@mgt.sab.ac.lk",
    password: "Marketing@FMS2024",
    role: "Head of Department",
    department: "Department of Marketing Management",
    name: "HOD - Marketing Management",
    accessLevel: "department",
  },
  {
    id: 4,
    username: "hod.tourism@mgt.sab.ac.lk",
    password: "Tourism@FMS2024",
    role: "Head of Department",
    department: "Department of Tourism Management",
    name: "HOD - Tourism Management",
    accessLevel: "department",
  },
  {
    id: 5,
    username: "ar.fms@mgt.sab.ac.lk",
    password: "AssistantReg@FMS2024",
    role: "Assistant Registrar",
    department: "Faculty of Management Studies",
    name: "Assistant Registrar",
    accessLevel: "all", // Can see all departments
  },
  {
    id: 6,
    username: "superadmin@mgt.sab.ac.lk",
    password: "SuperAdmin@FMS2024",
    role: "Super Administrator",
    department: "Faculty of Management Studies",
    name: "Super Administrator",
    accessLevel: "superadmin", // Can see all but read-only
  },
];

// Check if user is already logged in
function checkExistingSession() {
  const adminData = sessionStorage.getItem("adminSession");
  if (adminData) {
    window.location.href = "admin-dashboard.html";
  }
}

checkExistingSession();

// Handle login form submission
function handleLogin(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const loginBtn = document.getElementById("loginBtn");
  const errorMessage = document.getElementById("errorMessage");

  errorMessage.classList.remove("show");
  errorMessage.textContent = "";

  if (!username || !password) {
    showError("Please enter both username and password");
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";
  loginBtn.classList.add("loading");

  setTimeout(() => {
    const admin = ADMIN_ACCOUNTS.find(
      (acc) => acc.username === username && acc.password === password
    );

    if (admin) {
      const sessionData = {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        department: admin.department,
        name: admin.name,
        accessLevel: admin.accessLevel,
        loginTime: new Date().toISOString(),
      };

      sessionStorage.setItem("adminSession", JSON.stringify(sessionData));
      localStorage.setItem("lastLogin", new Date().toISOString());

      logLoginActivity(admin);
      showSuccess("Login successful! Redirecting...");

      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 1000);
    } else {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
      loginBtn.classList.remove("loading");
      showError("Invalid username or password. Please try again.");
      logFailedAttempt(username);
    }
  }, 1000);
}

function showError(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
  errorMessage.style.background = "#fee";
  errorMessage.style.color = "#c33";
  errorMessage.style.borderColor = "#fcc";
}

function showSuccess(message) {
  const errorMessage = document.getElementById("errorMessage");
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
  errorMessage.style.background = "#efe";
  errorMessage.style.color = "#3c3";
  errorMessage.style.borderColor = "#cfc";
}

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

function showForgotPassword(event) {
  event.preventDefault();
  document.getElementById("forgotPasswordModal").classList.add("show");
}

function closeForgotPassword() {
  document.getElementById("forgotPasswordModal").classList.remove("show");
}

window.onclick = function (event) {
  const modal = document.getElementById("forgotPasswordModal");
  if (event.target === modal) {
    closeForgotPassword();
  }
};

function logLoginActivity(admin) {
  const loginHistory = JSON.parse(localStorage.getItem("loginHistory")) || [];
  loginHistory.push({
    username: admin.username,
    name: admin.name,
    department: admin.department,
    timestamp: new Date().toISOString(),
    success: true,
  });
  if (loginHistory.length > 50) {
    loginHistory.shift();
  }
  localStorage.setItem("loginHistory", JSON.stringify(loginHistory));
}

function logFailedAttempt(username) {
  const failedAttempts =
    JSON.parse(localStorage.getItem("failedAttempts")) || [];
  failedAttempts.push({
    username: username,
    timestamp: new Date().toISOString(),
  });
  if (failedAttempts.length > 50) {
    failedAttempts.shift();
  }
  localStorage.setItem("failedAttempts", JSON.stringify(failedAttempts));
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeForgotPassword();
  }
});

window.addEventListener("load", function () {
  document.getElementById("username").focus();
});

document.getElementById("username").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.getElementById("password").focus();
  }
});

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

console.log("Admin Login System Initialized");
console.log("Available Admin Accounts:");
ADMIN_ACCOUNTS.forEach((admin) => {
  console.log(
    `- ${admin.name} (${admin.username}) - Access: ${admin.accessLevel}`
  );
});
