/*
  Where Prismic's Preview button lands. Prismic sends a preview token and the
  page's document ID; this stores the token in Prismic's standard preview
  cookie and sends the editor to the draft version of that page under
  /preview/.

  Draft previews exist for product, capability and outcome pages. For other
  page types this explains that and links to the published page instead.
*/
import type { APIRoute } from 'astro';
import { client, prismic, repositoryName } from '@/lib/prismic';

export const prerender = false;

const SINGLETON_PATHS: Record<string, string> = {
  home_page: '/', outcomes_hub: '/what-are-you-trying-to-achieve/', products_hub: '/products/',
  capabilities_hub: '/capabilities/', free_analysis_page: '/free-customer-analysis/',
  agencies_page: '/agencies-and-partners/', about_page: '/about/', contact_page: '/contact/',
  customer_page: '/customer/', for_educators_page: '/for-educators/', what_we_think_page: '/what-we-think/',
  case_studies_hub: '/case-studies/', search_page: '/search/', not_found_page: '/404/', site_settings: '/',
};

function livePath(doc: prismic.PrismicDocument): string {
  if (doc.type === 'article') return `/what-we-think/${doc.data.stream}/${doc.uid}/`;
  if (doc.type === 'case_study') return `/case-studies/${doc.uid}/`;
  return SINGLETON_PATHS[doc.type] ?? '/';
}

const page = (title: string, body: string) =>
  new Response(
    `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>` +
      `<body style="font:16px/1.6 system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#0f1421">${body}</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  );

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

  if (!['product', 'capability', 'outcome'].includes(doc.type)) {
    const live = livePath(doc);
    return page(
      'Preview not available yet',
      `<h1 style="font-size:1.5rem">Draft previews aren’t set up for this kind of page yet</h1>` +
        `<p>You can preview drafts of product, capability and outcome pages. For this page, publish your change to see it on the site, or ask the web team to add previews for it.</p>` +
        `<p><a href="${live}">See the published page</a></p>`
    );
  }

  const path = prismic.asLink(doc) ?? '/';
  cookies.set(prismic.cookie.preview, token, { path: '/', sameSite: 'lax', secure: url.protocol === 'https:' });
  return redirect(`/preview${path}`, 302);
};
