import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return errorResponse('Vendor ID is required', 400);
    }

    // Fetch vendor to get slug and logo information
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id, slug, logo_url, logo_format')
      .eq('id', id)
      .single();

    if (vendorError || !vendor) {
      console.error('Error fetching vendor:', vendorError);
      return errorResponse(vendorError?.message || 'Vendor not found', 404);
    }

    // If vendor has no logo, return success (nothing to delete)
    if (!vendor.logo_url) {
      return successResponse({ message: 'Vendor has no logo to delete' });
    }

    // Determine file path(s) from logo_url or construct from slug
    const filePathsToDelete: string[] = [];

    // Extract the filename from logo_url and construct the storage path: optimized/{filename}.{ext}
    if (vendor.logo_url) {
      // Handle both relative paths (/logos/vendors/...) and full Supabase Storage URLs
      let fileName = '';
      
      // Try to extract from relative path format: /logos/vendors/filename.ext
      const relativePathMatch = vendor.logo_url.match(/\/logos\/vendors\/(.+)$/);
      if (relativePathMatch) {
        fileName = relativePathMatch[1];
        filePathsToDelete.push(`optimized/${fileName}`);
      } else {
        // Try to extract from Supabase Storage URL format: .../vendor-logos/optimized/...
        const storageUrlMatch = vendor.logo_url.match(/vendor-logos\/optimized\/(.+)$/);
        if (storageUrlMatch) {
          fileName = storageUrlMatch[1];
          filePathsToDelete.push(`optimized/${fileName}`);
        } else {
          // Try direct match for optimized/ path
          const optimizedMatch = vendor.logo_url.match(/optimized\/(.+)$/);
          if (optimizedMatch) {
            fileName = optimizedMatch[1];
            filePathsToDelete.push(`optimized/${fileName}`);
          }
        }
      }
      
      // If we couldn't extract from logo_url, we can't safely determine the file path
      // We'll skip storage deletion but still clear the database fields
    }

    // Delete file(s) from Supabase Storage if we have paths
    let storageDeleteSuccess = false;
    if (filePathsToDelete.length > 0) {
      console.log(`Attempting to delete logo file(s) from storage: ${filePathsToDelete.join(', ')}`);
      const { error: deleteError, data: deleteData } = await supabaseAdmin.storage
        .from('vendor-logos')
        .remove(filePathsToDelete);

      if (deleteError) {
        // Log error but continue - file might not exist or already deleted
        console.warn('Error deleting logo file(s) from storage:', deleteError);
        console.warn('Logo URL was:', vendor.logo_url);
        // Don't fail the request if file deletion fails - still clear DB fields
      } else {
        storageDeleteSuccess = true;
        console.log('Successfully deleted logo file(s) from storage:', deleteData);
      }
    } else {
      console.warn('Could not determine file path to delete from logo_url:', vendor.logo_url);
      console.warn('Storage file deletion skipped, but database fields will still be cleared');
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
      return errorResponse(updateError.message || 'Failed to clear logo fields', 500);
    }

    return successResponse({ message: 'Logo deleted successfully' });
  } catch (error: any) {
    console.error('Error in delete-logo endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};

