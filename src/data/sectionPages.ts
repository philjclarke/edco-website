/*
  Product, capability and outcome pages, from Prismic, as the lists the rest
  of the site uses: menus, cards, related links, the outcome routes. Each
  page's own content is rendered from its components (see PageView.astro).
  Read once per build.

  Order follows each page's Menu order in Prismic (src/lib/menu.ts), blank
  last, oldest first. Pages without a web address yet are left out, as they
  are everywhere else (src/lib/pages.ts).
*/
import type { PrismicDocument } from '@prismicio/client';
import { pages, previewOf } from '@/lib/pages';
import { byMenuOrder } from '@/lib/menu';

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
  const docs = (await pages()).docs.filter((d) => d.type === kind);
  return [...docs].sort(byMenuOrder).map((doc) => toPage(kind, doc));
}
