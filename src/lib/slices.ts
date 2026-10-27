/*
  Prismic components -> the site's block shapes (src/data/blocks.ts): the
  plain content components that share a background when they sit together
  (see Slices.astro). The rest render their own sections.
*/
import type { Slice } from '@prismicio/client';
import type { Block } from '@/data/blocks';
import { imageOf, listItemsOf, richHTML, textOf } from './prismic';
import { knownIcon } from './icons';

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
        html: richHTML(p.body),
      };
    case 'item_list': {
      const items = (p.items ?? []).filter((i: any) => textOf(i.text));
      return {
        type: 'list',
        eyebrow: opt(p.eyebrow),
        title: heading,
        lead,
        items: items.map((i: any) => textOf(i.text)),
        icons: items.map((i: any) => knownIcon(i.icon)),
        explainers: items.map((i: any) => opt(i.explainer)),
        tone: p.background === 'navy' ? 'dark' : p.background === 'grey' ? 'mist' : undefined,
      };
    }
    case 'screenshots':
      return {
        type: 'shots',
        eyebrow: opt(p.eyebrow),
        title: heading || undefined,
        lead,
        photo: imageOf(p.photo),
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
          icon: knownIcon(c.icon),
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
          icon: knownIcon(o.icon),
        })),
      };
    default:
      return null;
  }
}
