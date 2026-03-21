import type { APIRoute } from 'astro';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  const template = [
    {
      // --- Required ---
      name: "",
      slug: "",
      country: "",
      category_slugs: [],

      // --- Location ---
      region: null,
      city: null,
      address: null,

      // --- Contact ---
      website: null,
      email: null,
      phone: null,
      linkedin_url: null,

      // --- Description ---
      description_en: null,
      description_de: null,

      // --- M2M relations (use slug-reference.json for slug lists; languages[] uses exact labels from that file) ---
      technology_slugs: [],
      industry_slugs: [],
      certification_slugs: [],
      country_slugs: [],

      // --- Arrays: languages = exact strings from slug-reference.json "languages" ---
      languages: [],

      // --- Metrics ---
      year_founded: null,
      employee_count: null,
      hourly_rate: null,

      // --- Plan & visibility ---
      plan: "free",
      priority: 0,
      featured: false,
      featured_until: null,
      og_member: false,
      taking_new_projects: null,
    }
  ];

  return new Response(JSON.stringify(template, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="import-template.json"',
    },
  });
};
