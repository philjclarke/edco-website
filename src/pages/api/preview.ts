/*
  Where Prismic's Preview button lands. Prismic sends a preview token and the
  page's document ID; this stores the token in Prismic's standard preview
  cookie and sends the editor to the draft version of that page under
  /preview/.

  Every page type can be previewed. Site settings, which appear across the
  site, open on the homepage.
*/
import type { APIRoute } from 'astro';
import { client, linkResolver, prismic, repositoryName } from '@/lib/prismic';

export const prerender = false;

// Pages built from fixed fields, which have no route in src/lib/prismic.ts.
const SINGLETON_PATHS: Record<string, string> = {
  free_analysis_page: '/free-customer-analysis/', contact_page: '/contact/', customer_page: '/customer/',
  for_educators_page: '/for-educators/', case_studies_hub: '/case-studies/', search_page: '/search/',
  not_found_page: '/404/', site_settings: '/', // shown across the site; the homepage carries most of it
};

const livePath = (doc: prismic.PrismicDocument) => linkResolver(doc) ?? SINGLETON_PATHS[doc.type] ?? '/';

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token = url.searchParams.get('token');
  const documentID = url.searchParams.get('documentId');
  // Only accept previews from this site's own repository.
  if (!token || !documentID || !new URL(token).hostname.startsWith(`${repositoryName}.`)) {
    return new Response('Missing or unrecognised preview link. Open the preview from Prismic again.', { status: 400 });
  }

  let doc: prismic.PrismicDocument;
  try {
    doc = await client.getByID(documentID, { ref: token, lang: '*' });
  } catch {
    return new Response('This preview has expired or the page no longer exists. Open the preview from Prismic again.', { status: 410 });
  }

  const path = livePath(doc);
  cookies.set(prismic.cookie.preview, token, { path: '/', sameSite: 'lax', secure: url.protocol === 'https:' });
  return redirect(`/preview${path}`, 302);
};
