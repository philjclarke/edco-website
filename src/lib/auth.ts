/*
  A shared password for the admin area, exchanged for a signed cookie.

  Deliberately modest: this guards a text editor for a handful of named people
  at one client, not anything with personal data behind it. The cookie is
  HMAC-signed so it can't be forged, is httpOnly so script can't read it, and
  expires after a week.
*/

const COOKIE = 'edco_admin';
const MAX_AGE = 60 * 60 * 24 * 7;

function secret() {
  const s = import.meta.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET is not set in the Vercel project.');
  return s;
}

async function sign(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/[+/=]/g, (c) =>
    ({ '+': '-', '/': '_', '=': '' })[c]!
  );
}

/** Constant-time-ish comparison, so a wrong password leaks nothing by timing. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function passwordMatches(input: string) {
  const expected = import.meta.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD is not set in the Vercel project.');
  return same(input, expected);
}

export async function issueCookie(): Promise<string> {
  const expires = Date.now() + MAX_AGE * 1000;
  const payload = String(expires);
  return `${payload}.${await sign(payload)}`;
}

export async function cookieIsValid(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [payload, sig] = value.split('.');
  if (!payload || !sig) return false;
  if ((await sign(payload)) !== sig) return false;
  return Number(payload) > Date.now();
}

export const COOKIE_NAME = COOKIE;
export const COOKIE_MAX_AGE = MAX_AGE;

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
