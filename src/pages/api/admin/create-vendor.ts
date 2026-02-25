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
    let insertData: any;
    let categorySlugs: string[] = [];
    let technologySlugs: string[] = [];
    let industrySlugs: string[] = [];

    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Handle FormData
      const form = await request.formData();

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
      
      // NOTE: Field list must stay in sync with /src/pages/admin/new.astro
      // Build insertData from form fields
      insertData = {
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
        languages: form.get('languages')?.toString() || null,
        certifications: form.get('certifications')?.toString() || null,
        tags: form.get('tags')?.toString() || null,
        year_founded: form.get('year_founded')?.toString() ? Number(form.get('year_founded')!.toString()) : null,
        employee_count: form.get('employee_count')?.toString() || null,
        hourly_rate: form.get('hourly_rate')?.toString() || null,
        plan: form.get('plan')?.toString() || 'free',
        priority: form.get('priority')?.toString() ? Number(form.get('priority')!.toString()) || 5 : 5,
        featured: form.get('featured') === 'on' || form.get('featured') === 'true' || form.get('featured') === '1',
        og_member: form.get('og_member') === 'on' || form.get('og_member') === 'true' || form.get('og_member') === '1',
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
      const { category_slugs, technology_slugs, industry_slugs, ...rest } = body;
      insertData = { ...rest };

      // Normalize types for JSON requests
      if (insertData.year_founded !== null && insertData.year_founded !== undefined) {
        insertData.year_founded = Number(insertData.year_founded) || null;
      }
      // employee_count and hourly_rate are text fields, pass through as-is
      if (insertData.priority !== null && insertData.priority !== undefined) {
        insertData.priority = Number(insertData.priority) || 5;
      }
      if (insertData.featured !== null && insertData.featured !== undefined) {
        insertData.featured = !!insertData.featured;
      }
      if (insertData.og_member !== null && insertData.og_member !== undefined) {
        insertData.og_member = !!insertData.og_member;
      }
      if (!insertData.plan) {
        insertData.plan = 'free';
      }
      // Normalize logo fields for JSON requests
      insertData.logo_url = insertData.logo_url || null;
      insertData.logo_width = insertData.logo_width ? Number(insertData.logo_width) : null;
      insertData.logo_height = insertData.logo_height ? Number(insertData.logo_height) : null;
      insertData.logo_format = insertData.logo_format || null;
      insertData.logo_alt = insertData.logo_alt || null;
      if (insertData.logo_background_variant) {
        insertData.logo_background_variant = mapFormVariantToDbVariant(insertData.logo_background_variant);
      } else {
        insertData.logo_background_variant = null;
      }

      // Extract M2M slug arrays from JSON
      if (body.category_slugs) categorySlugs = [body.category_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
      if (body.technology_slugs) technologySlugs = [body.technology_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
      if (body.industry_slugs) industrySlugs = [body.industry_slugs].flat().map((s: any) => String(s).trim()).filter(Boolean);
    }

    // Normalize website URL: add https:// if missing
    if (insertData.website && typeof insertData.website === 'string') {
      const website = insertData.website.trim();
      if (website && !website.match(/^https?:\/\//i)) {
        insertData.website = 'https://' + website;
      }
    }

    // Add timestamps
    insertData.created_at = new Date().toISOString();
    insertData.updated_at = new Date().toISOString();

    // Create vendor using admin client and retrieve new vendor ID
    const { data: vendor, error } = await supabaseAdmin
      .from('vendors')
      .insert([insertData])
      .select('id')
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      return errorResponse(error.message || 'Failed to create vendor', 500);
    }

    // Insert vendor_categories entries if category slugs were provided
    if (categorySlugs.length > 0 && vendor?.id) {
      for (const slug of categorySlugs) {
        const { data: cat } = await supabaseAdmin
          .from("categories")
          .select("id")
          .eq("slug", slug)
          .single();

        if (cat?.id) {
          await supabaseAdmin
            .from("vendor_categories")
            .insert({ vendor_id: vendor.id, category_id: cat.id });
        }
      }
    }

    // Insert vendor_technologies entries
    if (technologySlugs.length > 0 && vendor?.id) {
      for (const slug of technologySlugs) {
        const { data: tech } = await supabaseAdmin
          .from("technologies")
          .select("id")
          .eq("slug", slug)
          .single();

        if (tech?.id) {
          await supabaseAdmin
            .from("vendor_technologies")
            .insert({ vendor_id: vendor.id, technology_id: tech.id });
        }
      }
    }

    // Insert vendor_industries entries
    if (industrySlugs.length > 0 && vendor?.id) {
      for (const slug of industrySlugs) {
        const { data: ind } = await supabaseAdmin
          .from("industries")
          .select("id")
          .eq("slug", slug)
          .single();

        if (ind?.id) {
          await supabaseAdmin
            .from("vendor_industries")
            .insert({ vendor_id: vendor.id, industry_id: ind.id });
        }
      }
    }

    return successResponse(vendor);
  } catch (error: any) {
    console.error('Error in create-vendor endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};



