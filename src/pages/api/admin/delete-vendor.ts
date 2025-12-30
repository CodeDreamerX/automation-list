import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return errorResponse('Vendor ID is required', 400);
    }

    // Delete vendor using admin client
    const { error } = await supabaseAdmin
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vendor:', error);
      return errorResponse(error.message || 'Failed to delete vendor', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in delete-vendor endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};

