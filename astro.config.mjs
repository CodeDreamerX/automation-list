import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@tailwindcss/vite';

// SSR configuration required for Docker + Koyeb deployment
// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  vite: {
    plugins: [tailwind()],
  },
  // TODO: Static Generation Strategy (Partial Prerendering)
  // Astro automatically enables partial prerendering when mixing SSG and SSR:
  // - Pages with getStaticPaths() are statically generated (SSG) at build time
  //   * Vendor detail pages: /en/vendor/[slug], /de/vendor/[slug]
  //   * Category detail pages: /en/category/[slug], /de/category/[slug] (page 1 only)
  //   * Technology detail pages: /en/technology/[tech], /de/technology/[tech] (page 1 only)
  //   * Country pages: /en/country/[country], /de/country/[country] (page 1 only)
  // - Pages with export const prerender = false are server-side rendered (SSR) on-demand
  //   * Vendor listing pages: /en/vendors, /de/vendors (pagination requires SSR)
  //   * Pagination pages beyond page 1 for category/technology/country pages
  // This hybrid approach optimizes performance: detail pages are SSG, listing pages with pagination are SSR
  // See STATIC_GENERATION_STRATEGY.md for full details
});

