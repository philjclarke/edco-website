/*
  One-off: lift the copy that was written inline in page templates into
  src/data/copy/pages.json, so every word on the site is reachable from the
  copy deck rather than an arbitrary subset of it.

  Handles the shapes actually used: Layout/PageHero/SectionHead/CtaBand props,
  and text nodes inside headings and paragraphs that contain no markup or
  expressions. Anything with a {expression} in it is left alone — those are
  already reading from data.
*/
import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const PAGES = [
  ['what-are-you-trying-to-achieve.astro', 'outcomesHub', 'What are you trying to achieve?'],
  ['products/index.astro', 'productsHub', 'Products hub'],
  ['capabilities/index.astro', 'capabilitiesHub', 'Capabilities hub'],
  ['free-customer-analysis.astro', 'freeAnalysis', 'Free customer analysis'],
  ['agencies-and-partners.astro', 'agencies', 'Agencies & Partners'],
  ['about.astro', 'about', 'About EdCo'],
  ['contact.astro', 'contact', 'Contact'],
  ['customer.astro', 'customer', 'Customer login'],
  ['for-educators.astro', 'forEducators', 'For educators'],
  ['what-we-think/index.astro', 'whatWeThink', 'What We Think hub'],
  ['case-studies/index.astro', 'caseStudies', 'Case studies hub'],
  ['search.astro', 'search', 'Search'],
  ['404.astro', 'notFound', 'Page not found'],
];

const PROP_COMPONENTS = ['Layout', 'PageHero', 'SectionHead', 'CtaBand'];
const PROPS = ['title', 'description', 'eyebrow', 'standfirst', 'lead', 'body', 'ctaLabel'];

const values = {};
const order = [];

function add(pageKey, key, value) {
  const full = `${pageKey}.${key}`;
  values[pageKey] ??= {};
  if (values[pageKey][key] !== undefined) return null; // already taken
  values[pageKey][key] = value;
  order.push(full);
  return key;
}

for (const [file, pageKey] of PAGES) {
  const path = `src/pages/${file}`;
  let src = await readFile(path, 'utf8');
  const counters = {};
  const next = (role) => {
    counters[role] = (counters[role] ?? 0) + 1;
    return counters[role] === 1 ? role : `${role}${counters[role]}`;
  };

  // 1. Props on the known components.
  for (const comp of PROP_COMPONENTS) {
    const re = new RegExp(`<${comp}\\b[\\s\\S]*?(?:/>|>)`, 'g');
    src = src.replace(re, (tag) => {
      let updated = tag;
      for (const prop of PROPS) {
        const pm = new RegExp(`\\b${prop}="([^"]{4,})"`).exec(updated);
        if (!pm) continue;
        const role = comp === 'Layout' ? (prop === 'title' ? 'metaTitle' : 'metaDescription') : `${comp === 'PageHero' ? 'hero' : comp === 'CtaBand' ? 'cta' : 'section'}${prop[0].toUpperCase()}${prop.slice(1)}`;
        const key = add(pageKey, next(role), pm[1]);
        if (key) updated = updated.replace(pm[0], `${prop}={copy.${pageKey}.${key}}`);
      }
      return updated;
    });
  }

  // 2. Text nodes in headings and paragraphs, with no markup or expressions.
  src = src.replace(
    /(<(h1|h2|h3|p)\b[^>]*>)([^<>{}]{20,}?)(<\/\2>)/g,
    (whole, open, tag, text, close) => {
      const clean = text.replace(/\s+/g, ' ').trim();
      if (!clean || !/[a-z]/i.test(clean)) return whole;
      const role = tag === 'p' ? 'body' : 'heading';
      const key = add(pageKey, next(role), clean);
      return key ? `${open}{copy.${pageKey}.${key}}${close}` : whole;
    }
  );

  // 3. Make the page read from the JSON.
  if (values[pageKey] && !src.includes("@/data/copy/pages.json")) {
    src = src.replace(/^---\n/, "---\nimport copy from '@/data/copy/pages.json';\n");
  }
  await writeFile(path, src);
  console.log(`${file.padEnd(40)} ${Object.keys(values[pageKey] ?? {}).length} strings`);
}

await writeFile('src/data/copy/pages.json', JSON.stringify(values, null, 2) + '\n');
console.log(`\ntotal: ${order.length} strings -> src/data/copy/pages.json`);
