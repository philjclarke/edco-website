/*
  Prismic slices -> the site's block shapes (src/data/blocks.ts), so the
  existing section components render Prismic content unchanged.

  Quote and How we do it slices aren't blocks: the page template renders
  those as a shout-out band and a route.
*/
import type { Slice } from '@prismicio/client';
import type { Block } from '@/data/blocks';
import { prismic, imageOf, listItemsOf, textOf } from './prismic';

/** For links to other Prismic pages inside rich text. */
const linkResolver = (doc: { type: string; uid?: string | null }) =>
  doc.type === 'product' ? `/products/${doc.uid}/` : doc.type === 'capability' ? `/capabilities/${doc.uid}/` : `/${doc.uid}/`;

const opt = (s: string | null | undefined) => textOf(s) || undefined;

export function blockOf(slice: Slice): Block | null {
  const p = slice.primary as Record<string, any>;
  const heading = textOf(p.heading);
  const lead = opt(p.intro);
  switch (slice.slice_type) {
    case 'text_block':
      return {
        type: 'prose',
        title: heading || undefined,
        paras: [],
        html: prismic.asHTML(p.body, { linkResolver }) ?? '',
      };
    case 'item_list': {
      const items = (p.items ?? []).filter((i: any) => textOf(i.text));
      return {
        type: 'list',
        title: heading,
        lead,
        items: items.map((i: any) => textOf(i.text)),
        icons: items.map((i: any) => opt(i.icon)),
      };
    }
    case 'screenshots':
      return {
        type: 'shots',
        title: heading || undefined,
        lead,
        shots: (p.shots ?? []).map((s: any) => ({ caption: textOf(s.caption), src: imageOf(s.image) })),
      };
    case 'feature_cards':
      return {
        type: 'cards',
        title: heading || undefined,
        lead,
        items: (p.cards ?? []).map((c: any) => ({
          title: textOf(c.title),
          body: textOf(c.body),
          detail: opt(c.detail),
          shot: imageOf(c.image),
          icon: opt(c.icon),
        })),
      };
    case 'steps':
      return {
        type: 'steps',
        title: heading || undefined,
        lead,
        steps: (p.steps ?? []).map((s: any) => textOf(s.label)).filter(Boolean),
      };
    case 'numbered_options':
      return {
        type: 'ways',
        title: heading || undefined,
        lead,
        items: (p.options ?? []).map((o: any) => ({
          title: textOf(o.title),
          body: textOf(o.body),
          points: listItemsOf(o.points),
          icon: opt(o.icon),
        })),
      };
    default:
      return null;
  }
}
