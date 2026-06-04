import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { id, force_active } = body;

    if (!id || typeof id !== 'string') {
      return errorResponse('Category ID is required', 400);
    }
    if (typeof force_active !== 'boolean') {
      return errorResponse('force_active must be a boolean', 400);
    }

    // Update force_active; the DB trigger sync_category_is_active will
    // automatically recalculate is_active = (status = 'active') OR force_active.
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ force_active })
      .eq('id', id)
      .select('id, force_active, is_active, status')
      .single();

    if (error) {
      console.error('Error updating force_active:', error);
      return errorResponse(error.message || 'Failed to update category', 500);
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id, force_active: data.force_active, is_active: data.is_active, status: data.status }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    console.error('Error in update-category-force-active:', err);
    return errorResponse(err.message || 'Internal server error', 500);
  }
};
