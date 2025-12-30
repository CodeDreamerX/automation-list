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
      return errorResponse('Category ID is required', 400);
    }

    // First, delete all vendor_categories rows referencing this category
    const { error: vendorCategoriesError } = await supabaseAdmin
      .from('vendor_categories')
      .delete()
      .eq('category_id', id);

    if (vendorCategoriesError) {
      console.error('Error deleting vendor_categories:', vendorCategoriesError);
      return errorResponse(vendorCategoriesError.message || 'Failed to delete vendor_categories', 500);
    }

    // Then delete the category itself
    const { error: categoryError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (categoryError) {
      console.error('Error deleting category:', categoryError);
      return errorResponse(categoryError.message || 'Failed to delete category', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in delete-category endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};

