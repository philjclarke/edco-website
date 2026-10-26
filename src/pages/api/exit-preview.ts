/* Ends a Prismic preview session and returns to the published page. */
import type { APIRoute } from 'astro';
import { prismic } from '@/lib/prismic';

export const prerender = false;

export const GET: APIRoute = ({ url, cookies, redirect }) => {
  cookies.delete(prismic.cookie.preview, { path: '/' });
  const to = url.searchParams.get('to') ?? '/';
  // Only ever redirect within this site.
  return redirect(to.startsWith('/') && !to.startsWith('//') ? to : '/', 302);
};
