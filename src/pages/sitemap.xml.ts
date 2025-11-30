import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabaseClient';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;

  // Fetch vendors with slug, updated_at for lastmod, and country for country pages
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('slug, updated_at, country')
    .order('slug', { ascending: true });

  if (vendorsError) {
    console.error('Error fetching vendors for sitemap:', vendorsError);
  }

  // Fetch categories with slug
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true)
    .order('slug', { ascending: true });

  if (categoriesError) {
    console.error('Error fetching categories for sitemap:', categoriesError);
  }

  // Build sitemap XML
  const urls: string[] = [];

  // Homepage (EN and DE)
  urls.push(`  <url>
    <loc>${origin}/en/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);
  urls.push(`  <url>
    <loc>${origin}/de/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

  // Vendor listing pages (EN and DE)
  urls.push(`  <url>
    <loc>${origin}/en/vendors</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);
  urls.push(`  <url>
    <loc>${origin}/de/vendors</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);

  // Vendor detail pages (EN and DE) with lastmod
  (vendors || []).forEach((vendor) => {
    if (vendor.slug) {
      const lastmod = vendor.updated_at 
        ? new Date(vendor.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      urls.push(`  <url>
    <loc>${origin}/en/vendor/${vendor.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
      urls.push(`  <url>
    <loc>${origin}/de/vendor/${vendor.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
    }
  });

  // Category pages (EN and DE)
  (categories || []).forEach((category) => {
    if (category.slug) {
      urls.push(`  <url>
    <loc>${origin}/en/vendors?category=${encodeURIComponent(category.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      urls.push(`  <url>
    <loc>${origin}/de/vendors?category=${encodeURIComponent(category.slug)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  });

  // Country pages - get unique countries from vendors
  const uniqueCountries = Array.from(
    new Set((vendors || []).map((v: any) => v.country).filter(Boolean))
  ).sort();

  uniqueCountries.forEach((country) => {
    if (country) {
      urls.push(`  <url>
    <loc>${origin}/en/vendors?country=${encodeURIComponent(country)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      urls.push(`  <url>
    <loc>${origin}/de/vendors?country=${encodeURIComponent(country)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

