import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import sharp from 'sharp';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';
import { mapFormVariantToDbVariant } from '../../../lib/vendors/logoBackgroundVariant';
import { successResponse, errorResponse } from '../../../lib/api/responses';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  // Protect admin API route: load session, get user, check user_roles
  const authResponse = await protectAdminApiRoute(cookies);
  if (authResponse) return authResponse;

  try {
    // Parse multipart/form-data
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const vendorSlug = formData.get('vendorSlug')?.toString();
    const vendorName = formData.get('vendorName')?.toString();
    const vendorId = formData.get('vendorId')?.toString();
    const backgroundVariant = formData.get('backgroundVariant')?.toString() || 'white';
    
    // Map background variant to database values: light, neutral, dark, brand
    const dbVariant = mapFormVariantToDbVariant(backgroundVariant);

    // Validate required fields
    if (!file) {
      return errorResponse('File is required', 400);
    }

    if (!vendorSlug) {
      return errorResponse('vendorSlug is required', 400);
    }

    // Sanitize vendorSlug to prevent path traversal attacks
    // Only allow alphanumeric, hyphens, and underscores
    const sanitizedVendorSlug = vendorSlug.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    if (!sanitizedVendorSlug || sanitizedVendorSlug !== vendorSlug.trim()) {
      return errorResponse('Invalid vendorSlug format. Only alphanumeric characters, hyphens, and underscores are allowed.', 400);
    }

    if (!vendorName) {
      return errorResponse('vendorName is required', 400);
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return errorResponse('File size exceeds 2MB limit', 400);
    }

    // Get file type
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // Determine if SVG
    const isSvg = fileType === 'image/svg+xml' || fileName.endsWith('.svg');
    
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const hasValidType = allowedTypes.includes(fileType);
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidType && !hasValidExtension) {
      return errorResponse('Invalid file type. Only PNG, JPG/JPEG, SVG, and WEBP are allowed', 400);
    }

    // Reject GIFs
    if (fileType === 'image/gif' || fileName.endsWith('.gif')) {
      return errorResponse('GIF files are not allowed', 400);
    }

    // Step 7: Generate safe filename with variant encoding
    const originalFileName = file.name;
    const lastDotIndex = originalFileName.lastIndexOf('.');
    let baseName = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
    const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
    
    // Sanitize base name to prevent path traversal and ensure safe filename
    const sanitizedBaseName = baseName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Validate and sanitize background variant
    const validVariants = ['white', 'light', 'gray', 'dark', 'brand'];
    const sanitizedVariant = validVariants.includes(backgroundVariant.toLowerCase()) 
      ? backgroundVariant.toLowerCase() 
      : 'white';
    
    // Construct filename with variant encoding: baseName__variant.ext
    const variantFileName = `${sanitizedBaseName}__${sanitizedVariant}${extension}`;

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let processedBuffer: Buffer;
    let width: number;
    let height: number;
    let format: string;
    let filePath: string;
    
    if (isSvg) {
      // SVG: upload as-is, no processing
      processedBuffer = buffer;
      format = 'svg';
      filePath = `optimized/${variantFileName}`;
      
      // For SVG, we can't easily get dimensions without parsing
      // Set default dimensions or try to extract from SVG if needed
      width = 0;
      height = 0;
      
      // Try to extract dimensions from SVG if possible
      const svgContent = buffer.toString('utf-8');
      const widthMatch = svgContent.match(/width=["'](\d+)/i);
      const heightMatch = svgContent.match(/height=["'](\d+)/i);
      const viewBoxMatch = svgContent.match(/viewBox=["']0\s+0\s+(\d+)\s+(\d+)/i);
      
      if (widthMatch) {
        width = parseInt(widthMatch[1], 10);
      }
      if (heightMatch) {
        height = parseInt(heightMatch[1], 10);
      }
      if (viewBoxMatch && (!width || !height)) {
        width = width || parseInt(viewBoxMatch[1], 10);
        height = height || parseInt(viewBoxMatch[2], 10);
      }
    } else {
      // Raster images: process with Sharp
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      // Resize to max width 300px (retain aspect ratio)
      const resized = image.resize(300, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
      
      // Convert to WEBP, strip metadata, set quality ~80%
      processedBuffer = await resized
        .webp({ quality: 80 })
        .toBuffer();
      
      // Get dimensions after resize
      const resizedMetadata = await sharp(processedBuffer).metadata();
      width = resizedMetadata.width || 0;
      height = resizedMetadata.height || 0;
      format = 'webp';
      
      // For raster images, replace extension with .webp and include variant
      filePath = `optimized/${sanitizedBaseName}__${sanitizedVariant}.webp`;
    }

    // If editing an existing vendor, delete the old logo file first
    if (vendorId) {
      try {
        const { data: existingVendor, error: vendorError } = await supabaseAdmin
          .from('vendors')
          .select('id, logo_url')
          .eq('id', vendorId)
          .single();

        if (!vendorError && existingVendor && existingVendor.logo_url) {
          // Extract file path from old logo URL
          const oldLogoUrl = existingVendor.logo_url;
          const filePathsToDelete: string[] = [];

          // Try to extract from relative path format: /logos/vendors/filename.ext
          const relativePathMatch = oldLogoUrl.match(/\/logos\/vendors\/(.+)$/);
          if (relativePathMatch) {
            filePathsToDelete.push(`optimized/${relativePathMatch[1]}`);
          } else {
            // Try to extract from Supabase Storage URL format: .../vendor-logos/optimized/...
            const storageUrlMatch = oldLogoUrl.match(/vendor-logos\/optimized\/(.+)$/);
            if (storageUrlMatch) {
              filePathsToDelete.push(`optimized/${storageUrlMatch[1]}`);
            } else {
              // Try direct match for optimized/ path
              const optimizedMatch = oldLogoUrl.match(/optimized\/(.+)$/);
              if (optimizedMatch) {
                filePathsToDelete.push(`optimized/${optimizedMatch[1]}`);
              }
            }
          }

          // Delete old logo file(s) if we found paths
          if (filePathsToDelete.length > 0) {
            console.log(`Deleting old logo file(s) before upload: ${filePathsToDelete.join(', ')}`);
            const { error: deleteError } = await supabaseAdmin.storage
              .from('vendor-logos')
              .remove(filePathsToDelete);

            if (deleteError) {
              // Log warning but continue - old file might not exist
              console.warn('Warning: Could not delete old logo file:', deleteError);
            } else {
              console.log('Successfully deleted old logo file(s)');
            }
          }
        }
      } catch (deleteOldLogoError) {
        // Log error but continue with upload
        console.warn('Error attempting to delete old logo:', deleteOldLogoError);
      }
    }

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('vendor-logos')
      .upload(filePath, processedBuffer, {
        contentType: isSvg ? 'image/svg+xml' : 'image/webp',
        upsert: true // Overwrite if exists
      });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return errorResponse(`Failed to upload file: ${uploadError.message}`, 500);
    }

    // Get public URL for preview/display purposes and storage
    // This is the full Supabase Storage URL that can be used directly in <img> tags
    const { data: urlData } = supabaseAdmin.storage
      .from('vendor-logos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Generate suggested alt text
    const altText = `${vendorName} industrial automation logo`;

    // Save logo_background_variant to database if vendorId is provided
    if (vendorId) {
      const { error: updateError } = await supabaseAdmin
        .from('vendors')
        .update({ logo_background_variant: dbVariant })
        .eq('id', vendorId);

      if (updateError) {
        console.error('Error updating logo_background_variant:', updateError);
        // Log error but don't fail the upload - variant update is non-critical
      }
    }

    return successResponse({
      publicUrl: publicUrl, // Return full Supabase Storage URL for display and storage
      width,
      height,
      format,
      altText
    });
  } catch (error: any) {
    console.error('Error in upload-logo endpoint:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
};

