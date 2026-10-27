/*
  Brief §10, §11, §21–§26 — the six outcome routes.
  These are the spine of the site: the visitor self-selects by objective, not
  by EdCo's org chart.

  Content lives in Prismic (page type "outcome"); see sectionPages.ts.
*/
import { loadSection, type SectionPage } from './sectionPages';
import { hrefOf, textOf } from '@/lib/prismic';
import { products } from './products';
import { capabilities } from './capabilities';

export type Outcome = SectionPage;

export const outcomes: Outcome[] = await loadSection('outcome');
export const outcomeBySlug = Object.fromEntries(outcomes.map((o) => [o.slug, o]));

/** Every product, capability and outcome page, by its address. */
export async function sectionPageByHref() {
  return new Map([...products, ...capabilities, ...outcomes].map((p) => [p.href, p]));
}

/**
 * An outcome's How we do it: its heading and the products and capabilities
 * picked for it, by their panel titles and addresses. Used wherever the
 * outcome's route is shown away from its own page (the outcomes hub, case studies).
 */
export function routeOf(outcome: Outcome | undefined) {
  const s = (outcome?.doc.data.slices as any[] | undefined)?.find((x) => x.slice_type === 'how_we_do_it');
  if (!s) return undefined;
  const byHref = new Map([...products, ...capabilities].map((p) => [p.href, p]));
  const pages = (s.primary.pages ?? []).map((x: any) => byHref.get(hrefOf(x.page) ?? '')).filter(Boolean) as SectionPage[];
  return {
    // The heading is written as the customer's words, in quotes; the routes add their own.
    objective: textOf(s.primary.heading).replace(/^[“"]|[”"]$/g, ''),
    steps: pages.map((p) => p.panel.title),
    stepHrefs: pages.map((p) => p.href) as (string | null)[],
  };
}
