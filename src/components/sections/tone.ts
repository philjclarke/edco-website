/* A section's Background field, as a Section tone. */
export const toneOf = (bg: unknown) => (bg === 'navy' ? 'dark' : bg === 'grey' ? 'mist' : 'light') as 'dark' | 'mist' | 'light';

/** Deprecated slice types that render their own full-width section (see SectionSlice.astro). */
export const SECTION_SLICE_TYPES = new Set([
  'statement', 'comparison', 'figures', 'model', 'page_cards', 'link_words', 'logo_wall', 'latest_articles', 'link_cards', 'routes', 'cta_band',
]);
