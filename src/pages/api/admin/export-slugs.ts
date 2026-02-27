import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

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
    ] = await Promise.all([
      supabaseAdmin.from('categories').select('slug, name_en').order('name_en'),
      supabaseAdmin.from('technologies').select('slug, name_en').order('name_en'),
      supabaseAdmin.from('industries').select('slug, name_en').order('name_en'),
      supabaseAdmin.from('certifications').select('slug, name').order('name'),
    ]);

    if (catErr || techErr || indErr || certErr) {
      const msg = catErr?.message || techErr?.message || indErr?.message || certErr?.message;
      return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }

    const payload = {
      categories: (categories || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      technologies: (technologies || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      industries: (industries || []).map((r: any) => ({ slug: r.slug, name: r.name_en })),
      certifications: (certifications || []).map((r: any) => ({ slug: r.slug, name: r.name })),
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
