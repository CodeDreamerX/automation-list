import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    // Call the Postgres function to refresh vendor count materialized views
    const { error } = await supabaseAdmin.rpc('refresh_vendor_counts');

    if (error) {
      console.error('Error refreshing vendor counts:', error);
      return errorResponse(error.message || 'Failed to refresh vendor counts', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in refresh-counts endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};





















