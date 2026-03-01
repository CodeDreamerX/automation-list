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

  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((value: unknown) => typeof value === 'string' && value.trim().length > 0)
    : [];

  if (ids.length === 0) {
    return errorResponse('At least one listing ID is required', 400);
  }

  const { error } = await supabaseAdmin
    .from('pending_listings')
    .delete()
    .in('id', ids)
    .eq('status', 'rejected');

  if (error) {
    console.error('bulk-delete-listings error:', error);
    return errorResponse(error.message || 'Failed to delete listings', 500);
  }

  return successResponse({ count: ids.length });
};
