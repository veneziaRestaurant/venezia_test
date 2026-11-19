import type { APIRoute } from 'astro';
import { absUrl, withBase } from '../lib/paths';

export const GET: APIRoute = ({ site }) =>
  new Response(`User-agent: *\nAllow: /\nDisallow: ${withBase('/qr/')}\n\nSitemap: ${absUrl('/sitemap-index.xml', site!)}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
