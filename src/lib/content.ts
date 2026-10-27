/*
  Content as the current request should see it: published content normally,
  and draft content while an editor is previewing in Prismic
  (Astro.locals.prismicPreview, set by src/pages/preview/).

  Pages and components call these with Astro.locals instead of importing
  content directly, so the same templates render both the static site and
  previews. Drafts are fetched once per request and never shared between
  requests, so a reload after saving in Prismic always shows the latest.
*/
import { published, loadSiteCopy, type SiteCopy } from '@/data/pageCopy';

const perRequest = new WeakMap<object, Promise<SiteCopy>>();

export function siteCopy(locals?: App.Locals): Promise<SiteCopy> {
  const ref = locals?.prismicPreview?.ref;
  if (!locals || !ref) return Promise.resolve(published);
  if (!perRequest.has(locals)) perRequest.set(locals, loadSiteCopy(ref));
  return perRequest.get(locals)!;
}

/** The site settings, in the shapes model.ts and proof.ts export. */
export async function siteSettings(locals?: App.Locals) {
  const s = (await siteCopy(locals)).settings;
  return {
    edcoModel: s.edcoModel as { name: string; summary: string; methods: string[]; icon?: string }[],
    proofStats: s.proofStats as { value: string; label: string; verified?: boolean }[],
    logoCandidates: s.logoCandidates as string[],
    testimonialThemes: s.testimonialThemes as string[],
    caseStudyThemes: s.caseStudyThemes as string[],
  };
}

/** The page's published address, also while previewing (previews live under /preview/). */
export const pagePath = (locals: App.Locals | undefined, url: URL) => locals?.prismicPreview?.path ?? url.pathname;
