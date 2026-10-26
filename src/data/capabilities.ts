/*
  Capabilities. The brief (§11) called these a secondary route; EdCo have since
  asked for them back in the primary navigation under this name.

  Content lives in Prismic (page type "capability"); see sectionPages.ts.
  Every capability in Prismic has a page, so `page` is always true. It stays
  so the hub keeps its placeholder for any capability that has no page yet.
*/
import { loadSection, type SectionPage } from './sectionPages';

export type Capability = SectionPage & { page: boolean };

export const capabilities: Capability[] = (await loadSection('capability')).map((c) => ({ ...c, page: true }));
export const capabilityPages = capabilities.filter((c) => c.page);
export const capabilityBySlug = Object.fromEntries(capabilityPages.map((c) => [c.slug, c]));
