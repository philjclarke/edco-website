/*
  robots.txt. Until launch (site.indexable in src/data/site.ts) it turns every
  crawler away; after that it allows everything and points to the sitemap.
*/
import type { APIRoute } from 'astro';
import { site } from '@/data/site';

export const GET: APIRoute = ({ site: base }) => {
  const body = site.indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap-index.xml', base)}\n`
    : 'User-agent: *\nDisallow: /\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
