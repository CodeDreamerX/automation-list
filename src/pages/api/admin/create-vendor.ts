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
    let insertData: any;
    let categoryIds: string[] = [];
    let primaryCategoryId: string | null = null;
    
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Handle FormData
      const form = await request.formData();
      
      // Extract category IDs from form data
      categoryIds = form.getAll("category_ids[]")
        .map((id) => String(id).trim())
        .filter((id) => id.length > 0);
      
      // Extract primary category from form data
      const primaryCategory = form.get("primary_category")?.toString().trim();
      if (primaryCategory && primaryCategory.length > 0) {
        primaryCategoryId = primaryCategory;
      }
      
      // Build insertData from form fields (exclude category_ids as it's not a vendor column)
      insertData = {
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
      const { categories, category_ids, category, ...rest } = body; // Exclude legacy categories[], category_ids, and category
      insertData = { ...rest };
      
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
    if (insertData.website && typeof insertData.website === 'string') {
      const website = insertData.website.trim();
      if (website && !website.match(/^https?:\/\//i)) {
        insertData.website = 'https://' + website;
      }
    }

    // Add timestamps
    insertData.created_at = new Date().toISOString();
    insertData.updated_at = new Date().toISOString();

    // Create vendor using admin client
    const { data, error } = await supabaseAdmin
      .from('vendors')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error creating vendor:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Failed to create vendor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Insert vendor_categories entries if category IDs were provided
    if (categoryIds.length > 0 && data?.id) {
      const vendorCategoryEntries = categoryIds.map((categoryId) => ({
        vendor_id: data.id,
        category_id: categoryId,
        is_primary: primaryCategoryId === categoryId,
      }));

      const { error: vendorCategoriesError } = await supabaseAdmin
        .from('vendor_categories')
        .insert(vendorCategoryEntries);

      if (vendorCategoriesError) {
        console.error('Error creating vendor_categories:', vendorCategoriesError);
        // Note: We still return success for vendor creation, but log the error
        // You may want to handle this differently based on your requirements
      }
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in create-vendor endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};



