/* Brief §46–§49. Three clearly differentiated editorial voices — the
   distinction has to stay clear, so it is described in one place.
   Words in ./copy/streams.json — see outcomes.ts for the rationale. */

import data from './copy/streams.json';

export interface Stream {
  slug: string;
  label: string;
  question: string;
  title: string;
  lead: string;
  note: string;
}

export const streams: Stream[] = data;

export type StreamSlug = string;
export const streamBySlug = Object.fromEntries(streams.map((s) => [s.slug, s]));
