// src/lib/cache.ts
// Simple in-memory cache for server-side use only (Astro server)

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Get cached data by key
 * @param key Cache key
 * @returns Cached data or null if not found or expired
 */
export function getCached<T>(key: string): T | null {
  try {
    const entry = cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  } catch (error) {
    // Graceful fallback: if cache fails, return null to allow query execution
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 * @param key Cache key
 * @param data Data to cache
 * @param ttlSeconds Time to live in seconds
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number): void {
  try {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    cache.set(key, {
      data,
      expiresAt
    });
  } catch (error) {
    // Graceful fallback: if cache fails, just log and continue
    console.error('Cache set error:', error);
  }
}

/**
 * Clear expired entries from cache (optional cleanup function)
 */
export function clearExpired(): void {
  try {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiresAt) {
        cache.delete(key);
      }
    }
  } catch (error) {
    console.error('Cache cleanup error:', error);
  }
}

