import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import sharp from 'sharp';
import { protectAdminApiRoute } from '../../../lib/admin/authUtils';

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
    const backgroundVariantRaw = formData.get('backgroundVariant')?.toString();
    const backgroundVariant = backgroundVariantRaw?.trim() || 'white';
    const vendorId = formData.get('vendorId')?.toString();
    
    // Debug logging
    console.log('Received backgroundVariant from form:', backgroundVariantRaw);
    console.log('Using backgroundVariant:', backgroundVariant);
    console.log('Vendor ID (if editing):', vendorId);

    // Validate required fields
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!vendorSlug) {
      return new Response(
        JSON.stringify({ error: 'vendorSlug is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize vendorSlug to prevent path traversal attacks
    // Only allow alphanumeric, hyphens, and underscores
    const sanitizedVendorSlug = vendorSlug.trim().replace(/[^a-zA-Z0-9-_]/g, '');
    if (!sanitizedVendorSlug || sanitizedVendorSlug !== vendorSlug.trim()) {
      return new Response(
        JSON.stringify({ error: 'Invalid vendorSlug format. Only alphanumeric characters, hyphens, and underscores are allowed.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!vendorName) {
      return new Response(
        JSON.stringify({ error: 'vendorName is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 2MB limit' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PNG, JPG/JPEG, SVG, and WEBP are allowed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Reject GIFs
    if (fileType === 'image/gif' || fileName.endsWith('.gif')) {
      return new Response(
        JSON.stringify({ error: 'GIF files are not allowed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate background variant and default to 'white' if not provided
    // Ensure variant is lowercase for consistency
    const normalizedVariant = backgroundVariant?.toLowerCase().trim();
    const validVariants = ['white', 'light', 'gray', 'dark', 'brand'];
    const variant = normalizedVariant && validVariants.includes(normalizedVariant) ? normalizedVariant : 'white';
    
    // Log for debugging
    console.log('Variant validation - input:', backgroundVariant, 'normalized:', normalizedVariant, 'final:', variant);

    // Step 7: Encode variant into filename
    // Strip extension, remove any existing variant suffix, then append new __<variant>
    const originalFileName = file.name;
    const lastDotIndex = originalFileName.lastIndexOf('.');
    let baseName = lastDotIndex > 0 ? originalFileName.substring(0, lastDotIndex) : originalFileName;
    const extension = lastDotIndex > 0 ? originalFileName.substring(lastDotIndex) : '';
    
    // Remove any existing variant suffix (__white, __light, __gray, __dark, __brand) from the filename
    // This ensures we don't get double variants if the file already has one
    baseName = baseName.replace(/__(white|light|gray|dark|brand)$/i, '');
    
    // Sanitize base name to prevent path traversal and ensure safe filename
    const sanitizedBaseName = baseName
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
    
    // Construct filename with variant: baseName__variant.extension
    const variantFileName = `${sanitizedBaseName}__${variant}${extension}`;

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
      
      // For raster images, replace extension with .webp but keep variant in filename
      const variantBaseName = `${sanitizedBaseName}__${variant}`;
      filePath = `optimized/${variantBaseName}.webp`;
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

          // Try to extract from relative path format: /logos/vendors/filename__variant.ext
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
      return new Response(
        JSON.stringify({ error: `Failed to upload file: ${uploadError.message}` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL for preview/display purposes and storage
    // This is the full Supabase Storage URL that can be used directly in <img> tags
    const { data: urlData } = supabaseAdmin.storage
      .from('vendor-logos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Generate suggested alt text
    const altText = `${vendorName} industrial automation logo`;

    return new Response(
      JSON.stringify({
        publicUrl: publicUrl, // Return full Supabase Storage URL for display and storage
        width,
        height,
        format,
        altText
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in upload-logo endpoint:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

