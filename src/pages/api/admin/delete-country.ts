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

    if (!id) return errorResponse('Country ID is required', 400);

    // vendor_countries has ON DELETE CASCADE, but delete explicitly for clarity
    const { error: junctionError } = await supabaseAdmin
      .from('vendor_countries')
      .delete()
      .eq('country_id', id);

    if (junctionError) {
      console.error('Error deleting vendor_countries:', junctionError);
      return errorResponse(junctionError.message || 'Failed to delete vendor_countries', 500);
    }

    const { error: countryError } = await supabaseAdmin
      .from('countries')
      .delete()
      .eq('id', id);

    if (countryError) {
      console.error('Error deleting country:', countryError);
      return errorResponse(countryError.message || 'Failed to delete country', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in delete-country endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};
