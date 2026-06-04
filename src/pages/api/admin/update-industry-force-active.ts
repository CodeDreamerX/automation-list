import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const { id, force_active } = await request.json();

    if (!id) {
      return errorResponse('Industry ID is required', 400);
    }
    if (typeof force_active !== 'boolean') {
      return errorResponse('force_active must be a boolean', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('industries')
      .update({ force_active })
      .eq('id', id)
      .select('id, force_active, is_active, status')
      .single();

    if (error) {
      console.error('Error updating industry force_active:', error);
      return errorResponse(error.message || 'Failed to update industry', 500);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Error in update-industry-force-active:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
};
