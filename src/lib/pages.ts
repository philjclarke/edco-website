/*
  Every Prismic page, and how each one appears wherever another page links to
  it (its Preview tab): How we do it panels, content listings, related links.

  Published pages are read once per build. During a Prismic preview, pages
  are read at the preview's ref once per request, so a draft shows up in
  listings as well as on its own page.
*/
import type { PrismicDocument } from '@prismicio/client';
import { PAGE_TYPES, pageTypeOf } from '../../prismic/pageTypes';
import { client, hrefOf, imageOf, linkResolver, prismic, textOf, type RemoteImage } from './prismic';
import { knownIcon } from './icons';

/** Every type with a page on the site that content listings can show. */
const TYPES = [...PAGE_TYPES.map((t) => t.id), 'case_study'];
const ARTICLE_TYPES = new Set<string>(PAGE_TYPES.filter((t) => 'article' in t && t.article).map((t) => t.id));

export interface PagePreview {
  id: string;
  type: string;
  href: string;
  /** The Preview tab's title: menus, cards, links and the breadcrumb. */
  title: string;
  positioning?: string;
  /** The Preview tab's introduction text. */
  text: string;
  icon?: string;
  image?: RemoteImage;
  linkLabel?: string;
  tags: string[];
  /** Insights and opinion only. */
  article?: { date?: Date; author?: string; status: 'sample' | 'live'; label: string };
}

export function previewOf(doc: PrismicDocument): PagePreview {
  const d = doc.data as Record<string, any>;
  if (doc.type === 'case_study') {
    return { id: doc.id, type: doc.type, href: linkResolver(doc)!, title: textOf(d.title), text: textOf(d.summary), tags: [] };
  }
  const banner = (d.slices as any[] | undefined)?.find((s) => s.slice_type === 'banner')?.primary ?? {};
  return {
    id: doc.id,
    type: doc.type,
    href: linkResolver(doc) ?? '/',
    title: textOf(d.nav_label) || textOf(banner.title) || doc.uid || '',
    positioning: textOf(d.preview_positioning) || undefined,
    text: textOf(d.summary),
    icon: knownIcon(d.icon),
    image: imageOf(d.preview_image),
    linkLabel: textOf(d.panel_link_label) || undefined,
    tags: (d.interest_tags ?? []).map((t: any) => textOf(t.tag)).filter(Boolean),
    article: ARTICLE_TYPES.has(doc.type)
      ? {
          date: d.date ? new Date(d.date) : undefined,
          author: textOf(d.author) || undefined,
          status: d.status === 'sample' ? 'sample' : 'live',
          label: pageTypeOf(doc.type)!.label,
        }
      : undefined,
  };
}

export interface Pages {
  docs: PrismicDocument[];
  byId: Map<string, PrismicDocument>;
  byHref: Map<string, PrismicDocument>;
  /** The one page of a single-page type, e.g. the products hub. */
  single: (type: string) => PrismicDocument | undefined;
  preview: (doc: PrismicDocument) => PagePreview;
  /** The page a Prismic link points to, if it's one of ours. */
  linked: (link: any) => PrismicDocument | undefined;
}

async function load(ref?: string): Promise<Pages> {
  const all = await client.dangerouslyGetAll({
    filters: [prismic.filter.any('document.type', TYPES)],
    orderings: [{ field: 'document.first_publication_date' }],
    ...(ref ? { ref } : {}),
  });
  // One editor's half-finished page mustn't stop everyone else's changes going
  // live, so a page without a web address, or with one an older page already
  // has, is left out of the site and named in the build log.
  const docs: PrismicDocument[] = [];
  const byHref = new Map<string, PrismicDocument>();
  for (const d of all) {
    const href = linkResolver(d);
    const clash = href && byHref.get(href);
    if (!href) console.warn(`Left out the ${d.type} page ${d.id}: it has no web address (UID) yet.`);
    else if (clash) console.warn(`Left out the ${d.type} page ${d.id}: the ${clash.type} page ${clash.id} already has the address ${href}.`);
    else {
      docs.push(d);
      byHref.set(href, d);
    }
  }
  const byId = new Map(docs.map((d) => [d.id, d]));
  const previews = new WeakMap<PrismicDocument, PagePreview>();
  return {
    docs,
    byId,
    byHref,
    single: (type) => docs.find((d) => d.type === type),
    preview: (doc) => {
      if (!previews.has(doc)) previews.set(doc, previewOf(doc));
      return previews.get(doc)!;
    },
    linked: (link) => (link?.id && byId.get(link.id)) || byHref.get(hrefOf(link) ?? '\0'),
  };
}

let published: Promise<Pages> | undefined;
const perRequest = new WeakMap<object, Promise<Pages>>();

/** Every page, as the current request should see it (drafts while previewing). */
export function pages(locals?: App.Locals): Promise<Pages> {
  const ref = locals?.prismicPreview?.ref;
  if (!locals || !ref) return (published ??= load());
  if (!perRequest.has(locals)) perRequest.set(locals, load(ref));
  return perRequest.get(locals)!;
}

/** The breadcrumb above a page's heading: the section it sits in. */
export function parentOf(all: Pages, type: string): { label: string; href: string } | undefined {
  const parent = pageTypeOf(type);
  const hub = parent && 'parent' in parent ? all.single(parent.parent) : undefined;
  return hub ? { label: all.preview(hub).title, href: all.preview(hub).href } : undefined;
}

/** Pages of a type, for getStaticPaths. */
export async function pagesOf(...types: string[]) {
  return (await pages()).docs.filter((d) => types.includes(d.type));
}

/** Pages of types whose content hasn't been moved into components yet — the build stops rather than publish them broken. */
export function assertComponents(doc: PrismicDocument) {
  if (doc.type === 'case_study') return;
  const slices = doc.data.slices as any[] | undefined;
  if (!slices?.some((s) => s.slice_type === 'banner') && ['hero_title', 'hero_heading', 'standfirst', 'stream'].some((k) => k in doc.data)) {
    throw new Error(`The ${doc.type} page ${doc.uid ?? ''} still has its old fields rather than components. Publish the restructured content in Prismic, then rebuild.`);
  }
}

/** What a page's components need to know about the page they're on. */
export interface PageContext {
  id: string;
  type: string;
  /** The page's Preview title, the default for its banner's small label. */
  title: string;
  parent?: { label: string; href: string };
  preview: PagePreview;
}

export function contextOf(all: Pages, doc: PrismicDocument): PageContext {
  const preview = all.preview(doc);
  return { id: doc.id, type: doc.type, title: preview.title, parent: parentOf(all, doc.type), preview };
}
