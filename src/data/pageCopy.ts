/*
  Copy for the single-instance pages (homepage, hubs, About and so on) and the
  site settings, from Prismic. Each document is turned back into the shape
  the page templates read, using prismic/specs.ts.

  The published copy is read once per build. Pages read it through
  siteCopy() in src/lib/content.ts, which swaps in draft copy during a
  Prismic preview.
*/
import { client, imageOf } from '@/lib/prismic';
import { specs } from '../../prismic/specs';
import { shapeOf } from '../../prismic/shape';

const KEYS = {
  outcomes_hub: 'outcomesHub', products_hub: 'productsHub', capabilities_hub: 'capabilitiesHub',
  free_analysis_page: 'freeAnalysis', agencies_page: 'agencies', about_page: 'about', contact_page: 'contact',
  customer_page: 'customer', for_educators_page: 'forEducators', what_we_think_page: 'whatWeThink',
  case_studies_hub: 'caseStudies', search_page: 'search', not_found_page: 'notFound',
} as const;

export type PageKey = (typeof KEYS)[keyof typeof KEYS];
export interface SiteCopy {
  home: any;
  settings: any;
  /** Copy for each single-instance page, by the key the templates use. */
  pages: Record<PageKey, any>;
}

/** Every single-instance page and the settings, at a preview ref or published. */
export async function loadSiteCopy(ref?: string): Promise<SiteCopy> {
  const load = async (id: string) => {
    const spec = specs.find((s) => s.id === id)!;
    const data = (await client.getSingle(id, ref ? { ref } : {})).data;
    const shaped = shapeOf(spec, data);
    // The homepage is built from sections, and has a banner photo.
    if (id === 'home_page') Object.assign(shaped, { slices: data.slices ?? [], banner: imageOf(data.banner), bannerFocus: data.banner_focus || 'centre' });
    return shaped;
  };
  const ids = ['home_page', 'site_settings', ...Object.keys(KEYS)];
  const [home, settings, ...rest] = await Promise.all(ids.map(load));
  const pages = Object.fromEntries(Object.values(KEYS).map((k, i) => [k, rest[i]])) as SiteCopy['pages'];
  return { home, settings, pages };
}

export const published = await loadSiteCopy();
export const { home, settings, pages } = published;
