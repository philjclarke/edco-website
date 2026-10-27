import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { client, richHTML } from './lib/prismic';
import { caseStudyFields } from './lib/editorial';

/*
  Case studies, from Prismic (type "case_study"). A small loader reads the
  published pages and hands them to Astro's content layer, so the templates
  keep using getCollection() and render() as before. The schema below still
  validates every entry. (Insights and opinion are pages built from
  components, read through src/lib/pages.ts.)
*/

const fromPrismic = (type: string, toData: (d: Record<string, any>) => Record<string, unknown>): Loader => ({
  name: `prismic-${type}`,
  async load({ store, parseData }) {
    store.clear();
    for (const doc of await client.getAllByType(type)) {
      const data = await parseData({ id: doc.uid!, data: toData(doc.data) });
      store.set({ id: doc.uid!, data, rendered: { html: richHTML(doc.data.body) } });
    }
  },
});

const caseStudies = defineCollection({
  loader: fromPrismic('case_study', caseStudyFields),
  /* Brief §56: organised around what the customer was trying to achieve, never
     around EdCo's internal departments. Every field is required so an
     incomplete case study cannot quietly ship. */
  schema: z.object({
    title: z.string(),
    client: z.string(),
    summary: z.string(),
    /* Which of the six outcome routes this case belongs under. */
    outcome: z.string(),
    objective: z.string(),
    discovered: z.string(),
    recommended: z.string(),
    did: z.array(z.string()),
    changed: z.string(),
    evidence: z.array(z.string()),
    testimonial: z.string(),
    status: z.enum(['placeholder', 'live']).default('placeholder'),
  }),
});

export const collections = { caseStudies };
