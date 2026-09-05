import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  Editorial content. These two schemas are the part of the site most likely to
  become CMS-managed first — they map onto a "post" and a "case study" content
  type more or less directly.
*/

const streams = ['what-were-hearing', 'opinion', 'research-and-insight'] as const;

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
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
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/case-studies' }),
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
