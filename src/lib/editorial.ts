/*
  Insights articles and case studies: Prismic document -> the entry shape the
  templates read. Used by the content collections (src/content.config.ts)
  for the static site, and by the preview route for drafts.
*/
import type { PrismicDocument } from '@prismicio/client';
import { hrefOf, richHTML, textOf } from './prismic';

const items = (g: unknown, key: string) =>
  (Array.isArray(g) ? g : []).map((x) => textOf(x?.[key])).filter(Boolean);

/** Article fields as the `articles` collection stores them (date still a string; the schema coerces it). */
export const articleFields = (d: Record<string, any>) => ({
  title: textOf(d.title),
  stream: d.stream,
  summary: textOf(d.summary),
  date: d.date,
  author: textOf(d.author) || undefined,
  themes: items(d.themes, 'theme'),
  status: d.status ?? 'live',
});

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

/** A draft article or case study, shaped like a collection entry, for previews. */
export function articleEntry(doc: PrismicDocument) {
  const data = articleFields(doc.data);
  return { id: doc.uid!, data: { ...data, date: new Date(data.date) }, html: richHTML(doc.data.body) };
}
export function caseStudyEntry(doc: PrismicDocument) {
  return { id: doc.uid!, data: caseStudyFields(doc.data), html: richHTML(doc.data.body) };
}
