/*
  Prismic: the client the build reads content through, and the small
  translations between Prismic's shapes and the site's.

  Content is read at build time from the published ("master") version, so
  pages stay static. The repository's Content API is public, so no token is
  needed to build. PRISMIC_REPOSITORY can point a build at another
  repository (e.g. a copy for testing); otherwise it uses EdCo's.
*/
import * as prismic from '@prismicio/client';

export const repositoryName = import.meta.env.PRISMIC_REPOSITORY || process.env.PRISMIC_REPOSITORY || '66bbee42';

/** Where each Prismic page type lives on the site. */
export const routes: prismic.Route[] = [
  { type: 'product', path: '/products/:uid/' },
  { type: 'capability', path: '/capabilities/:uid/' },
  { type: 'outcome', path: '/:uid/' },
];

export const client = prismic.createClient(repositoryName, { routes });

/** Every page of a type, in the order editors set in Prismic (by date, oldest first, as a stable default). */
const cache = new Map<string, Promise<prismic.PrismicDocument[]>>();
export function allOf(type: string): Promise<prismic.PrismicDocument[]> {
  if (!cache.has(type)) {
    cache.set(type, client.getAllByType(type, { orderings: [{ field: 'document.first_publication_date' }] }));
  }
  return cache.get(type)!;
}

const SITE = /^https?:\/\/(www\.)?educationcompany\.co\.uk/i;

/**
 * A Prismic link as an href. Links to Prismic pages resolve through `routes`;
 * web links to this site become relative, so they work on preview builds too.
 */
export function hrefOf(link: prismic.LinkField | null | undefined): string | null {
  if (!prismic.isFilled.link(link)) return null;
  const url = prismic.asLink(link);
  if (!url) return null;
  return url.replace(SITE, '') || '/';
}

/** A Prismic image, or nothing if the field is empty. */
export type RemoteImage = prismic.FilledImageFieldImage;
export const imageOf = (field: prismic.ImageField | null | undefined): RemoteImage | undefined =>
  prismic.isFilled.image(field) ? (field as RemoteImage) : undefined;

/** Responsive src/srcset served by Prismic's image CDN, resized on request. */
export function srcsetOf(image: RemoteImage, widths: number[]) {
  const { src, srcset } = prismic.asImageWidthSrcSet(image, { widths });
  return { src, srcset };
}

/** For links to Prismic pages inside rich text. */
export const linkResolver = (doc: { type: string; uid?: string | null }) =>
  doc.type === 'product' ? `/products/${doc.uid}/`
  : doc.type === 'capability' ? `/capabilities/${doc.uid}/`
  : doc.type === 'outcome' ? `/${doc.uid}/`
  : null;

/** Rich text as HTML, with links to this site's own pages made relative. */
export const richHTML = (field: prismic.RichTextField | null | undefined) =>
  (prismic.asHTML(field, { linkResolver }) ?? '').replace(
    /href="https?:\/\/(www\.)?educationcompany\.co\.uk/gi,
    'href="'
  );

export const textOf = (s: string | null | undefined) => (s ?? '').trim();
export const paragraphsOf = (rt: prismic.RichTextField | null | undefined) =>
  (rt ?? []).filter((n) => n.type === 'paragraph').map((n) => ('text' in n ? n.text : '')).filter(Boolean);
export const listItemsOf = (rt: prismic.RichTextField | null | undefined) =>
  (rt ?? []).filter((n) => n.type === 'list-item').map((n) => ('text' in n ? n.text : '')).filter(Boolean);
export { prismic };
