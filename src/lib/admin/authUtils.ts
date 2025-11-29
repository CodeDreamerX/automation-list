// Authentication utilities for admin panel

export function checkAuth(cookies: any, request?: Request): boolean {
  // First try to get from cookies object (preferred)
  const authCookie = cookies.get('adminSession');
  if (authCookie?.value === '1') {
    return true;
  }
  
  // Only check request headers if request is provided AND we're in a server context
  // Skip header check entirely if request is not provided (e.g., in middleware)
  // or if we're in a prerendered context (import.meta.env.SSR will be false during prerendering)
  if (!request || !import.meta.env.SSR) {
    return false;
  }
  
  // For server-side fetch requests only, try to get headers
  // Use a runtime check that won't trigger static analysis warnings
  try {
    // Check if headers property exists using runtime property access
    // This avoids triggering Astro's static analysis during prerendering
    const hasHeaders = 'headers' in request;
    if (hasHeaders) {
      // Use bracket notation with type assertion to avoid static analysis
      const req = request as any;
      const headers = req['headers'];
      if (headers && typeof headers.get === 'function') {
        const cookieHeader = headers.get('cookie') || headers.get('Cookie');
        if (cookieHeader) {
          const cookiePairs = cookieHeader.split(';').map(c => c.trim());
          const adminSession = cookiePairs.find(c => c.startsWith('adminSession='));
          if (adminSession) {
            const value = adminSession.split('=')[1]?.trim();
            if (value === '1') {
              return true;
            }
          }
        }
      }
    }
  } catch {
    // Headers not available (e.g., during prerendering), skip header check
  }
  
  return false;
}

export function setAuthCookie(cookies: any): void {
  cookies.set('adminSession', '1', {
    path: '/',
    httpOnly: true,
    secure: false, // Allow in development
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 // 24 hours
  });
}

export function clearAuthCookie(cookies: any): void {
  // Delete cookie by setting it to expire immediately
  cookies.delete('adminSession', { 
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  });
  // Also try to set it to empty/expired to ensure it's cleared
  cookies.set('adminSession', '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0 // Expire immediately
  });
}

export function verifyPassword(submittedPassword: string): boolean {
  const correctPassword = import.meta.env.ADMIN_PASSWORD || '';
  return submittedPassword === correctPassword;
}

// Protect admin routes - redirect to login if not authenticated
// Can use Astro.locals.isAdmin if available (set by middleware), otherwise checks cookies directly
export async function protectAdminRoute(
  cookies: any, 
  locals?: { isAdmin?: boolean }
): Promise<Response | null> {
  // Prefer locals.isAdmin if available (set by middleware)
  const isAuthenticated = locals?.isAdmin !== undefined 
    ? locals.isAdmin 
    : checkAuth(cookies);
  
  if (!isAuthenticated) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/login'
      }
    });
  }
  return null;
}

// Helper to get cookie header string for server-side fetch requests
export function getCookieHeader(cookies: any, request?: Request): string {
  // First, try to get the adminSession cookie from Astro cookies
  const adminSession = cookies.get('adminSession');
  if (adminSession?.value) {
    return `adminSession=${adminSession.value}`;
  }
  
  // Only check request headers if request is provided AND we're in a server context
  // Skip header check if we're in a prerendered context (import.meta.env.SSR will be false during prerendering)
  if (!request || !import.meta.env.SSR) {
    return '';
  }
  
  // For server-side fetch requests only, try to get headers
  // Use a runtime check that won't trigger static analysis warnings
  try {
    // Check if headers property exists using runtime property access
    // This avoids triggering Astro's static analysis during prerendering
    const hasHeaders = 'headers' in request;
    if (hasHeaders) {
      // Use bracket notation with type assertion to avoid static analysis
      const req = request as any;
      const headers = req['headers'];
      if (headers && typeof headers.get === 'function') {
        const cookieHeader = headers.get('cookie') || headers.get('Cookie');
        if (cookieHeader) {
          // Extract adminSession from the cookie header
          const cookiePairs = cookieHeader.split(';').map(c => c.trim());
          const adminSessionCookie = cookiePairs.find(c => c.startsWith('adminSession='));
          if (adminSessionCookie) {
            return adminSessionCookie;
          }
          // If adminSession not found but header exists, return the full header
          return cookieHeader;
        }
      }
    }
  } catch {
    // Headers not available (e.g., during prerendering), skip header check
  }
  
  return '';
}


