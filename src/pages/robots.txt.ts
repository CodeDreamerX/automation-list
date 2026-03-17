import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const isProd = import.meta.env.PROD;

  const content = isProd
    ? `User-agent: *
Allow: /

# Allow AI search crawlers explicitly
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

# Block pure training scrapers
User-agent: CCBot
Disallow: /

User-agent: Bytespider
Disallow: /

User-agent: Amazonbot
Disallow: /

User-agent: meta-externalagent
Disallow: /

Sitemap: ${site}sitemap.xml`
    : `User-agent: *
Disallow: /`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
