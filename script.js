// Get the current year and set it in the footer
const currentYear = new Date().getFullYear();
document.getElementById("current-year").textContent = currentYear;

const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxEyQoGh0gn4nh7RAB9esq25-CpfByAnDU9eu_xwKbz_VW-JusSCSzkjK6rllYrXz3e/exec";

let roleChosen = null;
let deptChosen = null;
let deptIcon = null;
let deptTheme = null;

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

  // Small delay for visual feedback
  setTimeout(() => showStep(3), 300);
}


function showStep(n) {
  document
    .querySelectorAll(".step")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("step" + n).classList.add("active");

  // Update theme for step 3
  if (n === 3 && deptTheme) {
    applyDepartmentTheme();
  } else if (n !== 3) {
    // Remove theme when not on step 3
    document.body.className = "";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyDepartmentTheme() {
  // Apply theme to body
  document.body.className = `theme-${deptTheme}`;

  // Update banner content
  document.getElementById("bannerIcon").textContent = deptIcon;
  document.getElementById("bannerTitle").textContent = deptChosen;
  document.getElementById("bannerSubtitle").textContent =
    deptMessages[deptChosen] || "Share your valuable feedback with us";
  document.getElementById("roleBadge").textContent = roleChosen;
}

function goBack(n) {
  showStep(n);
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

  // Change color if approaching limit
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

async function submitSuggestion() {
  const suggestion = document.getElementById("suggestion").value.trim();
  const senderEmail = document.getElementById("senderEmail").value.trim();
  const hp = document.getElementById("hp_field").value;
  const submitBtn = document.getElementById("submitBtn");

  // Honeypot check
  if (hp) {
    showPopup("Spam detected", 4000, false);
    return;
  }

  // Validation
  if (!suggestion) {
    showPopup("Please type a suggestion", 3000, false);
    return;
  }

  if (suggestion.length > 5000) {
    showPopup("Suggestion too long (max 5000 characters)", 3000, false);
    return;
  }

  // Disable button during submission
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  showPopup("Sending your suggestion...", 2000, true);

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
      }),
    });

    showPopup("✅ Suggestion delivered — thank you!", 4000, true);

    // Reset form
    document.getElementById("suggestion").value = "";
    document.getElementById("senderEmail").value = "";
    updateCharCount();

    // Reset variables
    deptChosen = null;
    deptIcon = null;
    deptTheme = null;

    // Go back to step 1 after a short delay
    setTimeout(() => {
      showStep(1);
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Suggestion";
    }, 2000);
  } catch (err) {
    console.error(err);
    showPopup("❌ Network error. Please try again.", 5000, false);
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Suggestion";
  }
}

// Initialize character counter
updateCharCount();

// Prevent zoom on double tap for iOS
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
//popup functions
function openPopup(id) {
  document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
  document.getElementById(id).style.display = "none";
}

window.onclick = function (event) {
  const aboutPopup = document.getElementById("about-popup");
  const itPopup = document.getElementById("it-popup");
  if (event.target === aboutPopup) aboutPopup.style.display = "none";
  if (event.target === itPopup) itPopup.style.display = "none";
};
function showStep(n) {
  document
    .querySelectorAll(".step")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("step" + n).classList.add("active");

  // Update theme for step 3
  if (n === 3 && deptTheme) {
    applyDepartmentTheme();
  } else if (n !== 3) {
    document.body.className = "";
  }

  // Show or hide global back button
  const backBtn = document.getElementById("globalBackBtn");
  if (n === 1) {
    backBtn.style.display = "none";
  } else {
    backBtn.style.display = "block";
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
  
}
