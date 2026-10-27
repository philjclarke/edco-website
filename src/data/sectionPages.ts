/*
  Product, capability and outcome pages, from Prismic.

  Each Prismic page becomes the handful of fields the rest of the site uses
  (hubs, cards, menus, related links), plus the Prismic document itself for
  the page template to render its sections. Read once per build.

  Order follows the site menu (src/data/site.ts), which is the deliberate
  order; a page that isn't in the menu yet goes at the end.
*/
import type { PrismicDocument } from '@prismicio/client';
import { allOf, hrefOf, imageOf, textOf, type RemoteImage } from '@/lib/prismic';
import { knownIcon } from '@/lib/icons';
import { primaryNav } from './site';

export type SectionKind = 'product' | 'capability' | 'outcome';

export interface SectionPage {
  kind: SectionKind;
  slug: string;
  href: string;
  /** Short form used in menus, cards and links. */
  navLabel: string;
  /** Page H1. */
  title: string;
  /** The single sentence that carries the argument. */
  standfirst: string;
  summary: string;
  /** Intro paragraph in the hero. */
  lead?: string;
  icon?: string;
  banner?: { src: RemoteImage; focus?: 'left' | 'centre' | 'right' };
  /** The product's own website. An empty href shows a placeholder. */
  externalSite?: { label: string; href: string };
  metaTitle?: string;
  metaDescription?: string;
  /** How the page appears wherever another page features it (its Panel tab). */
  panel: { title: string; text: string; icon?: string; linkLabel?: string };
  doc: PrismicDocument;
}

const PATH = { product: (u: string) => `/products/${u}/`, capability: (u: string) => `/capabilities/${u}/`, outcome: (u: string) => `/${u}/` };

const menuOrder = new Map<string, number>();
primaryNav.forEach((g) => g.children?.forEach((c, i) => menuOrder.set(c.href, i)));

export function toPage(kind: SectionKind, doc: PrismicDocument): SectionPage {
  const d = doc.data as Record<string, any>;
  const banner = imageOf(d.banner);
  const site = kind === 'product' && (textOf(d.site_label) || hrefOf(d.site_link))
    ? { label: textOf(d.site_label) || `Visit ${textOf(d.nav_label)}`, href: hrefOf(d.site_link) ?? '' }
    : undefined;
  return {
    kind,
    slug: doc.uid!,
    href: PATH[kind](doc.uid!),
    navLabel: textOf(d.nav_label) || doc.uid!,
    title: textOf(d.title),
    standfirst: textOf(d.standfirst),
    summary: textOf(d.summary),
    lead: textOf(d.lead) || undefined,
    icon: knownIcon(d.icon),
    banner: banner ? { src: banner, focus: d.banner_focus || 'centre' } : undefined,
    externalSite: site,
    panel: {
      title: textOf(d.panel_title) || textOf(d.nav_label) || doc.uid!,
      text: textOf(d.summary),
      icon: knownIcon(d.icon),
      linkLabel: textOf(d.panel_link_label) || undefined,
    },
    metaTitle: textOf(d.meta_title) || undefined,
    metaDescription: textOf(d.meta_description) || undefined,
    doc,
  };
}

export async function loadSection(kind: SectionKind): Promise<SectionPage[]> {
  const pages = (await allOf(kind)).map((doc) => toPage(kind, doc));
  const rank = (p: SectionPage) => menuOrder.get(p.href) ?? Number.MAX_SAFE_INTEGER;
  return pages.sort((a, b) => rank(a) - rank(b) || a.navLabel.localeCompare(b.navLabel));
}
