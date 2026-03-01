import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body', 400);
  }

  const { id, reject_reason } = body;
  if (!id) return errorResponse('Listing ID is required', 400);

  const { error } = await supabaseAdmin
    .from('pending_listings')
    .update({
      status: 'rejected',
      reject_reason: reject_reason?.trim() || null,
    })
    .eq('id', id);

  if (error) {
    console.error('reject-listing error:', error);
    return errorResponse(error.message || 'Failed to reject listing', 500);
  }

  return successResponse();
};
