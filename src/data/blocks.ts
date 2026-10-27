/*
  A deliberately small block vocabulary. Page sections are rendered from these
  shapes, which keeps the pages consistent. Prismic slices are translated into
  them (src/lib/slices.ts), so the same components render content from Prismic
  and content still kept in code.
*/

import type { RemoteImage } from '@/lib/prismic';

/** A screenshot or card image: a key from src/data/screens.ts, or an image from Prismic. */
export type ImageRef = string | RemoteImage;

export type Block =
  /** `html` (rich text from Prismic) wins over `paras` when both are present. */
  | { type: 'prose'; paras: string[]; html?: string; title?: string }
  | {
      type: 'list';
      eyebrow?: string;
      title: string;
      items: string[];
      icons?: (string | undefined)[];
      /** A line under each item, by position. */
      explainers?: (string | undefined)[];
      lead?: string;
      columns?: 2 | 3;
      /** A background of its own; otherwise it shares the run's. */
      tone?: 'mist' | 'dark';
    }
  | { type: 'steps'; title?: string; lead?: string; steps: string[] }
  | { type: 'pull'; text: string; sub?: string }
  | {
      type: 'cards';
      title?: string;
      lead?: string;
      /** With `detail` or `shot`, each card expands to reveal them. */
      items: { title: string; body: string; detail?: string; shot?: ImageRef; icon?: string }[];
    }
  | { type: 'shots'; eyebrow?: string; title?: string; lead?: string; photo?: RemoteImage; shots: { caption: string; src?: ImageRef }[] }
  | {
      type: 'ways';
      title?: string;
      lead?: string;
      /** Numbered because they are a menu of options, not a sequence. */
      items: { title: string; body: string; points: string[]; icon?: string }[];
    };
