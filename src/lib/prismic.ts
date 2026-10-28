/*
  Prismic: the client the build reads content through, and the small
  translations between Prismic's shapes and the site's.

  Content is read at build time from the published ("master") version, so
  pages stay static. The repository's Content API is public, so no token is
  needed to build. PRISMIC_REPOSITORY can point a build at another
  repository (e.g. a copy for testing); otherwise it uses EdCo's.
*/
import * as prismic from '@prismicio/client';
import { PAGE_TYPES } from '../../prismic/pageTypes';

export const repositoryName = import.meta.env.PRISMIC_REPOSITORY || process.env.PRISMIC_REPOSITORY || '66bbee42';

/** Where each Prismic page type lives on the site (prismic/pageTypes.ts). */
export const routes: prismic.Route[] = [
  ...PAGE_TYPES.map((t) => ({ type: t.id, path: t.path })),
  { type: 'case_study', path: '/case-studies/:uid/' },
];

/*
  PRISMIC_REF and PRISMIC_ACCESS_TOKEN build the site from a Prismic release
  instead of the published content, to check a content change before it's
  published. Local use only: never set them on Vercel.
*/
const pinnedRef = process.env.PRISMIC_REF;
export const client = prismic.createClient(repositoryName, {
  routes,
  ...(process.env.PRISMIC_ACCESS_TOKEN ? { accessToken: process.env.PRISMIC_ACCESS_TOKEN } : {}),
});
if (pinnedRef) client.queryContentFromRef(pinnedRef);

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

/** A page's address on the site, from its type and web address. */
export const linkResolver = (doc: { type: string; uid?: string | null }) => {
  const route = routes.find((r) => r.type === doc.type);
  // A page saved before its UID is filled in has no address yet.
  if (!route || (route.path.includes(':uid') && !doc.uid)) return null;
  return route.path.replace(':uid', doc.uid ?? '');
};

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
