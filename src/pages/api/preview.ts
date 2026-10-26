/*
  Where Prismic's Preview button lands. Prismic sends a preview token and the
  page's document ID; this stores the token in Prismic's standard preview
  cookie and sends the editor to the draft version of that page under
  /preview/.
*/
import type { APIRoute } from 'astro';
import { client, prismic, repositoryName } from '@/lib/prismic';

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const token = url.searchParams.get('token');
  const documentID = url.searchParams.get('documentId');
  // Only accept previews from this site's own repository.
  if (!token || !documentID || !new URL(token).hostname.startsWith(`${repositoryName}.`)) {
    return new Response('Missing or unrecognised preview link. Open the preview from Prismic again.', { status: 400 });
  }

  let path: string;
  try {
    path = await client.resolvePreviewURL({ documentID, previewToken: token, defaultURL: '/' });
  } catch {
    return new Response('This preview has expired or the page no longer exists. Open the preview from Prismic again.', { status: 410 });
  }
  cookies.set(prismic.cookie.preview, token, { path: '/', sameSite: 'lax', secure: url.protocol === 'https:' });
  return redirect(path === '/' ? '/' : `/preview${path}`, 302);
};
