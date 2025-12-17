import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabaseClient';

// Production domain - sitemap URLs must be canonical and absolute
// SEO: Use production domain to ensure consistency across environments
const PRODUCTION_DOMAIN = 'https://automation-list.com';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority: string;
}

export const GET: APIRoute = async () => {
  // Fetch vendors with slug, updated_at for lastmod, and country for country pages
  // SEO: Only include public, active vendors (exclude deactivated)
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('slug, updated_at, country')
    .neq('plan', 'deactivated')
    .order('slug', { ascending: true });

  if (vendorsError) {
    console.error('Error fetching vendors for sitemap:', vendorsError);
  }

  // Fetch categories with slug
  // SEO: Only include active categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('slug')
    .eq('is_active', true)
    .order('slug', { ascending: true });

  if (categoriesError) {
    console.error('Error fetching categories for sitemap:', categoriesError);
  }

  // Fetch technologies with slug and updated_at for technology pages
  // SEO: Only include active technologies
  const { data: technologies, error: technologiesError } = await supabase
    .from('technologies')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('slug', { ascending: true });

  if (technologiesError) {
    console.error('Error fetching technologies for sitemap:', technologiesError);
  }

  // Build sitemap URLs array
  // SEO: Use Set to prevent duplicate URLs
  const urlSet = new Set<string>();
  const sitemapUrls: SitemapUrl[] = [];

  // Helper function to add URL if not duplicate
  function addUrl(url: SitemapUrl): void {
    if (urlSet.has(url.loc)) {
      console.warn(`Duplicate URL detected in sitemap: ${url.loc}`);
      return;
    }
    urlSet.add(url.loc);
    sitemapUrls.push(url);
  }

  // Homepage (EN and DE)
  // SEO: Highest priority for homepage
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/en/`,
    priority: '1.0',
  });
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/de/`,
    priority: '1.0',
  });

  // Vendor detail pages (EN and DE)
  // SEO: Include only public vendors, use real updated_at for lastmod
  (vendors || []).forEach((vendor) => {
    if (vendor.slug) {
      // Only include lastmod if we have a reliable timestamp
      // SEO: Don't fake lastmod dates - omit if unavailable
      const urlEn: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/en/vendor/${vendor.slug}`,
        changefreq: 'monthly',
        priority: '0.6',
      };
      const urlDe: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/de/vendor/${vendor.slug}`,
        changefreq: 'monthly',
        priority: '0.6',
      };

      if (vendor.updated_at) {
        const lastmod = new Date(vendor.updated_at).toISOString().split('T')[0];
        urlEn.lastmod = lastmod;
        urlDe.lastmod = lastmod;
      }

      addUrl(urlEn);
      addUrl(urlDe);
    }
  });

  // Category pages (EN and DE)
  // SEO: Category pages are important landing pages
  (categories || []).forEach((category) => {
    if (category.slug) {
      addUrl({
        loc: `${PRODUCTION_DOMAIN}/en/category/${category.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      });
      addUrl({
        loc: `${PRODUCTION_DOMAIN}/de/category/${category.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }
  });

  // Country pages - get distinct countries and calculate lastmod
  // SEO: Country pages aggregate vendors, use most recent vendor update
  function normalizeCountry(country: string): string {
    return country.trim().toLowerCase();
  }

  // Get unique countries with their most recent update date
  const countryMap = new Map<string, Date>();
  (vendors || []).forEach((vendor: any) => {
    if (vendor.country && vendor.updated_at) {
      const normalized = normalizeCountry(vendor.country);
      const updateDate = new Date(vendor.updated_at);
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
    const countrySlug = encodeURIComponent(normalizedCountry);
    
    const urlEn: SitemapUrl = {
      loc: `${PRODUCTION_DOMAIN}/en/country/${countrySlug}`,
      changefreq: 'weekly',
      priority: '0.7',
    };
    const urlDe: SitemapUrl = {
      loc: `${PRODUCTION_DOMAIN}/de/country/${countrySlug}`,
      changefreq: 'weekly',
      priority: '0.7',
    };

    // Only include lastmod if we have a reliable timestamp
    if (lastmodDate) {
      const lastmod = lastmodDate.toISOString().split('T')[0];
      urlEn.lastmod = lastmod;
      urlDe.lastmod = lastmod;
    }

    addUrl(urlEn);
    addUrl(urlDe);
  });

  // Technology pages - generate URLs from technologies table
  // SEO: Technology pages are important landing pages
  (technologies || []).forEach((technology) => {
    if (technology.slug) {
      const urlEn: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/en/technology/${technology.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };
      const urlDe: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/de/technology/${technology.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };

      // Only include lastmod if we have a reliable timestamp
      if (technology.updated_at) {
        const lastmod = new Date(technology.updated_at).toISOString().split('T')[0];
        urlEn.lastmod = lastmod;
        urlDe.lastmod = lastmod;
      }

      addUrl(urlEn);
      addUrl(urlDe);
    }
  });

  // Legal pages (EN and DE)
  // SEO: Legal pages are required but low priority
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/en/impressum`,
    changefreq: 'yearly',
    priority: '0.3',
  });
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/de/impressum`,
    changefreq: 'yearly',
    priority: '0.3',
  });
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/en/privacy`,
    changefreq: 'yearly',
    priority: '0.3',
  });
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/de/privacy`,
    changefreq: 'yearly',
    priority: '0.3',
  });

  // Build XML from sitemap URLs
  // SEO: Sort URLs for predictable output
  sitemapUrls.sort((a, b) => a.loc.localeCompare(b.loc));

  const urlEntries = sitemapUrls.map((url) => {
    const parts = [`    <loc>${url.loc}</loc>`];
    if (url.lastmod) {
      parts.push(`    <lastmod>${url.lastmod}</lastmod>`);
    }
    if (url.changefreq) {
      parts.push(`    <changefreq>${url.changefreq}</changefreq>`);
    }
    parts.push(`    <priority>${url.priority}</priority>`);
    return `  <url>\n${parts.join('\n')}\n  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

  // Validate sitemap size (Google limit: 50MB uncompressed, 50,000 URLs)
  // SEO: Ensure sitemap stays within limits
  if (sitemapUrls.length > 50000) {
    console.warn(`Sitemap contains ${sitemapUrls.length} URLs, exceeding Google's 50,000 URL limit`);
  }

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

