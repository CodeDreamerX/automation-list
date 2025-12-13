import * as Sentry from '@sentry/node';

let initialized = false;

/**
 * Initialize Sentry for server-side error tracking
 * Fails silently if SENTRY_DSN is not provided
 * Only initializes once, even if called multiple times
 */
export function initSentry() {
  // Prevent multiple initializations
  if (initialized) {
    return;
  }
  
  const dsn = import.meta.env.SENTRY_DSN;
  
  if (!dsn) {
    // Fail silently if DSN is missing
    initialized = true; // Mark as initialized to prevent retries
    return;
  }
  
  Sentry.init({
    dsn,
    // Server-side only - no client-side tracking
    integrations: [],
    // No tracing
    tracesSampleRate: 0,
    // No replay
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Environment
    environment: import.meta.env.MODE || 'development',
  });
  
  initialized = true;
}

