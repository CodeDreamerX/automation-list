/**
 * Cookie Banner Client-Side Logic
 * Handles showing/hiding the cookie consent banner
 */

const CONSENT_KEY = "cookie_consent";
const GA_MEASUREMENT_ID = "G-ERFBQMBSJP";

// Load Google Analytics dynamically
function loadGoogleAnalytics(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Prevent double-loading
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    return;
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  }

  // Load GA script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Configure GA
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID);

  // Make gtag available globally
  (window as any).gtag = gtag;
}

// Check if consent decision exists
function hasConsentDecision(): boolean {
  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent !== null; // Decision exists if key is present
  } catch (error) {
    return true; // Hide if localStorage unavailable
  }
}

// Show banner only if no decision exists
function initBanner(): void {
  const banner = document.getElementById("cookie-banner");
  if (!banner) {
    // Retry if banner not found yet (hydration delay)
    setTimeout(initBanner, 50);
    return;
  }

  if (hasConsentDecision()) {
    banner.classList.add("hidden");
    return; // Hide banner if decision already made
  }

  // Show banner if no decision exists
  banner.classList.remove("hidden");
}

// Handle accept
function handleAccept(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "accepted");
    const banner = document.getElementById("cookie-banner");
    if (banner) {
      banner.classList.add("hidden");
    }
    // Load GA immediately after consent
    loadGoogleAnalytics();
  } catch (error) {
    console.warn("Failed to save consent preference:", error);
  }
}

// Handle reject
function handleReject(): void {
  try {
    localStorage.setItem(CONSENT_KEY, "rejected");
    const banner = document.getElementById("cookie-banner");
    if (banner) {
      banner.classList.add("hidden");
    }
  } catch (error) {
    console.warn("Failed to save consent preference:", error);
  }
}

// Initialize when DOM is ready
function setupBanner(): void {
  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    initBanner();
    
    const acceptButton = document.getElementById("cookie-accept");
    const rejectButton = document.getElementById("cookie-reject");
    
    if (acceptButton) {
      acceptButton.addEventListener("click", handleAccept);
    }
    if (rejectButton) {
      rejectButton.addEventListener("click", handleReject);
    }
  });
}

// Wait for DOM to be ready
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupBanner);
  } else {
    // DOM already loaded, but wait a bit for hydration in SSR
    setTimeout(setupBanner, 100);
  }
}






