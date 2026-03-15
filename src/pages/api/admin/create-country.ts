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

    if (!slug) return errorResponse('Country slug is required', 400);
    if (!name_en) return errorResponse('Country name (English) is required', 400);

    const insertData = {
      slug: slug.toString().trim(),
      name_en: name_en.toString().trim(),
      name_de: name_de?.toString().trim() || null,
      description_en: description_en?.toString().trim() || null,
      description_de: description_de?.toString().trim() || null,
      card_description_en: card_description_en?.toString().trim() || null,
      card_description_de: card_description_de?.toString().trim() || null,
      flag_emoji: flag_emoji?.toString().trim() || null,
      order_index: order_index ? parseInt(order_index.toString()) : null,
      is_active,
      faq_en: parseFaq(faq_en_raw),
      faq_de: parseFaq(faq_de_raw),
    };

    const { error } = await supabaseAdmin
      .from('countries')
      .insert([insertData]);

    if (error) {
      console.error('Error creating country:', error);
      return errorResponse(error.message || 'Failed to create country', 500);
    }

    return new Response(null, {
      status: 302,
      headers: { Location: '/admin/countries' },
    });
  } catch (error: any) {
    console.error('Error in create-country endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};
