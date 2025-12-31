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

    // First, fetch vendor to get logo information before deletion
    const { data: vendor, error: vendorError } = await supabaseAdmin
      .from('vendors')
      .select('id, logo_url')
      .eq('id', id)
      .single();

    if (vendorError && vendorError.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay, we'll proceed
      console.error('Error fetching vendor:', vendorError);
    }

    // Delete logo from storage if vendor has a logo
    if (vendor?.logo_url) {
      const filePathsToDelete: string[] = [];
      
      // Extract the filename from logo_url and construct the storage path
      // Handle both relative paths (/logos/vendors/...) and full Supabase Storage URLs
      const relativePathMatch = vendor.logo_url.match(/\/logos\/vendors\/(.+)$/);
      if (relativePathMatch) {
        filePathsToDelete.push(`optimized/${relativePathMatch[1]}`);
      } else {
        const storageUrlMatch = vendor.logo_url.match(/vendor-logos\/optimized\/(.+)$/);
        if (storageUrlMatch) {
          filePathsToDelete.push(`optimized/${storageUrlMatch[1]}`);
        } else {
          const optimizedMatch = vendor.logo_url.match(/optimized\/(.+)$/);
          if (optimizedMatch) {
            filePathsToDelete.push(`optimized/${optimizedMatch[1]}`);
          }
        }
      }

      // Delete file(s) from Supabase Storage if we have paths
      if (filePathsToDelete.length > 0) {
        console.log(`Attempting to delete logo file(s) from storage: ${filePathsToDelete.join(', ')}`);
        const { error: deleteError } = await supabaseAdmin.storage
          .from('vendor-logos')
          .remove(filePathsToDelete);

        if (deleteError) {
          // Log error but continue - file might not exist or already deleted
          console.warn('Error deleting logo file(s) from storage:', deleteError);
          console.warn('Logo URL was:', vendor.logo_url);
        } else {
          console.log('Successfully deleted logo file(s) from storage');
        }
      } else {
        console.warn('Could not determine file path to delete from logo_url:', vendor.logo_url);
      }
    }

    // Delete vendor using admin client
    const { error } = await supabaseAdmin
      .from('vendors')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting vendor:', error);
      return errorResponse(error.message || 'Failed to delete vendor', 500);
    }

    return successResponse();
  } catch (error: any) {
    console.error('Error in delete-vendor endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};

