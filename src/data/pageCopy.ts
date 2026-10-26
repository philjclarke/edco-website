/*
  Copy for the single-instance pages (homepage, hubs, About and so on) and the
  site settings, from Prismic. Each document is turned back into the shape
  the page templates read, using prismic/specs.ts. Read once per build.
*/
import { client } from '@/lib/prismic';
import { specs } from '../../prismic/specs';
import { shapeOf } from '../../prismic/shape';

async function load(id: string) {
  const spec = specs.find((s) => s.id === id);
  if (!spec) throw new Error(`No spec for ${id}`);
  const doc = await client.getSingle(id);
  return shapeOf(spec, doc.data);
}

const [home, settings, ...rest] = await Promise.all([
  load('home_page'),
  load('site_settings'),
  load('outcomes_hub'),
  load('products_hub'),
  load('capabilities_hub'),
  load('free_analysis_page'),
  load('agencies_page'),
  load('about_page'),
  load('contact_page'),
  load('customer_page'),
  load('for_educators_page'),
  load('what_we_think_page'),
  load('case_studies_hub'),
  load('search_page'),
  load('not_found_page'),
]);

const KEYS = [
  'outcomesHub', 'productsHub', 'capabilitiesHub', 'freeAnalysis', 'agencies', 'about', 'contact',
  'customer', 'forEducators', 'whatWeThink', 'caseStudies', 'search', 'notFound',
] as const;

/** Copy for each single-instance page, by the key the templates use. */
export const pages = Object.fromEntries(KEYS.map((k, i) => [k, rest[i]])) as Record<(typeof KEYS)[number], any>;
export { home, settings };
