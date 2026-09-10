/*
  Capabilities. The brief (§11) called these a secondary route; EdCo have since
  asked for them back in the primary navigation under this name.

  All eight now have full pages. Education strategy and proposition development
  were dropped at EdCo's request — the first lives on as an outcome route at
  /education-strategy/, the second is covered inside Research.

  `page: false` still means "summary only, no detail page yet", and the hub
  renders a placeholder for any capability in that state.

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
