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
      return errorResponse('Industry ID is required', 400);
    }

    const { error: vendorIndustriesError } = await supabaseAdmin
      .from('vendor_industries')
      .delete()
      .eq('industry_id', id);

    if (vendorIndustriesError) {
      console.error('Error deleting vendor_industries:', vendorIndustriesError);
      return errorResponse(vendorIndustriesError.message || 'Failed to delete vendor_industries', 500);
    }

    const { error: industryError } = await supabaseAdmin
      .from('industries')
      .delete()
      .eq('id', id);

    if (industryError) {
      console.error('Error deleting industry:', industryError);
      return errorResponse(industryError.message || 'Failed to delete industry', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in delete-industry endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};
