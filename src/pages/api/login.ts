import type { APIRoute } from 'astro';
import { passwordMatches, issueCookie, COOKIE_NAME, COOKIE_MAX_AGE } from '@/lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const password = String(form.get('password') ?? '');

  if (!passwordMatches(password)) {
    return redirect('/admin/?error=1', 303);
  }

  cookies.set(COOKIE_NAME, await issueCookie(), {
    path: '/',
    httpOnly: true,
    // Secure in production; a secure cookie is never sent over plain HTTP, so
    // requiring it unconditionally would make local dev impossible to sign in to.
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
  return redirect('/admin/', 303);
};
