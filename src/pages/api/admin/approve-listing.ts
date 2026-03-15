import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid request body', 400);
  }

  const {
    id, // pending_listings.id to delete after approval
    slug,
    name, website, country, email,
    category_slugs, description_en, description_de,
    city, region, phone, linkedin_url,
    technology_slugs, industry_slugs, certification_slugs,
    languages, countries_served,
    year_founded, employee_count, taking_new_projects,
  } = body;

  if (!id) return errorResponse('Listing ID is required', 400);
  if (!slug?.trim()) return errorResponse('A URL slug is required for the vendor listing', 400);
  if (!name?.trim()) return errorResponse('Company name is required', 400);
  if (!country?.trim()) return errorResponse('Country is required', 400);

  // Convert text[] → comma-separated text (vendors table stores languages as TEXT)
  const languagesStr = Array.isArray(languages) && languages.length > 0
    ? languages.join(', ')
    : null;
  const countriesServedStr = typeof countries_served === 'string' ? countries_served.trim() || null : null;

  const now = new Date().toISOString();

  const vendorData = {
    slug: slug.trim(),
    name: name.trim(),
    website: website?.trim() || null,
    country: country.trim(),
    email: email?.trim() || null,
    description_en: description_en?.trim() || null,
    description_de: description_de?.trim() || null,
    city: city?.trim() || null,
    region: region?.trim() || null,
    phone: phone?.trim() || null,
    linkedin_url: linkedin_url?.trim() || null,
    languages: languagesStr,
    countries_served: countriesServedStr,
    year_founded: year_founded ? (Number(year_founded) || null) : null,
    employee_count: employee_count || null,
    taking_new_projects: taking_new_projects === true ? true : taking_new_projects === false ? false : null,
    // Admin defaults for new vendor
    plan: 'free',
    priority: 5,
    featured: false,
    og_member: false,
    created_at: now,
    updated_at: now,
  };

  // Insert into vendors
  const { data: vendor, error: vendorError } = await supabaseAdmin
    .from('vendors')
    .insert([vendorData])
    .select('id')
    .single();

  if (vendorError) {
    console.error('approve-listing vendor insert error:', vendorError);
    if (vendorError.code === '23505') {
      return errorResponse(`Slug "${slug}" is already taken. Please choose a different slug.`, 409);
    }
    return errorResponse(vendorError.message || 'Failed to create vendor', 500);
  }

  const vendorId = vendor.id;

  // Helper: lookup ID by slug and insert junction row
  async function insertM2M(
    table: string,
    slugCol: string,
    junctionTable: string,
    junctionFk: string,
    slugs: string[]
  ) {
    for (const s of slugs) {
      const { data: row } = await supabaseAdmin
        .from(table)
        .select('id')
        .eq('slug', s)
        .single();
      if (row?.id) {
        await supabaseAdmin
          .from(junctionTable)
          .insert({ vendor_id: vendorId, [junctionFk]: row.id });
      }
    }
  }

  const catSlugs  = Array.isArray(category_slugs)     ? category_slugs     : [];
  const techSlugs = Array.isArray(technology_slugs)   ? technology_slugs   : [];
  const indSlugs  = Array.isArray(industry_slugs)     ? industry_slugs     : [];
  const certSlugs = Array.isArray(certification_slugs)? certification_slugs: [];

  await insertM2M('categories',    'slug', 'vendor_categories',    'category_id',    catSlugs);
  await insertM2M('technologies',  'slug', 'vendor_technologies',  'technology_id',  techSlugs);
  await insertM2M('industries',    'slug', 'vendor_industries',    'industry_id',    indSlugs);
  await insertM2M('certifications','slug', 'vendor_certifications','certification_id',certSlugs);

  // Delete the approved pending listing
  const { error: deleteError } = await supabaseAdmin
    .from('pending_listings')
    .delete()
    .eq('id', id);

  if (deleteError) {
    console.error('approve-listing delete error:', deleteError);
    // Vendor was created successfully; log but don't fail the response
  }

  return successResponse({ vendor_id: vendorId });
};
