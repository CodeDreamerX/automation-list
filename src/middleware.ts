import type { MiddlewareHandler } from 'astro';
import { initSentry } from './lib/sentry';

// Initialize Sentry once, globally
initSentry();

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { url, cookies, locals } = context;
  
  // Check if this is an admin route (excluding login page, login API, and logout API)
  const isAdminRoute = url.pathname.startsWith('/admin') && 
                       url.pathname !== '/admin/login' && 
                       url.pathname !== '/api/admin/login' &&
                       url.pathname !== '/api/admin/logout';
  
  // Check if this is an admin API route (for proper error responses)
  const isAdminApiRoute = url.pathname.startsWith('/api/admin') && 
                          url.pathname !== '/api/admin/login' &&
                          url.pathname !== '/api/admin/logout';
  
  // Check if this is a prerendered route (these routes have export const prerender = true)
  // Prerendered routes don't have access to request headers, so skip Supabase client creation
  const isPrerenderedRoute = 
    url.pathname.startsWith('/en/vendor/') ||
    url.pathname.startsWith('/de/vendor/') ||
    url.pathname.startsWith('/en/category/') ||
    url.pathname.startsWith('/de/category/') ||
    url.pathname.startsWith('/en/technology/') ||
    url.pathname.startsWith('/de/technology/') ||
    url.pathname.startsWith('/en/country/') ||
    url.pathname.startsWith('/de/country/') ||
    url.pathname === '/robots.txt';
  
  // Early return for prerendered routes - skip all Supabase client operations
  if (isPrerenderedRoute) {
    locals.isAdmin = false;
    return next();
  }
  
  if (isAdminRoute) {
    // Dynamically import Supabase client only when needed (not for prerendered routes)
    const { createSupabaseServerClient } = await import('./lib/supabaseServer');
    
    // Create Supabase client and check authentication
    const supabase = createSupabaseServerClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    
    // If no user, block access
    if (!user) {
      if (isAdminApiRoute) {
        // API routes: return 401 JSON
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      } else {
        // Page routes: redirect to login
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/admin/login'
          }
        });
      }
    }
    
    // Query user_roles table to check if user has admin role
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    
    // Check if user has admin role (handle case where no role exists)
    // Block access if: no role entry exists, or role is not 'admin'
    const isAdmin = roleData?.role === 'admin';
    
    // Set admin status in locals for use in pages
    locals.isAdmin = isAdmin;
    
    // If not admin, block access
    if (!isAdmin) {
      if (isAdminApiRoute) {
        // API routes: return 401 JSON
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { 
            status: 401, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      } else {
        // Page routes: redirect to login
        return new Response(null, {
          status: 302,
          headers: {
            'Location': '/admin/login'
          }
        });
      }
    }
  } else {
    // For non-admin routes, dynamically import Supabase client only when needed
    try {
      const { createSupabaseServerClient } = await import('./lib/supabaseServer');
      const supabase = createSupabaseServerClient(cookies);
      const { data: { user } } = await supabase.auth.getUser();
      locals.isAdmin = !!(user && user.user_metadata?.role === 'admin');
    } catch {
      // If Supabase client creation fails, just set isAdmin to false
      locals.isAdmin = false;
    }
  }
  
  return next();
};

