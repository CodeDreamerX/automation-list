import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabaseClient';
import { normalizeTech } from '../lib/normalizeTech';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const origin = url.origin;

  // Fetch vendors with slug, updated_at for lastmod, country for country pages, and technologies for technology pages
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('slug, updated_at, country, technologies')
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

  // Technology pages - get distinct technologies from vendors with lastmod calculation
  // Get unique technologies with their most recent update date
  const technologyMap = new Map<string, Date>();
  (vendors || []).forEach((vendor: any) => {
    if (vendor.technologies && typeof vendor.technologies === 'string') {
      // Split comma-separated technologies
      const techs = vendor.technologies
        .split(',')
        .map((tech: string) => tech.trim())
        .filter((tech: string) => tech.length > 0);
      
      const updateDate = vendor.updated_at ? new Date(vendor.updated_at) : new Date();
      
      // Normalize and add each technology to the map with update date
      techs.forEach((tech: string) => {
        const normalized = normalizeTech(tech);
        if (normalized) {
          const existingDate = technologyMap.get(normalized);
          if (!existingDate || updateDate > existingDate) {
            technologyMap.set(normalized, updateDate);
          }
        }
      });
    }
  });

  // Sort technologies and generate technology page URLs with lastmod, changefreq, and priority
  const uniqueTechnologies = Array.from(technologyMap.keys()).sort();
  uniqueTechnologies.forEach((techSlug) => {
    const lastmodDate = technologyMap.get(techSlug);
    const lastmod = lastmodDate 
      ? lastmodDate.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    urls.push(`  <url>
    <loc>${origin}/en/technology/${techSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
    urls.push(`  <url>
    <loc>${origin}/de/technology/${techSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
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

