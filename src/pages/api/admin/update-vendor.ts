import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { mapFormVariantToDbVariant } from '../../../lib/vendors/logoBackgroundVariant';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let updateData: any;
    let id: string;
    let categorySlugs: string[] = [];
    let technologySlugs: string[] = [];
    let industrySlugs: string[] = [];
    let certificationSlugs: string[] = [];

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Handle FormData
      const form = await request.formData();

      id = form.get('id')?.toString() || '';

      if (!id) {
        return errorResponse('Vendor ID is required', 400);
      }

      // Extract M2M slug arrays from form data
      categorySlugs = form.getAll("category_slugs")
        .map((slug) => String(slug).trim())
        .filter((slug) => slug.length > 0);
      technologySlugs = form.getAll("technology_slugs")
        .map((s) => String(s).trim())
        .filter(Boolean);
      industrySlugs = form.getAll("industry_slugs")
        .map((s) => String(s).trim())
        .filter(Boolean);
      certificationSlugs = form.getAll("certification_slugs")
        .map((s) => String(s).trim())
        .filter(Boolean);
      const selectedLanguages = form.getAll("languages")
        .map((s) => String(s).trim())
        .filter(Boolean);

      // NOTE: Field list must stay in sync with /src/pages/admin/edit/[id].astro
      // Build updateData from form fields
      updateData = {
        name: form.get('name')?.toString() || null,
        slug: form.get('slug')?.toString() || null,
        description_en: form.get('description_en')?.toString() || null,
        description_de: form.get('description_de')?.toString() || null,
        website: form.get('website')?.toString() || null,
        email: form.get('email')?.toString() || null,
        phone: form.get('phone')?.toString() || null,
        address: form.get('address')?.toString() || null,
        city: form.get('city')?.toString() || null,
        region: form.get('region')?.toString() || null,
        country: form.get('country')?.toString() || null,
        languages: selectedLanguages.length > 0 ? selectedLanguages.join(', ') : null,
        tags: form.get('tags')?.toString() || null,
        year_founded: form.get('year_founded')?.toString() || null,
        employee_count: form.get('employee_count')?.toString() || null,
        hourly_rate: form.get('hourly_rate')?.toString() || null,
        plan: form.get('plan')?.toString() || 'free',
        priority: form.get('priority')?.toString() ? parseInt(form.get('priority')!.toString()) : null,
        featured: form.get('featured') === 'on',
        og_member: form.get('og_member') === 'on',
        featured_until: form.get('featured_until')?.toString() || null,
        meta_title: form.get('meta_title')?.toString() || null,
        meta_description: form.get('meta_description')?.toString() || null,
        canonical_url: form.get('canonical_url')?.toString() || null,
        logo_url: form.get('logo_url')?.toString() || null,
        logo_width: form.get('logo_width')?.toString() ? Number(form.get('logo_width')!.toString()) : null,
        logo_height: form.get('logo_height')?.toString() ? Number(form.get('logo_height')!.toString()) : null,
        logo_format: form.get('logo_format')?.toString() || null,
        logo_alt: form.get('logo_alt')?.toString() || null,
        countries_served: form.get('countries_served')?.toString() || null,
        taking_new_projects: form.get('taking_new_projects') === 'on',
        linkedin_url: form.get('linkedin_url')?.toString() || null,
        specialization_text: form.get('specialization_text')?.toString() || null,
        logo_background_variant: (() => {
          const formVariant = form.get('logo_background_variant')?.toString() || null;
          if (!formVariant) return null;
          return mapFormVariantToDbVariant(formVariant);
        })(),
      };
    } else {
      // Handle JSON (backward compatibility)
      const body = await request.json();
      id = body.id;

      if (!id) {
        return errorResponse('Vendor ID is required', 400);
      }

      const { id: _, category_slugs, technology_slugs, industry_slugs, certification_slugs, ...rest } = body;
      updateData = rest;

      // Normalize logo fields for JSON requests
      updateData.logo_url = updateData.logo_url || null;
      updateData.logo_width = updateData.logo_width ? Number(updateData.logo_width) : null;
      updateData.logo_height = updateData.logo_height ? Number(updateData.logo_height) : null;
      updateData.logo_format = updateData.logo_format || null;
      updateData.logo_alt = updateData.logo_alt || null;
      if (updateData.logo_background_variant) {
        updateData.logo_background_variant = mapFormVariantToDbVariant(updateData.logo_background_variant);
      } else {
        updateData.logo_background_variant = null;
      }

      // Extract M2M slug arrays from JSON
      if (body.category_slugs) categorySlugs = [body.category_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
      if (body.technology_slugs) technologySlugs = [body.technology_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
      if (body.industry_slugs) industrySlugs = [body.industry_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
      if (body.certification_slugs) certificationSlugs = [body.certification_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
    }

    // Normalize website URL: add https:// if missing
    if (updateData.website && typeof updateData.website === 'string') {
      const website = updateData.website.trim();
      if (website && !website.match(/^https?:\/\//i)) {
        updateData.website = 'https://' + website;
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update vendor using admin client
    const { error } = await supabaseAdmin
      .from('vendors')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating vendor:', error);
      return errorResponse(error.message || 'Failed to update vendor', 500);
    }

    // Update vendor_categories: delete all existing entries and reinsert new ones
    await supabaseAdmin.from('vendor_categories').delete().eq('vendor_id', id);
    for (const slug of categorySlugs) {
      const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("slug", slug).single();
      if (cat?.id) await supabaseAdmin.from("vendor_categories").insert({ vendor_id: id, category_id: cat.id });
    }

    // Update vendor_technologies: delete all existing entries and reinsert new ones
    await supabaseAdmin.from('vendor_technologies').delete().eq('vendor_id', id);
    for (const slug of technologySlugs) {
      const { data: tech } = await supabaseAdmin.from("technologies").select("id").eq("slug", slug).single();
      if (tech?.id) await supabaseAdmin.from("vendor_technologies").insert({ vendor_id: id, technology_id: tech.id });
    }

    // Update vendor_industries: delete all existing entries and reinsert new ones
    await supabaseAdmin.from('vendor_industries').delete().eq('vendor_id', id);
    for (const slug of industrySlugs) {
      const { data: ind } = await supabaseAdmin.from("industries").select("id").eq("slug", slug).single();
      if (ind?.id) await supabaseAdmin.from("vendor_industries").insert({ vendor_id: id, industry_id: ind.id });
    }

    // Update vendor_certifications: delete all existing entries and reinsert new ones
    await supabaseAdmin.from('vendor_certifications').delete().eq('vendor_id', id);
    for (const slug of certificationSlugs) {
      const { data: cert } = await supabaseAdmin.from("certifications").select("id").eq("slug", slug).single();
      if (cert?.id) await supabaseAdmin.from("vendor_certifications").insert({ vendor_id: id, certification_id: cert.id });
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in update-vendor endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};

