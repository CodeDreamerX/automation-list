import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get("adminSession")?.value;
  
  if (!token || token !== '1') {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check if request is FormData or JSON
    const contentType = request.headers.get('content-type') || '';
    let updateData: any;
    let id: string;
    let categoryIds: string[] = [];
    let primaryCategoryId: string | null = null;
    
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
      
      // Extract category IDs from form data
      categoryIds = form.getAll("category_ids[]")
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0);
      
      // Extract primary category from form data
      const primaryCategory = form.get("primary_category")?.toString().trim();
      if (primaryCategory && primaryCategory.length > 0) {
        primaryCategoryId = primaryCategory;
      }
      
      // Build updateData from form fields (exclude category_ids as it's not a vendor column)
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
        technologies: form.get('technologies')?.toString() || null,
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
      
      const { id: _, categories, category_ids, category, ...rest } = body; // Exclude legacy categories[], category_ids, and category
      updateData = rest;
      
      // Extract category IDs from JSON if present
      if (category_ids && Array.isArray(category_ids)) {
        categoryIds = category_ids
          .map((id: any) => String(id).trim())
          .filter((id: string) => id.length > 0);
      } else if (category_ids) {
        categoryIds = [String(category_ids).trim()].filter((id: string) => id.length > 0);
      }
      
      // Extract primary category from JSON if present
      if (body.primary_category) {
        const primaryCategory = String(body.primary_category).trim();
        if (primaryCategory.length > 0) {
          primaryCategoryId = primaryCategory;
        }
      }
    }

    // Validate: require at least one category
    if (categoryIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one category is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
    const { error: deleteError } = await supabaseAdmin
      .from('vendor_categories')
      .delete()
      .eq('vendor_id', id);

    if (deleteError) {
      console.error('Error deleting vendor_categories:', deleteError);
      // Note: We still return success for vendor update, but log the error
      // You may want to handle this differently based on your requirements
    }

    // Insert new vendor_categories entries if category IDs were provided
    if (categoryIds.length > 0) {
      const vendorCategoryEntries = categoryIds.map((categoryId) => ({
        vendor_id: id,
        category_id: categoryId,
        is_primary: primaryCategoryId === categoryId,
      }));

      const { error: vendorCategoriesError } = await supabaseAdmin
        .from('vendor_categories')
        .insert(vendorCategoryEntries);

      if (vendorCategoriesError) {
        console.error('Error creating vendor_categories:', vendorCategoriesError);
        // Note: We still return success for vendor update, but log the error
        // You may want to handle this differently based on your requirements
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

