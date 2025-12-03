import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get("adminSession")?.value;
  
  if (!token || token !== '1') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Category ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // First, delete all vendor_categories rows referencing this category
    const { error: vendorCategoriesError } = await supabaseAdmin
      .from('vendor_categories')
      .delete()
      .eq('category_id', id);

    if (vendorCategoriesError) {
      console.error('Error deleting vendor_categories:', vendorCategoriesError);
      return new Response(
        JSON.stringify({ error: vendorCategoriesError.message || 'Failed to delete vendor_categories' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Then delete the category itself
    const { error: categoryError } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (categoryError) {
      console.error('Error deleting category:', categoryError);
      return new Response(
        JSON.stringify({ error: categoryError.message || 'Failed to delete category' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in delete-category endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

