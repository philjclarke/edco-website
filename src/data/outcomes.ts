/*
  Brief §10, §11, §21–§26 — the six outcome routes.
  These are the spine of the site: the visitor self-selects by objective, not
  by EdCo's org chart.

  Content lives in Prismic (page type "outcome"); see sectionPages.ts.
*/
import { loadSection, type SectionPage } from './sectionPages';
import { hrefOf, textOf } from '@/lib/prismic';

export type Outcome = SectionPage;

export const outcomes: Outcome[] = await loadSection('outcome');
export const outcomeBySlug = Object.fromEntries(outcomes.map((o) => [o.slug, o]));

/** Every product, capability and outcome page, by its address. */
export async function sectionPageByHref() {
  const [{ products }, { capabilities }] = await Promise.all([import('./products'), import('./capabilities')]);
  return new Map([...products, ...capabilities, ...outcomes].map((p) => [p.href, p]));
}

/** An outcome's example route, from its How we do it section in Prismic. */
export function routeOf(outcome: Outcome | undefined) {
  const s = (outcome?.doc.data.slices as any[] | undefined)?.find((x) => x.slice_type === 'how_we_do_it');
  if (!s) return undefined;
  const steps = (s.primary.steps ?? []).filter((x: any) => textOf(x.label));
  return {
    objective: textOf(s.primary.heading),
    steps: steps.map((x: any) => textOf(x.label)) as string[],
    stepHrefs: steps.map((x: any) => hrefOf(x.link)) as (string | null)[],
  };
}
