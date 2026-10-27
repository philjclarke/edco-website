/*
  Case studies: Prismic document -> the entry shape the templates read. Used by the content collections (src/content.config.ts)
  for the static site, and by the preview route for drafts.
*/
import type { PrismicDocument } from '@prismicio/client';
import { hrefOf, richHTML, textOf } from './prismic';

const items = (g: unknown, key: string) =>
  (Array.isArray(g) ? g : []).map((x) => textOf(x?.[key])).filter(Boolean);

export const caseStudyFields = (d: Record<string, any>) => ({
  title: textOf(d.title),
  client: textOf(d.client),
  summary: textOf(d.summary),
  // The outcome page it belongs under, by its address (/grow-and-retain-customers/ -> grow-and-retain-customers).
  outcome: (hrefOf(d.outcome) ?? '').replace(/\//g, ''),
  objective: textOf(d.objective),
  discovered: textOf(d.discovered),
  recommended: textOf(d.recommended),
  did: items(d.did, 'text'),
  changed: textOf(d.changed),
  evidence: items(d.evidence, 'text'),
  testimonial: textOf(d.testimonial),
  status: d.status ?? 'placeholder',
});

/** A draft case study, shaped like a collection entry, for previews. */
export function caseStudyEntry(doc: PrismicDocument) {
  return { id: doc.uid!, data: caseStudyFields(doc.data), html: richHTML(doc.data.body) };
}
