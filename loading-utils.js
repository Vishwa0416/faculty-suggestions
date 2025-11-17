/**
 * Loading State & UX Utility Functions
 * Faculty Suggestion Portal
 * Created: 2025-11-11
 */

// Global loading overlay
let loadingOverlay = null;
let disabledElements = [];

/**
 * Show global loading overlay with message
 */
function showGlobalLoading(message = "Loading...") {
  if (loadingOverlay) return; // Prevent multiple overlays

  loadingOverlay = document.createElement("div");
  loadingOverlay.className = "loading-overlay";
  loadingOverlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-message">${message}</p>
    </div>
  `;

  document.body.appendChild(loadingOverlay);
  document.body.style.overflow = "hidden"; // Prevent scrolling
}

/**
 * Hide global loading overlay
 */
function hideGlobalLoading() {
  if (loadingOverlay) {
    loadingOverlay.remove();
    loadingOverlay = null;
    document.body.style.overflow = "";
  }
}

/**
 * Update loading message
 */
function updateLoadingMessage(message) {
  if (loadingOverlay) {
    const messageEl = loadingOverlay.querySelector(".loading-message");
    if (messageEl) {
      messageEl.textContent = message;
    }
  }
}

/**
 * Disable all navigation elements
 */
function disableNavigation() {
  const navigationElements = [
    document.getElementById("globalBackBtn"),
    ...document.querySelectorAll(".back-to-portal"),
    ...document.querySelectorAll(".admin-btn"),
    ...document.querySelectorAll(".logout-btn"),
  ];

  navigationElements.forEach((el) => {
    if (el && !el.hasAttribute("data-was-disabled")) {
      el.setAttribute("data-was-disabled", el.disabled || "false");
      el.disabled = true;
      el.style.pointerEvents = "none";
      el.style.opacity = "0.5";
      disabledElements.push(el);
    }
  });
}

/**
 * Enable all navigation elements
 */
function enableNavigation() {
  disabledElements.forEach((el) => {
    const wasDisabled = el.getAttribute("data-was-disabled");
    if (wasDisabled === "false") {
      el.disabled = false;
    }
    el.style.pointerEvents = "";
    el.style.opacity = "";
    el.removeAttribute("data-was-disabled");
  });
  disabledElements = [];
}

/**
 * Disable a specific form and all its inputs
 */
function disableForm(formSelector) {
  const form =
    typeof formSelector === "string"
      ? document.querySelector(formSelector)
      : formSelector;
  if (!form) return;

  const inputs = form.querySelectorAll(
    "input, textarea, select, button:not([data-keep-enabled])"
  );
  inputs.forEach((input) => {
    if (!input.hasAttribute("data-was-disabled")) {
      input.setAttribute("data-was-disabled", input.disabled || "false");
      input.disabled = true;
      input.style.opacity = "0.6";
      disabledElements.push(input);
    }
  });

  form.style.pointerEvents = "none";
}

/**
 * Enable a specific form and all its inputs
 */
function enableForm(formSelector) {
  const form =
    typeof formSelector === "string"
      ? document.querySelector(formSelector)
      : formSelector;
  if (!form) return;

  const inputs = form.querySelectorAll("input, textarea, select, button");
  inputs.forEach((input) => {
    const wasDisabled = input.getAttribute("data-was-disabled");
    if (wasDisabled === "false") {
      input.disabled = false;
    }
    input.style.opacity = "";
    input.removeAttribute("data-was-disabled");
  });

  form.style.pointerEvents = "";

  // Remove from disabled elements array
  disabledElements = disabledElements.filter(
    (el) => !form.contains(el) && el !== form
  );
}

/**
 * Disable specific section
 */
function disableSection(sectionSelector) {
  const section =
    typeof sectionSelector === "string"
      ? document.querySelector(sectionSelector)
      : sectionSelector;
  if (!section) return;

  section.classList.add("section-disabled");
  section.style.pointerEvents = "none";
  disabledElements.push(section);
}

/**
 * Enable specific section
 */
function enableSection(sectionSelector) {
  const section =
    typeof sectionSelector === "string"
      ? document.querySelector(sectionSelector)
      : sectionSelector;
  if (!section) return;

  section.classList.remove("section-disabled");
  section.style.pointerEvents = "";
  disabledElements = disabledElements.filter((el) => el !== section);
}

/**
 * Set button to loading state
 */
function setButtonLoading(buttonSelector, loadingText = "Loading...") {
  const button =
    typeof buttonSelector === "string"
      ? document.querySelector(buttonSelector)
      : buttonSelector;
  if (!button) return;

  button.setAttribute("data-original-text", button.textContent);
  button.setAttribute("data-original-html", button.innerHTML);
  button.textContent = loadingText;
  button.disabled = true;
  button.classList.add("btn-loading");
  disabledElements.push(button);
}

/**
 * Remove loading state from button
 */
function removeButtonLoading(buttonSelector) {
  const button =
    typeof buttonSelector === "string"
      ? document.querySelector(buttonSelector)
      : buttonSelector;
  if (!button) return;

  const originalText = button.getAttribute("data-original-text");
  const originalHtml = button.getAttribute("data-original-html");

  if (originalHtml) {
    button.innerHTML = originalHtml;
  } else if (originalText) {
    button.textContent = originalText;
  }

  button.disabled = false;
  button.classList.remove("btn-loading");
  button.removeAttribute("data-original-text");
  button.removeAttribute("data-original-html");

  disabledElements = disabledElements.filter((el) => el !== button);
}

/**
 * Disable all interactive elements on page
 */
function disableAllInteractions() {
  disableNavigation();

  // Disable all buttons
  document
    .querySelectorAll("button:not([data-keep-enabled])")
    .forEach((btn) => {
      if (!btn.hasAttribute("data-was-disabled")) {
        btn.setAttribute("data-was-disabled", btn.disabled || "false");
        btn.disabled = true;
        btn.style.opacity = "0.6";
        disabledElements.push(btn);
      }
    });

  // Disable all inputs
  document.querySelectorAll("input, textarea, select").forEach((input) => {
    if (!input.hasAttribute("data-was-disabled")) {
      input.setAttribute("data-was-disabled", input.disabled || "false");
      input.disabled = true;
      input.style.opacity = "0.6";
      disabledElements.push(input);
    }
  });

  // Disable all links
  document.querySelectorAll("a").forEach((link) => {
    link.style.pointerEvents = "none";
    link.style.opacity = "0.6";
    disabledElements.push(link);
  });
}

/**
 * Enable all interactive elements on page
 */
function enableAllInteractions() {
  enableNavigation();

  disabledElements.forEach((el) => {
    const wasDisabled = el.getAttribute("data-was-disabled");
    if (wasDisabled === "false") {
      el.disabled = false;
    }
    el.style.pointerEvents = "";
    el.style.opacity = "";
    el.removeAttribute("data-was-disabled");
  });

  disabledElements = [];
}

/**
 * Show loading state for specific card/section
 */
function showCardLoading(cardSelector, message = "Loading...") {
  const card =
    typeof cardSelector === "string"
      ? document.querySelector(cardSelector)
      : cardSelector;
  if (!card) return;

  const overlay = document.createElement("div");
  overlay.className = "card-loading-overlay";
  overlay.innerHTML = `
    <div class="loading-spinner"></div>
    <p>${message}</p>
  `;
  overlay.setAttribute("data-loading-overlay", "true");

  card.style.position = "relative";
  card.appendChild(overlay);
}

/**
 * Hide loading state for specific card/section
 */
function hideCardLoading(cardSelector) {
  const card =
    typeof cardSelector === "string"
      ? document.querySelector(cardSelector)
      : cardSelector;
  if (!card) return;

  const overlay = card.querySelector('[data-loading-overlay="true"]');
  if (overlay) {
    overlay.remove();
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    showGlobalLoading,
    hideGlobalLoading,
    updateLoadingMessage,
    disableNavigation,
    enableNavigation,
    disableForm,
    enableForm,
    disableSection,
    enableSection,
    setButtonLoading,
    removeButtonLoading,
    disableAllInteractions,
    enableAllInteractions,
    showCardLoading,
    hideCardLoading,
  };
}
