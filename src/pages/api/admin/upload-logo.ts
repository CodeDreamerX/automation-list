import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabaseAdminClient';
import sharp from 'sharp';

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
    // Parse multipart/form-data
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const vendorSlug = formData.get('vendorSlug')?.toString();
    const vendorName = formData.get('vendorName')?.toString();

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
      filePath = `optimized/${vendorSlug}-logo.svg`;
      
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
      filePath = `optimized/${vendorSlug}-logo.webp`;
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

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('vendor-logos')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Generate suggested alt text
    const altText = `${vendorName} industrial automation logo`;

    return new Response(
      JSON.stringify({
        publicUrl,
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

