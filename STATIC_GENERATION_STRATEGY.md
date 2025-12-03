# Static Generation Strategy (SSG vs SSR)

## TODO: Page Rendering Strategy

This document explains which pages use Static Site Generation (SSG) vs Server-Side Rendering (SSR).

### Static Site Generation (SSG) Pages

These pages are pre-rendered at build time using `getStaticPaths()`:

1. **Vendor Detail Pages** (`/en/vendor/[slug].astro`, `/de/vendor/[slug].astro`)
   - ✅ Static generation enabled
   - Uses `getStaticPaths()` to generate all vendor detail pages at build time
   - No pagination - single page per vendor

2. **Category Detail Pages** (`/en/category/[slug].astro`, `/de/category/[slug].astro`)
   - ✅ Static generation enabled
   - Uses `getStaticPaths()` to generate base routes (page 1) for all categories
   - Pagination via query params (`?page=2`, etc.) is handled via SSR on-demand

3. **Technology Detail Pages** (`/en/technology/[tech].astro`, `/de/technology/[tech].astro`)
   - ✅ Static generation enabled
   - Uses `getStaticPaths()` to generate base routes (page 1) for all technologies
   - Pagination via query params (`?page=2`, etc.) is handled via SSR on-demand

4. **Country Pages** (`/en/country/[country].astro`, `/de/country/[country].astro`)
   - ✅ Static generation enabled
   - Uses `getStaticPaths()` to generate base routes (page 1) for all countries
   - Pagination via query params (`?page=2`, etc.) is handled via SSR on-demand

### Server-Side Rendering (SSR) Pages

These pages are rendered on-demand at request time:

1. **Vendor Listing Pages** (`/en/vendors.astro`, `/de/vendors.astro`)
   - ✅ SSR enabled (`export const prerender = false`)
   - Requires SSR due to complex pagination, filtering, and search functionality
   - Dynamic query parameters for filtering (category, technology, country, search)

2. **Pagination Pages** (for category/technology/country detail pages)
   - Pages beyond page 1 (`?page=2`, `?page=3`, etc.) are SSR'd on-demand
   - Base routes (page 1) are statically generated

### Benefits

- **SSG Pages**: Fast loading, better SEO, reduced server load
- **SSR Pages**: Dynamic content, real-time filtering, flexible pagination

### Notes

- Partial prerendering is enabled in `astro.config.mjs` to allow mixing static and dynamic content where safe
- All detail pages (vendor, category, technology, country) use static generation for the base route
- Pagination beyond page 1 uses SSR to handle dynamic query parameters efficiently

