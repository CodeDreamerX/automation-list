import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.formData();
    
    const id = body.get("id");
    const slug = body.get("slug");
    const name_en = body.get("name_en");
    const name_de = body.get("name_de");
    const description_en = body.get("description_en");
    const description_de = body.get("description_de");
    const icon_name = body.get("icon_name");
    const order_index = body.get("order_index");
    const is_active = body.get("is_active") ? true : false;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Category ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare update data with proper type conversions
    const updateData: any = {};

    if (slug) updateData.slug = slug.toString().trim();
    if (name_en) updateData.name_en = name_en.toString().trim();
    if (name_de) updateData.name_de = name_de.toString().trim();
    if (description_en !== null) updateData.description_en = description_en?.toString().trim() || null;
    if (description_de !== null) updateData.description_de = description_de?.toString().trim() || null;
    if (icon_name !== null) updateData.icon_name = icon_name?.toString() || null;
    if (order_index !== null && order_index !== '') {
      updateData.order_index = parseInt(order_index.toString());
    } else {
      updateData.order_index = null;
    }
    updateData.is_active = is_active;

    // Update category using admin client
    const { error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to update category' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/categories' },
    });
  } catch (error: any) {
    console.error('Error in update-category endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

