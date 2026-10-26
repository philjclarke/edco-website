/*
  One-off import of everything the first migration didn't cover: the
  single-instance pages (homepage, hubs, About and so on), site settings,
  Insights articles and case studies. Run with:

    node --env-file=.env prismic/migrate-rest.ts

  Single-instance pages and settings are mapped through prismic/specs.ts,
  the same spec the site reads them back with. Articles and case studies are
  converted from their Markdown files. Refuses to run if any of these types
  already has published content.
*/

import { readFileSync, readdirSync } from 'node:fs';
import * as prismic from '@prismicio/client';
import { htmlAsRichText } from '@prismicio/migrate';
import { marked } from 'marked';
import matter from 'gray-matter';
import { specs, type Group } from './specs.ts';

const repo = process.env.PRISMIC_REPOSITORY!;
const writeClient = prismic.createWriteClient(repo, { writeToken: process.env.PRISMIC_WRITE_TOKEN! });
const client = prismic.createClient(repo);
const migration = prismic.createMigration();
const LANG = 'en-gb';
const SITE = 'https://www.educationcompany.co.uk';
const root = new URL('../', import.meta.url);
const read = (p: string) => readFileSync(new URL(p, root), 'utf8');
const json = (f: string) => JSON.parse(read(`src/data/copy/${f}.json`));

for (const type of [...specs.map((s) => s.id), 'article', 'case_study']) {
  const existing = await writeClient.getAllByType(type).catch(() => []);
  if (existing.length) {
    console.error(`Prismic already has published ${type} content; not importing again.`);
    process.exit(1);
  }
}

/* ---------- values ---------- */

const outcomeSlugs = new Set(json('outcomes').map((o: { slug: string }) => o.slug));

/** A site path as a Prismic link: a page link where the page is in Prismic, otherwise a web address. */
function linkTo(href: string) {
  const doc = (type: string, uid: string) => async () => client.getByUID(type, uid);
  let m = /^\/products\/([^/]+)\/$/.exec(href);
  if (m) return doc('product', m[1]);
  m = /^\/capabilities\/([^/]+)\/$/.exec(href);
  if (m) return doc('capability', m[1]);
  m = /^\/([^/]+)\/$/.exec(href);
  if (m && outcomeSlugs.has(m[1])) return doc('outcome', m[1]);
  return { link_type: 'Web', url: href.startsWith('/') ? SITE + href : href };
}

const oneLine = (s: unknown) => (typeof s === 'string' ? s.replace(/\s*\n\s*/g, ' ') : '');
const get = (obj: any, path: string) => path.split('.').reduce((o, k) => o?.[k], obj);
const listItems = (items: string[]) => items.map((t) => ({ type: 'list-item', text: t, spans: [] }));

function value(kind: string, v: any) {
  if (kind === 'text') return oneLine(v);
  if (kind === 'link') return v ? linkTo(v) : { link_type: 'Any' };
  if (kind === 'boolean') return Boolean(v);
  return listItems(v ?? []);
}

function groupValue(g: Group, src: any) {
  if (g.split) {
    const lists = Object.fromEntries(Object.entries(g.split).map(([k, p]) => [k, get(src, p) ?? []]));
    const n = Math.max(...Object.values(lists).map((l: any) => l.length));
    return Array.from({ length: n }, (_, i) => Object.fromEntries(Object.keys(g.fields).map((k) => [k, oneLine(lists[k]?.[i])])));
  }
  const items = get(src, g.path) ?? [];
  if (g.strings) return items.map((t: string) => ({ text: oneLine(t) }));
  return items.map((it: any) =>
    Object.fromEntries(Object.entries(g.fields).map(([k, f]) => [k, value(f.kind, it[f.key ?? k])]))
  );
}

/* ---------- single-instance pages and settings ---------- */

const pages = json('pages');
const PAGE_KEY: Record<string, string> = {
  outcomes_hub: 'outcomesHub', products_hub: 'productsHub', capabilities_hub: 'capabilitiesHub',
  free_analysis_page: 'freeAnalysis', agencies_page: 'agencies', about_page: 'about', contact_page: 'contact',
  customer_page: 'customer', for_educators_page: 'forEducators', what_we_think_page: 'whatWeThink',
  case_studies_hub: 'caseStudies', search_page: 'search', not_found_page: 'notFound',
};
const model = json('model');
const proof = json('proof');
const settings = {
  edcoModel: model.edcoModel, beliefs: model.beliefs, proofStats: proof.proofStats,
  logoCandidates: proof.logoCandidates, testimonialThemes: proof.testimonialThemes,
  caseStudyThemes: proof.caseStudyThemes, streams: json('streams'),
};
const sourceFor = (id: string) => (id === 'home_page' ? json('home') : id === 'site_settings' ? settings : pages[PAGE_KEY[id]]);

for (const spec of specs) {
  const src = sourceFor(spec.id);
  if (!src) throw new Error(`No source for ${spec.id}`);
  const data = Object.fromEntries(
    Object.entries(spec.fields).map(([fid, f]) => [fid, f.kind === 'group' ? groupValue(f, src) : value(f.kind, get(src, f.path))])
  );
  migration.createDocument({ type: spec.id, lang: LANG, data } as any, spec.label);
}

/* ---------- Markdown -> rich text ---------- */

function richText(markdown: string) {
  // Site-relative links become absolute; the site turns them back on display.
  const html = (marked.parse(markdown, { async: false }) as string).replace(/href="\//g, `href="${SITE}/`);
  const { result, warnings } = htmlAsRichText(html);
  if (warnings.length) console.warn('rich text warnings:', warnings);
  return result;
}

const dir = (d: string) => readdirSync(new URL(d, root)).filter((f) => /\.mdx?$/.test(f));

for (const file of dir('src/content/articles/')) {
  const { data: fm, content } = matter(read(`src/content/articles/${file}`));
  migration.createDocument(
    {
      type: 'article',
      uid: file.replace(/\.mdx?$/, ''),
      lang: LANG,
      data: {
        title: fm.title,
        stream: fm.stream,
        summary: fm.summary,
        date: new Date(fm.date).toISOString().slice(0, 10),
        author: fm.author ?? '',
        status: fm.status ?? 'live',
        body: richText(content),
        themes: (fm.themes ?? []).map((theme: string) => ({ theme })),
      },
    } as any,
    fm.title
  );
}

for (const file of dir('src/content/case-studies/')) {
  const { data: fm, content } = matter(read(`src/content/case-studies/${file}`));
  migration.createDocument(
    {
      type: 'case_study',
      uid: file.replace(/\.mdx?$/, ''),
      lang: LANG,
      data: {
        title: fm.title,
        client: fm.client,
        summary: fm.summary,
        outcome: async () => client.getByUID('outcome', fm.outcome),
        status: fm.status ?? 'placeholder',
        objective: fm.objective,
        discovered: fm.discovered,
        recommended: fm.recommended,
        did: (fm.did ?? []).map((text: string) => ({ text })),
        changed: fm.changed,
        evidence: (fm.evidence ?? []).map((text: string) => ({ text })),
        testimonial: fm.testimonial,
        body: richText(content),
      },
    } as any,
    file.replace(/\.mdx?$/, '')
  );
}

await writeClient.migrate(migration, {
  reporter: (e: any) => {
    if (/:(created|updated)$|^end$/.test(e.type)) console.log(e.type);
  },
});
console.log('Imported into the migration release. Publishing…');
await writeClient.publishMigrationRelease();
console.log('Published.');
