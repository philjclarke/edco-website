/*
  Brief §11 — capabilities are a secondary route, not a principal navigation
  emphasis. Phase 1 builds the seven that other pages actually link to; the
  remaining three are summarised on /capabilities/ and get their own pages in
  phase 2. `page: false` means "summary only, no detail page yet".

  Words in ./copy/capabilities.json — see outcomes.ts for the rationale.
*/

import type { ContentPage } from './blocks';
import data from './copy/capabilities.json';

export interface Capability extends ContentPage {
  /** Whether a detail page is built in this phase. */
  page: boolean;
}

export const capabilities: Capability[] = data as Capability[];

export const capabilityPages = capabilities.filter((c) => c.page);
export const capabilityBySlug = Object.fromEntries(capabilityPages.map((c) => [c.slug, c]));
