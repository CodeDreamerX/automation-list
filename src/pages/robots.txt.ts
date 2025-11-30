import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const sitemapUrl = new URL('/sitemap.xml', url.origin).href;

  const robotsTxt = `
User-agent: *
Disallow: /admin/
Disallow: /
Disallow: /index.astro

Sitemap: ${sitemapUrl}
`.trim();

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

