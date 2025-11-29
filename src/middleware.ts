import type { MiddlewareHandler } from 'astro';
import { checkAuth } from './lib/admin/authUtils';

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, cookies, locals } = context;
  
  // Check if this is an admin route (excluding login page)
  const isAdminRoute = url.pathname.startsWith('/admin') && url.pathname !== '/admin/login';
  
  if (isAdminRoute) {
    // Validate admin session
    const isAuthenticated = checkAuth(cookies);
    
    // Set admin status in locals for use in pages
    locals.isAdmin = isAuthenticated;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/admin/login'
        }
      });
    }
  } else {
    // For non-admin routes, still set the status (useful for UI)
    locals.isAdmin = checkAuth(cookies);
  }
  
  return next();
};

