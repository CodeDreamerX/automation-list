import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { errorResponse } from '../../../lib/api/responses';

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
    const card_description_en = body.get("card_description_en");
    const card_description_de = body.get("card_description_de");
    const meta_description_en = body.get("meta_description_en");
    const meta_description_de = body.get("meta_description_de");
    const headline_en = body.get("headline_en");
    const headline_de = body.get("headline_de");
    const meta_title_en = body.get("meta_title_en");
    const meta_title_de = body.get("meta_title_de");
    const icon_name = body.get("icon_name");
    const order_index = body.get("order_index");
    const is_active = body.get("is_active") ? true : false;
    const faq_en_raw = body.get("faq_en");
    const faq_de_raw = body.get("faq_de");

    function parseFaq(raw: FormDataEntryValue | null) {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw.toString());
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch { return null; }
    }

    if (!id) {
      return errorResponse('Industry ID is required', 400);
    }

    // Prepare update data with proper type conversions
    const updateData: any = {};

    if (slug) updateData.slug = slug.toString().trim();
    if (name_en) updateData.name_en = name_en.toString().trim();
    if (name_de) updateData.name_de = name_de.toString().trim();
    if (description_en !== null) updateData.description_en = description_en?.toString().trim() || null;
    if (description_de !== null) updateData.description_de = description_de?.toString().trim() || null;
    if (card_description_en !== null) updateData.card_description_en = card_description_en?.toString().trim() || null;
    if (card_description_de !== null) updateData.card_description_de = card_description_de?.toString().trim() || null;
    if (meta_description_en !== null) updateData.meta_description_en = meta_description_en?.toString().trim() || null;
    if (meta_description_de !== null) updateData.meta_description_de = meta_description_de?.toString().trim() || null;
    if (headline_en !== null) updateData.headline_en = headline_en?.toString().trim() || null;
    if (headline_de !== null) updateData.headline_de = headline_de?.toString().trim() || null;
    if (meta_title_en !== null) updateData.meta_title_en = meta_title_en?.toString().trim() || null;
    if (meta_title_de !== null) updateData.meta_title_de = meta_title_de?.toString().trim() || null;
    updateData.icon_name = icon_name?.toString().trim() || null;
    if (order_index !== null && order_index !== '') {
      updateData.order_index = parseInt(order_index.toString());
    } else {
      updateData.order_index = null;
    }
    updateData.is_active = is_active;
    updateData.faq_en = parseFaq(faq_en_raw);
    updateData.faq_de = parseFaq(faq_de_raw);

    // Update industry using admin client
    const { error } = await supabaseAdmin
      .from('industries')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating industry:', error);
      return errorResponse(error.message || 'Failed to update industry', 500);
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/industries' },
    });
  } catch (error: any) {
    console.error('Error in update-industry endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};





