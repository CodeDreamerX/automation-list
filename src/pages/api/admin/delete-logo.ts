import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: 'Vendor ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch vendor to get slug and logo information
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id, slug, logo_url, logo_format')
      .eq('id', id)
      .single();

    if (vendorError || !vendor) {
      console.error('Error fetching vendor:', vendorError);
      return new Response(
        JSON.stringify({ error: vendorError?.message || 'Vendor not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If vendor has no logo, return success (nothing to delete)
    if (!vendor.logo_url) {
      return new Response(
        JSON.stringify({ success: true, message: 'Vendor has no logo to delete' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine file path(s) from logo_url or construct from slug
    const filePathsToDelete: string[] = [];

    // Try to extract path from logo_url (Supabase Storage URLs contain the path)
    // URL format: https://{project}.supabase.co/storage/v1/object/public/vendor-logos/optimized/{slug}-logo.{ext}
    const urlMatch = vendor.logo_url.match(/vendor-logos\/(.+)$/);
    if (urlMatch) {
      filePathsToDelete.push(urlMatch[1]);
    } else if (vendor.slug) {
      // Fallback: try both possible file formats (SVG and WEBP)
      // Since uploads use upsert, there should only be one, but we'll try both to be safe
      filePathsToDelete.push(`optimized/${vendor.slug}-logo.svg`);
      filePathsToDelete.push(`optimized/${vendor.slug}-logo.webp`);
    }

    // Delete file(s) from Supabase Storage if we have paths
    if (filePathsToDelete.length > 0) {
      const { error: deleteError } = await supabaseAdmin.storage
        .from('vendor-logos')
        .remove(filePathsToDelete);

      if (deleteError) {
        // Log error but continue - file might not exist or already deleted
        console.warn('Error deleting logo file(s) from storage:', deleteError);
        // Don't fail the request if file deletion fails - still clear DB fields
      }
    }

    // Update vendor record to clear all logo fields
    const { error: updateError } = await supabaseAdmin
      .from('vendors')
      .update({
        logo_url: null,
        logo_width: null,
        logo_height: null,
        logo_format: null,
        logo_alt: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating vendor:', updateError);
      return new Response(
        JSON.stringify({ error: updateError.message || 'Failed to clear logo fields' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Logo deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in delete-logo endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

