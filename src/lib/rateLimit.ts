// src/lib/rateLimit.ts
// Rate limiting utility for API endpoints
// Uses in-memory storage (for production, consider Redis or database-backed solution)

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp when the limit resets
  firstAttempt: number; // Timestamp of first attempt in this window
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number; // Maximum number of attempts allowed
  windowMs: number; // Time window in milliseconds
}

/**
 * Default rate limit configuration for login attempts
 * 5 attempts per 15 minutes
 */
export const DEFAULT_LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if a request should be rate limited
 * 
 * @param identifier - Unique identifier (e.g., IP address, email)
 * @param config - Rate limit configuration
 * @returns Object with `allowed` boolean and `remaining` attempts, or `retryAfter` seconds if blocked
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_LOGIN_RATE_LIMIT
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries(now);
  }

  // No previous attempts or window expired
  if (!entry || now >= entry.resetAt) {
    // Create new entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
      firstAttempt: now,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
    };
  }

  // Increment attempt count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter,
    };
  }

  // Update store
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.count,
  };
}

/**
 * Reset rate limit for an identifier (useful after successful login)
 * 
 * @param identifier - Unique identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get client IP address from request
 * 
 * @param request - Request object
 * @returns IP address string
 */
export function getClientIP(request: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  // Fallback (may not work in all environments)
  return 'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 * 
 * @param now - Current timestamp
 */
function cleanupExpiredEntries(now: number): void {
  try {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetAt) {
        rateLimitStore.delete(key);
      }
    }
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}

