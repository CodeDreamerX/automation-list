export const prerender = true;

export function GET() {
  return new Response(
`User-agent: *
Allow: /
Disallow: /admin/

Sitemap: https://automation-list.com/sitemap.xml`
  );
}
