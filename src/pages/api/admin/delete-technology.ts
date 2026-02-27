import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return errorResponse('Technology ID is required', 400);
    }

    const { error: vendorTechnologiesError } = await supabaseAdmin
      .from('vendor_technologies')
      .delete()
      .eq('technology_id', id);

    if (vendorTechnologiesError) {
      console.error('Error deleting vendor_technologies:', vendorTechnologiesError);
      return errorResponse(vendorTechnologiesError.message || 'Failed to delete vendor_technologies', 500);
    }

    const { error: technologyError } = await supabaseAdmin
      .from('technologies')
      .delete()
      .eq('id', id);

    if (technologyError) {
      console.error('Error deleting technology:', technologyError);
      return errorResponse(technologyError.message || 'Failed to delete technology', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in delete-technology endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};
