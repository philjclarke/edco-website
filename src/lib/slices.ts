/*
  Prismic components -> the site's block shapes (src/data/blocks.ts): the
  plain content components that share a background when they sit together
  (see Slices.astro). The rest render their own sections.
*/
import type { Slice } from '@prismicio/client';
import type { Block } from '@/data/blocks';
import { hrefOf, imageOf, listItemsOf, richHTML, textOf } from './prismic';
import { knownIcon } from './icons';

const opt = (s: string | null | undefined) => textOf(s) || undefined;
/** A grey or navy background sets the block apart; white shares the run's. */
const toneOf = (bg: unknown) => (bg === 'navy' ? 'dark' : bg === 'grey' ? 'mist' : undefined) as 'dark' | 'mist' | undefined;

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
        layout: p.layout === 'Heading beside text' ? 'beside' : p.layout === 'Wide' ? 'wide' : 'standard',
        size: p.text_size === 'Standard' ? 'standard' : 'large',
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
        tone: toneOf(p.background),
        layout: p.layout === 'Heading beside list' ? 'beside' : 'standard',
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
    case 'steps': {
      const href = hrefOf(p.button_link);
      return {
        type: 'steps',
        title: heading || undefined,
        lead,
        steps: (p.steps ?? []).map((s: any) => textOf(s.label)).filter(Boolean),
        after: opt(p.closing),
        button: href && textOf(p.button_label) ? { label: textOf(p.button_label), href } : undefined,
        tone: toneOf(p.background),
      };
    }
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
