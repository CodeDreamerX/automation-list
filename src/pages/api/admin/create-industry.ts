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
    
    const slug = body.get("slug");
    const name_en = body.get("name_en");
    const name_de = body.get("name_de");
    const description_en = body.get("description_en");
    const description_de = body.get("description_de");
    const order_index = body.get("order_index");
    const is_active = body.get("is_active") ? true : false;

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Industry slug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!name_en) {
      return new Response(
        JSON.stringify({ error: 'Industry name (English) is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare insert data
    const insertData: any = {
      slug: slug.toString().trim(),
      name_en: name_en.toString().trim(),
      name_de: name_de?.toString().trim() || null,
      description_en: description_en?.toString().trim() || null,
      description_de: description_de?.toString().trim() || null,
      order_index: order_index ? parseInt(order_index.toString()) : null,
      is_active: is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create industry using admin client
    const { data, error } = await supabaseAdmin
      .from('industries')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating industry:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create industry' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/industries' },
    });
  } catch (error: any) {
    console.error('Error in create-industry endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};





