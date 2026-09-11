import type { APIRoute } from 'astro';
import { COOKIE_NAME , sameOrigin } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });

  cookies.delete(COOKIE_NAME, { path: '/' });
  return redirect('/admin/', 303);
};
