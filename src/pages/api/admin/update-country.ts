import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.formData();

    const id = body.get('id');
    const slug = body.get('slug');
    const name_en = body.get('name_en');
    const name_de = body.get('name_de');
    const description_en = body.get('description_en');
    const description_de = body.get('description_de');
    const card_description_en = body.get('card_description_en');
    const card_description_de = body.get('card_description_de');
    const flag_emoji = body.get('flag_emoji');
    const order_index = body.get('order_index');
    const is_active = body.get('is_active') ? true : false;
    const faq_en_raw = body.get('faq_en');
    const faq_de_raw = body.get('faq_de');

    function parseFaq(raw: FormDataEntryValue | null) {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw.toString());
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch { return null; }
    }

    if (!id) return errorResponse('Country ID is required', 400);

    const updateData: any = {};

    if (slug) updateData.slug = slug.toString().trim();
    if (name_en) updateData.name_en = name_en.toString().trim();
    updateData.name_de = name_de?.toString().trim() || null;
    updateData.description_en = description_en?.toString().trim() || null;
    updateData.description_de = description_de?.toString().trim() || null;
    updateData.card_description_en = card_description_en?.toString().trim() || null;
    updateData.card_description_de = card_description_de?.toString().trim() || null;
    updateData.flag_emoji = flag_emoji?.toString().trim() || null;
    updateData.order_index = order_index ? parseInt(order_index.toString()) : null;
    updateData.is_active = is_active;
    updateData.faq_en = parseFaq(faq_en_raw);
    updateData.faq_de = parseFaq(faq_de_raw);

    const { error } = await supabaseAdmin
      .from('countries')
      .update(updateData)
      .eq('id', id.toString());

    if (error) {
      console.error('Error updating country:', error);
      return errorResponse(error.message || 'Failed to update country', 500);
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/countries' },
    });
  } catch (error: any) {
    console.error('Error in update-country endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};
