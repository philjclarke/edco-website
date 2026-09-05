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
  Navigation is deliberately outcome-led. The brief is explicit that visitors
  must not have to understand EdCo's org chart to find help, so "What are you
  trying to achieve?" comes before Products.
*/
export const primaryNav: NavGroup[] = [
  {
    label: 'What are you trying to achieve?',
    href: '/what-are-you-trying-to-achieve/',
    children: [
      { label: 'Understand education & educators', href: '/understand-education-and-educators/' },
      { label: 'Build your reputation & audience', href: '/build-your-reputation-and-audience/' },
      { label: 'Reach & engage educators', href: '/reach-and-engage-educators/' },
      { label: 'Generate leads & build pipeline', href: '/generate-leads-and-build-pipeline/' },
      { label: 'Grow & retain customers', href: '/grow-and-retain-customers/' },
      { label: 'Get your education strategy right', href: '/education-strategy/' },
    ],
  },
  {
    label: 'Products',
    href: '/products/',
    children: [
      { label: 'Education IQ', href: '/products/education-iq/' },
      { label: 'EdNet', href: '/products/ednet/' },
      { label: 'SPIRIT', href: '/products/spirit/' },
      { label: 'International Schools Network', href: '/products/international-schools-network/' },
      { label: 'The Curriculum Network', href: '/products/the-curriculum-network/' },
    ],
  },
  {
    label: 'What We Think',
    href: '/what-we-think/',
    children: [
      { label: 'What we’re hearing', href: '/what-we-think/what-were-hearing/' },
      { label: 'Opinion', href: '/what-we-think/opinion/' },
      { label: 'Research & insight', href: '/what-we-think/research-and-insight/' },
    ],
  },
  { label: 'For Educators', href: '/for-educators/' },
  { label: 'About', href: '/about/' },
  { label: 'Agencies & Partners', href: '/agencies-and-partners/' },
];

export const utilityNav: NavLink[] = [
  { label: 'Customer login', href: '/customer/' },
  { label: 'Search', href: '/search/' },
];

export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: 'What are you trying to achieve?',
    links: primaryNav[0].children!,
  },
  {
    heading: 'Products',
    links: primaryNav[1].children!,
  },
  {
    heading: 'What we do',
    links: [
      { label: 'Research', href: '/capabilities/research/' },
      { label: 'Marketing Services', href: '/capabilities/marketing-services/' },
      { label: 'Events & CPD', href: '/capabilities/events-and-cpd/' },
      { label: 'Data Services', href: '/capabilities/data-services/' },
      { label: 'All capabilities', href: '/capabilities/' },
      { label: 'Free customer analysis', href: '/free-customer-analysis/' },
    ],
  },
  {
    heading: 'EdCo',
    links: [
      { label: 'About EdCo', href: '/about/' },
      { label: 'What We Think', href: '/what-we-think/' },
      { label: 'Case studies', href: '/case-studies/' },
      { label: 'Agencies & Partners', href: '/agencies-and-partners/' },
      { label: 'Customer login', href: '/customer/' },
      { label: 'Contact', href: '/contact/' },
    ],
  },
];
