import type { MiddlewareHandler } from 'astro';
import { createSupabaseServerClient } from './lib/supabaseServer';

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
  
  if (isAdminRoute) {
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
    // For non-admin routes, check admin status (useful for UI)
    const supabase = createSupabaseServerClient(cookies);
    const { data: { user } } = await supabase.auth.getUser();
    locals.isAdmin = !!(user && user.user_metadata?.role === 'admin');
  }
  
  return next();
};

