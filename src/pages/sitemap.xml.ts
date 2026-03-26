import type { APIRoute } from 'astro';
import { supabase } from '../lib/supabaseClient';
import { normalizeCountryName, slugifyCountry } from '../lib/countryUtils';

// Production domain - sitemap URLs must be canonical and absolute
// SEO: Use production domain to ensure consistency across environments
const PRODUCTION_DOMAIN = 'https://www.automation-list.com';

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

  // Fetch categories with id + slug
  // SEO: Only include active categories
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, slug')
    .eq('is_active', true)
    .order('slug', { ascending: true });

  if (categoriesError) {
    console.error('Error fetching categories for sitemap:', categoriesError);
  }

  // Fetch vendor-category links with vendor updated_at for category lastmod
  // SEO: Category pages should reflect the latest change among their vendors
  const categoryIds = (categories || []).map((category) => category.id).filter(Boolean);
  let categoryVendorLinks: any[] = [];
  if (categoryIds.length > 0) {
    const { data: linksData, error: linksError } = await supabase
      .from('vendor_categories')
      .select(`
        category_id,
        vendors:vendors (
          updated_at,
          plan
        )
      `)
      .in('category_id', categoryIds);

    if (linksError) {
      console.error('Error fetching vendor-category links for sitemap:', linksError);
    } else {
      categoryVendorLinks = linksData || [];
    }
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

  // Fetch industries with slug and updated_at for industry pages
  // SEO: Only include active industries
  const { data: industries, error: industriesError } = await supabase
    .from('industries')
    .select('slug, updated_at')
    .eq('is_active', true)
    .order('slug', { ascending: true });

  if (industriesError) {
    console.error('Error fetching industries for sitemap:', industriesError);
  }

  // Build sitemap URLs array
  // SEO: Use Set to prevent duplicate URLs
  const urlSet = new Set<string>();
  const sitemapUrls: SitemapUrl[] = [];
  const locales = ['en', 'de'] as const;

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
    changefreq: 'weekly',
    priority: '1.0',
  });
  addUrl({
    loc: `${PRODUCTION_DOMAIN}/de/`,
    changefreq: 'weekly',
    priority: '1.0',
  });

  // Public index and landing pages (EN and DE)
  // SEO: Include all public indexable landing pages; exclude admin/API routes.
  const localizedStaticPages: Array<{ path: string; changefreq: string; priority: string }> = [
    { path: '/vendors', changefreq: 'daily', priority: '0.9' },
    { path: '/categories', changefreq: 'weekly', priority: '0.9' },
    { path: '/technologies', changefreq: 'weekly', priority: '0.9' },
    { path: '/industries', changefreq: 'weekly', priority: '0.9' },
    { path: '/countries', changefreq: 'weekly', priority: '0.9' },
    { path: '/features', changefreq: 'monthly', priority: '0.7' },
    { path: '/pricing', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'yearly', priority: '0.5' },
    { path: '/submit-listing', changefreq: 'monthly', priority: '0.6' },
    { path: '/impressum', changefreq: 'yearly', priority: '0.3' },
    { path: '/privacy', changefreq: 'yearly', priority: '0.3' },
  ];

  localizedStaticPages.forEach((page) => {
    locales.forEach((locale) => {
      addUrl({
        loc: `${PRODUCTION_DOMAIN}/${locale}${page.path}`,
        changefreq: page.changefreq,
        priority: page.priority,
      });
    });
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

  // Category detail pages (EN and DE)
  // SEO: Use latest vendor updated_at per category as lastmod
  const categoryLastmodMap = new Map<string, Date>();
  (categoryVendorLinks || []).forEach((link: any) => {
    const categoryId = link?.category_id;
    const vendor = link?.vendors;
    if (!categoryId || !vendor || vendor.plan === 'deactivated' || !vendor.updated_at) {
      return;
    }

    const updatedAt = new Date(vendor.updated_at);
    const existing = categoryLastmodMap.get(categoryId);
    if (!existing || updatedAt > existing) {
      categoryLastmodMap.set(categoryId, updatedAt);
    }
  });

  (categories || []).forEach((category) => {
    if (category.slug) {
      const lastmodDate = categoryLastmodMap.get(category.id);
      const urlEn: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/en/category/${category.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };
      const urlDe: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/de/category/${category.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };

      if (lastmodDate) {
        const lastmod = lastmodDate.toISOString().split('T')[0];
        urlEn.lastmod = lastmod;
        urlDe.lastmod = lastmod;
      }

      addUrl(urlEn);
      addUrl(urlDe);
    }
  });

  // Country pages - get distinct countries and calculate lastmod
  // SEO: Country pages aggregate vendors, use most recent vendor update
  // Get unique countries with their most recent update date
  // Include countries even when updated_at is missing, but omit lastmod.
  const countryMap = new Map<string, Date>();
  const countrySet = new Set<string>();
  (vendors || []).forEach((vendor: any) => {
    if (vendor.country) {
      const normalized = normalizeCountryName(vendor.country);
      countrySet.add(normalized);

      if (vendor.updated_at) {
        const updateDate = new Date(vendor.updated_at);
        const existingDate = countryMap.get(normalized);
        if (!existingDate || updateDate > existingDate) {
          countryMap.set(normalized, updateDate);
        }
      }
    }
  });

  // Sort countries and generate country page URLs
  const uniqueCountries = Array.from(countrySet.keys()).sort();
  uniqueCountries.forEach((normalizedCountry) => {
    const lastmodDate = countryMap.get(normalizedCountry);
    const countrySlug = slugifyCountry(normalizedCountry);
    
    const urlEn: SitemapUrl = {
      loc: `${PRODUCTION_DOMAIN}/en/country/${countrySlug}`,
      changefreq: 'weekly',
      priority: '0.8',
    };
    const urlDe: SitemapUrl = {
      loc: `${PRODUCTION_DOMAIN}/de/country/${countrySlug}`,
      changefreq: 'weekly',
      priority: '0.8',
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

  // Industry pages - generate URLs from industries table
  // SEO: Industry pages are important landing pages
  (industries || []).forEach((industry) => {
    if (industry.slug) {
      const urlEn: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/en/industry/${industry.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };
      const urlDe: SitemapUrl = {
        loc: `${PRODUCTION_DOMAIN}/de/industry/${industry.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
      };

      // Only include lastmod if we have a reliable timestamp
      if (industry.updated_at) {
        const lastmod = new Date(industry.updated_at).toISOString().split('T')[0];
        urlEn.lastmod = lastmod;
        urlDe.lastmod = lastmod;
      }

      addUrl(urlEn);
      addUrl(urlDe);
    }
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

