import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { VENDOR_LANGUAGE_OPTIONS } from '../../../lib/admin/languageOptions';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const [
      { data: categories, error: catErr },
      { data: technologies, error: techErr },
      { data: industries, error: indErr },
      { data: certifications, error: certErr },
      { data: countries, error: countryErr },
    ] = await Promise.all([
      supabaseAdmin.from('categories').select('slug, name_en').order('name_en'),
      supabaseAdmin.from('technologies').select('slug, name_en').order('name_en'),
      supabaseAdmin.from('industries').select('slug, name_en').order('name_en'),
      supabaseAdmin.from('certifications').select('slug, name').order('name'),
      supabaseAdmin.from('countries').select('slug, name_en').eq('is_active', true).order('name_en'),
    ]);

    if (catErr || techErr || indErr || certErr || countryErr) {
      const msg =
        catErr?.message ||
        techErr?.message ||
        indErr?.message ||
        certErr?.message ||
        countryErr?.message;
      return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }

    const payload = {
      categories: (categories || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      technologies: (technologies || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      industries: (industries || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      certifications: (certifications || []).map((r: any) => ({ slug: r.slug, name: r.name })),
      countries: (countries || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      languages: [...VENDOR_LANGUAGE_OPTIONS],
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="slug-reference.json"',
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
    });
  }
};
