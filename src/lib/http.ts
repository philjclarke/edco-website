/*
  Astro's built-in origin check compares the Origin header against its own
  view of the request URL. Behind Vercel's TLS-terminating proxy those differ
  (the function sees the internal protocol), so it rejects legitimate form
  posts. This replaces it: compare hosts rather than full origins, which is
  what actually identifies the site, and read the forwarded host the proxy sets.

  A cross-site form post carries the attacker's Origin, so this still stops the
  thing the original check was for.
*/
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  // Same-origin navigations may omit Origin entirely; those aren't the attack.
  if (!origin) return true;

  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
