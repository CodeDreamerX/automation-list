import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabaseClient';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;

  // Fetch vendors with slug, updated_at for lastmod, and country for country pages (exclude deactivated)
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('slug, updated_at, country')
    .neq('plan', 'deactivated')
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

  // Fetch technologies with slug and updated_at for technology pages
  const { data: technologies, error: technologiesError } = await supabase
    .from('technologies')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('slug', { ascending: true });

  if (technologiesError) {
    console.error('Error fetching technologies for sitemap:', technologiesError);
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
    <loc>${origin}/en/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      urls.push(`  <url>
    <loc>${origin}/de/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    }
  });

  // Country pages - get distinct countries and calculate lastmod
  // Normalize country: lowercase for URL slug
  function normalizeCountry(country: string): string {
    return country.trim().toLowerCase();
  }

  // Get unique countries with their most recent update date
  const countryMap = new Map<string, Date>();
  (vendors || []).forEach((vendor: any) => {
    if (vendor.country) {
      const normalized = normalizeCountry(vendor.country);
      const updateDate = vendor.updated_at ? new Date(vendor.updated_at) : new Date();
      const existingDate = countryMap.get(normalized);
      if (!existingDate || updateDate > existingDate) {
        countryMap.set(normalized, updateDate);
      }
    }
  });

  // Sort countries and generate country page URLs
  const uniqueCountries = Array.from(countryMap.keys()).sort();
  uniqueCountries.forEach((normalizedCountry) => {
    const lastmodDate = countryMap.get(normalizedCountry);
    const lastmod = lastmodDate 
      ? lastmodDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    // URL encode the normalized country for the slug
    const countrySlug = encodeURIComponent(normalizedCountry);
    
    urls.push(`  <url>
    <loc>${origin}/en/country/${countrySlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    urls.push(`  <url>
    <loc>${origin}/de/country/${countrySlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  });

  // Technology pages - generate URLs from technologies table with lastmod
  (technologies || []).forEach((technology) => {
    if (technology.slug) {
      const lastmod = technology.updated_at 
        ? new Date(technology.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      urls.push(`  <url>
    <loc>${origin}/en/technology/${technology.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
      urls.push(`  <url>
    <loc>${origin}/de/technology/${technology.slug}</loc>
    <lastmod>${lastmod}</lastmod>
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

