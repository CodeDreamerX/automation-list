// Authentication utilities for admin panel
// Admin authentication is handled by Supabase Auth + user_roles table
// Middleware sets locals.isAdmin based on Supabase session and user_roles

import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from '../supabaseServer';

// Protect admin routes - redirect to login if not authenticated
// Uses locals.isAdmin set by middleware (which checks Supabase Auth + user_roles)
export async function protectAdminRoute(
  locals?: { isAdmin?: boolean }
): Promise<Response | null> {
  if (!locals?.isAdmin) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/login'
      }
    });
  }
  return null;
}

/**
 * Protect admin API routes with explicit authentication check.
 * 
 * Defense-in-depth: Even though middleware protects these routes,
 * this explicit check ensures API endpoints are secure if middleware is bypassed.
 * 
 * Steps:
 * 1. Load session (create Supabase client from cookies)
 * 2. Get user from session
 * 3. Check user_roles table for admin role
 * 4. If not admin → return 401 JSON response
 * 
 * @param cookies - Astro cookies for session management
 * @returns Response with 401 status if unauthorized, null if authorized
 */
export async function protectAdminApiRoute(
  cookies: AstroCookies
): Promise<Response | null> {
  // 1. Load session
  const supabase = createSupabaseServerClient(cookies);
  
  // 2. Get user
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, return 401
  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // 3. Check user_roles table
  const { data: roleData } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  
  // 4. If not admin → return 401
  if (roleData?.role !== 'admin') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
  
  // Authorized
  return null;
}


