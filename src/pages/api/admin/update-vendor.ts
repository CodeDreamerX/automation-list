import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

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
    
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Handle FormData
      const form = await request.formData();
      
      id = form.get('id')?.toString() || '';
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Vendor ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Extract category slugs from form data
      categorySlugs = form.getAll("category_slugs")
        .map((slug) => String(slug).trim())
        .filter((slug) => slug.length > 0);
      
      // Extract technology slugs from form data
      technologySlugs = form.getAll("technology_slugs")
        .map((slug) => String(slug).trim())
        .filter((slug) => slug.length > 0);
      
      // Build updateData from form fields
      updateData = {
        name: form.get('name')?.toString() || null,
        slug: form.get('slug')?.toString() || null,
        description: form.get('description')?.toString() || null,
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
        industries: form.get('industries')?.toString() || null,
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
      };
    } else {
      // Handle JSON (backward compatibility)
      const body = await request.json();
      id = body.id;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Vendor ID is required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      const { id: _, category_slugs, technology_slugs, ...rest } = body; // Extract category_slugs and technology_slugs separately, use rest for vendor data
      updateData = rest;
      
      // Normalize logo fields for JSON requests
      updateData.logo_url = updateData.logo_url || null;
      updateData.logo_width = updateData.logo_width ? Number(updateData.logo_width) : null;
      updateData.logo_height = updateData.logo_height ? Number(updateData.logo_height) : null;
      updateData.logo_format = updateData.logo_format || null;
      updateData.logo_alt = updateData.logo_alt || null;
      
      // Extract category slugs from JSON if present
      if (body.category_slugs && Array.isArray(body.category_slugs)) {
        categorySlugs = body.category_slugs
          .map((slug: any) => String(slug).trim())
          .filter((slug: string) => slug.length > 0);
      } else if (body.category_slugs) {
        categorySlugs = [String(body.category_slugs).trim()].filter((slug: string) => slug.length > 0);
      }
      
      // Extract technology slugs from JSON if present
      if (body.technology_slugs && Array.isArray(body.technology_slugs)) {
        technologySlugs = body.technology_slugs
          .map((slug: any) => String(slug).trim())
          .filter((slug: string) => slug.length > 0);
      } else if (body.technology_slugs) {
        technologySlugs = [String(body.technology_slugs).trim()].filter((slug: string) => slug.length > 0);
      }
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
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to update vendor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update vendor_categories: delete all existing entries and reinsert new ones
    // Delete all existing vendor_categories rows for this vendor
    await supabaseAdmin
      .from('vendor_categories')
      .delete()
      .eq('vendor_id', id);

    // Insert new vendor_categories entries if category slugs were provided
    if (categorySlugs.length > 0) {
      for (const slug of categorySlugs) {
        const { data: cat } = await supabaseAdmin
          .from("categories")
          .select("id")
          .eq("slug", slug)
          .single();

        if (cat?.id) {
          await supabaseAdmin
            .from("vendor_categories")
            .insert({
              vendor_id: id,
              category_id: cat.id
            });
        }
      }
    }

    // Update vendor_technologies: delete all existing entries and reinsert new ones
    // Delete all existing vendor_technologies rows for this vendor
    await supabaseAdmin
      .from('vendor_technologies')
      .delete()
      .eq('vendor_id', id);

    // Insert new vendor_technologies entries if technology slugs were provided
    if (technologySlugs && technologySlugs.length > 0) {
      for (const slug of technologySlugs) {
        const { data: tech } = await supabaseAdmin
          .from("technologies")
          .select("id")
          .eq("slug", slug)
          .single();

        if (tech?.id) {
          await supabaseAdmin
            .from("vendor_technologies")
            .insert({
              vendor_id: id,
              technology_id: tech.id
            });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in update-vendor endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

