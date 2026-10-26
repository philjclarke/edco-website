import { defineCollection, z } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { client, richHTML } from './lib/prismic';
import { articleFields, caseStudyFields } from './lib/editorial';

/*
  Editorial content, from Prismic (types "article" and "case_study"). A
  small loader per collection reads the published pages and hands them to
  Astro's content layer, so the templates keep using getCollection() and
  render() as before. The schemas below still validate every entry.
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

const streams = ['what-were-hearing', 'opinion', 'research-and-insight'] as const;

const articles = defineCollection({
  loader: fromPrismic('article', articleFields),
  schema: z.object({
    title: z.string(),
    /* Brief §46: three clearly differentiated editorial voices. */
    stream: z.enum(streams),
    summary: z.string(),
    date: z.coerce.date(),
    /* Brief §47: What We're Hearing is the institutional voice, no named author.
       Brief §48: Opinion is attributed. */
    author: z.string().optional(),
    /* Tagged for search and for the personalisation the brief defers (§65). */
    themes: z.array(z.string()).default([]),
    /* 'sample' renders a visible banner: written to demonstrate the template,
       not approved as EdCo's published position. */
    status: z.enum(['sample', 'live']).default('sample'),
  }),
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

export const collections = { articles, caseStudies };
