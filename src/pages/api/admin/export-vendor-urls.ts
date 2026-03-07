import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const { data: vendors, error } = await supabaseAdmin
      .from('vendors')
      .select('name, website')
      .order('name');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const payload = {
      vendors: (vendors || []).map((vendor: any) => ({
        name: vendor.name,
        url: vendor.website || null,
      })),
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="vendor-name-url-reference.json"',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
    });
  }
};
