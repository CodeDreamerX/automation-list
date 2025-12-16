/**
 * Cookie Consent Helper for Google Analytics
 * 
 * Manages user consent for Google Analytics tracking using localStorage.
 * GA4 script is only loaded after explicit user consent.
 */

const CONSENT_KEY = "cookie_consent";
const GA_MEASUREMENT_ID = "G-ERFBQMBSJP";

/**
 * Check if user has given consent for analytics
 * @returns true if consent is "accepted", false otherwise
 */
export function hasConsent(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const consent = localStorage.getItem(CONSENT_KEY);
    return consent === "accepted";
  } catch (error) {
    // localStorage may not be available (e.g., in private browsing)
    return false;
  }
}

/**
 * Set user consent for analytics
 * @param value - "accepted" or "rejected"
 */
export function setConsent(value: "accepted" | "rejected"): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(CONSENT_KEY, value);
    
    // If consent is accepted, load GA immediately
    if (value === "accepted") {
      loadGoogleAnalytics();
    }
  } catch (error) {
    // localStorage may not be available
    console.warn("Failed to save consent preference:", error);
  }
}

/**
 * Dynamically load Google Analytics script
 * Only loads if consent is "accepted" and GA hasn't been loaded yet
 */
export function loadGoogleAnalytics(): void {
  if (typeof window === "undefined") {
    return;
  }

  // Check consent before loading
  if (!hasConsent()) {
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

// Type declaration for window.dataLayer and window.gtag
declare global {
  interface Window {
    dataLayer: unknown[][];
    gtag: (...args: unknown[]) => void;
  }
}








