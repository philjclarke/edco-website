/*
  Site-level content. Everything here is a candidate CMS "singleton" —
  global settings, navigation, footer. Kept in one place so that when a CMS
  is chosen this becomes one document rather than a hunt through templates.
*/

export const site = {
  name: 'The Education Company',
  shortName: 'EdCo',
  category: 'Education Intelligence & Engagement',
  primaryCta: { label: 'Tell us what you’re trying to achieve', href: '/contact/' },
  secondaryCta: { label: 'See how EdCo works', href: '/#how-edco-works' },
} as const;

/* Verify before launch — carried over from the current site. */
export const contact = {
  address: ['Denne Court, Hengist Field', 'Oad Street, Borden', 'Kent ME9 8LT'],
  phone: '01634 766920',
  phoneHref: 'tel:+441634766920',
  email: '[EMAIL TO CONFIRM]',
};

export type NavLink = { label: string; href: string; blurb?: string };
export type NavGroup = { label: string; href: string; children?: NavLink[] };

/*
  The main menu is built from Prismic (src/lib/menu.ts). It is deliberately
  outcome-led: the brief is explicit that visitors must not have to
  understand EdCo's org chart to find help, so "What are you trying to
  achieve?" comes before Products. That order is fixed, in
  prismic/pageTypes.ts; what goes under each section is ticked in Prismic.
*/

export const utilityNav: NavLink[] = [
  { label: 'For Educators', href: '/for-educators/' },
  { label: 'Customer login', href: '/customer/' },
  { label: 'Search', href: '/search/' },
];

/*
  The footer lists the pages under these main menu sections, in this order,
  each followed by its extra links here.
*/
export const footerExtras: Record<string, NavLink[]> = {
  outcomes_hub: [],
  products_hub: [],
  capabilities_hub: [
    { label: 'All capabilities', href: '/capabilities/' },
    { label: 'Free customer analysis', href: '/free-customer-analysis/' },
  ],
};

export const footerEdCo: { heading: string; links: NavLink[] } = {
  heading: 'EdCo',
  links: [
    { label: 'About EdCo', href: '/about/' },
    { label: 'Insights & Opinion', href: '/insights/' },
    { label: 'Case studies', href: '/case-studies/' },
    { label: 'Agencies & Partners', href: '/agencies-and-partners/' },
    { label: 'For Educators', href: '/for-educators/' },
    { label: 'Customer login', href: '/customer/' },
    { label: 'Contact', href: '/contact/' },
  ],
};
