/*
  The page types, by section of the site. Read by the content models
  (models.ts) and by the site (src/lib/prismic.ts, src/lib/pages.ts).
  No imports: this file is read by both the site build and the Node scripts.
*/

/*
  The types, by section. `path` is where a page of the type lives on the
  site; src/lib/prismic.ts builds the link routes from it. `parent` is the
  breadcrumb above a page's heading.
*/
export const PAGE_TYPES = [
  // Top level: one page each, in the main menu.
  { id: 'home_page', label: 'Home', path: '/' },
  { id: 'outcomes_hub', label: 'What are you trying to achieve', path: '/what-are-you-trying-to-achieve/' },
  { id: 'products_hub', label: 'Products', path: '/products/' },
  { id: 'what_we_think_page', label: 'Insights & Opinion', path: '/insights/' },
  { id: 'capabilities_hub', label: 'Capabilities', path: '/capabilities/' },
  { id: 'about_page', label: 'About', path: '/about/' },
  { id: 'agencies_page', label: 'Agencies & Partners', path: '/agencies-and-partners/' },
  // The tier below: as many pages as each section needs.
  { id: 'outcome', label: 'Outcome', path: '/:uid/', parent: 'outcomes_hub', uidHint: 'e.g. reach-and-engage-educators' },
  { id: 'product', label: 'Product', path: '/products/:uid/', parent: 'products_hub', uidHint: 'e.g. education-iq' },
  { id: 'insights_section', label: 'Insights & Opinion section', path: '/insights/:uid/', parent: 'what_we_think_page', uidHint: 'e.g. what-were-hearing' },
  { id: 'capability', label: 'Capability', path: '/capabilities/:uid/', parent: 'capabilities_hub', uidHint: 'e.g. research' },
  { id: 'about_subpage', label: 'About page', path: '/about/:uid/', parent: 'about_page', uidHint: 'e.g. our-people' },
  { id: 'agencies_subpage', label: 'Agencies & Partners page', path: '/agencies-and-partners/:uid/', parent: 'agencies_page', uidHint: 'e.g. white-label' },
  // Pages not in the menu.
  { id: 'insight', label: 'Insight', path: '/insights/:uid/', parent: 'what_we_think_page', uidHint: 'e.g. what-mat-finance-leaders-are-telling-us', article: true },
  { id: 'opinion', label: 'Opinion', path: '/insights/:uid/', parent: 'what_we_think_page', uidHint: 'e.g. your-database-isnt-your-market', article: true },
  { id: 'provision_blueprint', label: 'Provision blueprint', path: '/provision-blueprints/:uid/', uidHint: 'e.g. careers-guidance' },
] as const satisfies readonly {
  id: string;
  label: string;
  path: string;
  parent?: string;
  uidHint?: string;
  article?: boolean;
}[];

export type PageTypeId = (typeof PAGE_TYPES)[number]['id'];

/** A page type's entry above, by its id. */
export const pageTypeOf = (id: string) => PAGE_TYPES.find((t) => t.id === id);
