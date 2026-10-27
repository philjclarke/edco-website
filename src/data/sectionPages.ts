/*
  Product, capability and outcome pages, from Prismic, as the lists the rest
  of the site uses: menus, cards, related links, the outcome routes. Each
  page's own content is rendered from its components (see PageView.astro).
  Read once per build.

  Order follows the site menu (src/data/site.ts), which is the deliberate
  order; a page that isn't in the menu yet goes at the end.
*/
import type { PrismicDocument } from '@prismicio/client';
import { previewOf } from '@/lib/pages';
import { allOf } from '@/lib/prismic';
import { primaryNav } from './site';

export type SectionKind = 'product' | 'capability' | 'outcome';

export interface SectionPage {
  kind: SectionKind;
  slug: string;
  href: string;
  /** Short form used in menus, cards and links (the Preview tab's title). */
  navLabel: string;
  /** The Preview tab's introduction text. */
  summary: string;
  icon?: string;
  /** How the page appears wherever another page features it (its Preview tab). */
  panel: { title: string; text: string; icon?: string; linkLabel?: string };
  doc: PrismicDocument;
}

const menuOrder = new Map<string, number>();
primaryNav.forEach((g) => g.children?.forEach((c, i) => menuOrder.set(c.href, i)));

export function toPage(kind: SectionKind, doc: PrismicDocument): SectionPage {
  const p = previewOf(doc);
  return {
    kind,
    slug: doc.uid!,
    href: p.href,
    navLabel: p.title,
    summary: p.text,
    icon: p.icon,
    panel: { title: p.title, text: p.text, icon: p.icon, linkLabel: p.linkLabel },
    doc,
  };
}

export async function loadSection(kind: SectionKind): Promise<SectionPage[]> {
  const pages = (await allOf(kind)).map((doc) => toPage(kind, doc));
  const rank = (p: SectionPage) => menuOrder.get(p.href) ?? Number.MAX_SAFE_INTEGER;
  return pages.sort((a, b) => rank(a) - rank(b) || a.navLabel.localeCompare(b.navLabel));
}
