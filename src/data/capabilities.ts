/*
  Brief §11 — capabilities are a secondary route, not a principal navigation
  emphasis. Phase 1 builds the four most heavily cross-linked in full; the
  remaining six are summarised on /capabilities/ and get their own pages in
  phase 2. `page: false` means "summary only, no detail page yet".
*/

import type { ContentPage } from './blocks';

export interface Capability extends ContentPage {
  /** Whether a detail page is built in this phase. */
  page: boolean;
}

export const capabilities: Capability[] = [
  {
    page: true,
    slug: 'research',
    navLabel: 'Research',
    title: 'Need to know what educators think? Ask them.',
    standfirst: 'Tell us who you need to hear from.',
    summary:
      'We find the right educators, ask them the right questions, and tell you what it means.',
    lead: 'Headteachers. MAT leaders. SENDCOs. Teachers. School business leaders. FE professionals. Curriculum leaders. Or a very particular combination of them.',
    blocks: [
      {
        type: 'prose',
        paras: [
          'EdCo’s data, networks and relationships mean we can identify and recruit the right educators quickly. Then we can conduct the research, interpret what they tell us and help you decide what to do next.',
          'We lean towards qualitative work — interviews and focus groups — because that is where the useful surprises are. Surveys can validate or size what you find. They shouldn’t define your proposition.',
        ],
      },
      {
        type: 'steps',
        title: 'How it runs',
        steps: [
          'Define the question',
          'Find the right educators',
          'Recruit',
          'Listen',
          'Analyse',
          'Interpret',
          'Challenge',
          'Recommend',
        ],
      },
      {
        type: 'prose',
        title: 'You run the research. We’ll find the right people.',
        paras: [
          'Educator recruitment is available on its own. If you or your agency are running the study yourselves and just need the right headteachers, SENDCOs or trust CFOs in the room, that is a service you can buy independently.',
        ],
      },
      {
        type: 'pull',
        text: 'Don’t start with the campaign. Start with something worth talking about.',
        sub: 'A supplier wants relationships with MAT CFOs. We could send a campaign. Or we could research what MAT CFOs are actually worried about, recruit them into the study, publish what we find, run an executive briefing around it, build an opted-in audience on the subject — and tell you which organisations are engaging. Now your sales team has something better than a cold lead. It has a reason to start a conversation.',
      },
      {
        type: 'list',
        title: 'Whose name goes on it is up to you',
        columns: 2,
        lead: 'EdCo does not need to be the hero.',
        items: ['EdCo branded', 'Client branded', 'Co-branded', 'Completely white-labelled'],
      },
    ],
    testimonialTheme: 'EdCo challenging the original brief',
    next: [
      { label: 'What We Think', href: '/what-we-think/', blurb: 'Research turned into a public argument.' },
      { label: 'Marketing Services', href: '/capabilities/marketing-services/', blurb: 'Getting the findings in front of people.' },
      { label: 'Events & CPD', href: '/capabilities/events-and-cpd/', blurb: 'The briefing that follows the report.' },
      { label: 'Education IQ', href: '/products/education-iq/', blurb: 'Who else looks like the people you just spoke to?' },
      { label: 'Understand education & educators', href: '/understand-education-and-educators/' },
      { label: 'Tell us what you’re trying to achieve', href: '/contact/' },
    ],
  },
  {
    page: true,
    slug: 'marketing-services',
    navLabel: 'Marketing Services',
    title: 'Start with what you want marketing to achieve.',
    standfirst: 'Sometimes the problem with your marketing isn’t your marketing.',
    summary:
      'Campaigns, content and channels — organised around your objective rather than our departments.',
    blocks: [
      {
        type: 'cards',
        title: 'What are you trying to get marketing to do?',
        items: [
          { title: 'Build brand awareness', body: 'Become known for something educators care about, not just known.' },
          { title: 'Generate leads', body: 'Reasons to talk, not just addresses to mail.' },
          { title: 'Build an opted-in audience', body: 'An audience you have permission to talk to again.' },
          { title: 'Recruit to events', body: 'Fill the room with the right people, not just the room.' },
          { title: 'Engage existing customers', body: 'The audience most organisations under-market to.' },
          { title: 'Launch something new', body: 'Ideally after we’ve checked somebody wants it.' },
          { title: 'Campaign around a specific need', body: 'One message, one problem, the right organisations.' },
          { title: 'Re-engage a dormant audience', body: 'Where there’s a genuine reason to get back in touch.' },
        ],
      },
      {
        type: 'prose',
        title: 'Channels are tools. They are not the strategy.',
        paras: [
          'Email, content, digital, paid media, creative, targeting and campaign management are all things we do well. None of them is a plan.',
          'If a campaign isn’t working, the campaign often isn’t the problem. The targeting may be fine and the proposition weak. We would rather tell you that before the money is spent than afterwards.',
        ],
      },
      { type: 'pull', text: 'Sending the wrong message to more schools doesn’t make it more right.' },
    ],
    testimonialTheme: 'EdCo challenging the original brief',
    next: [
      { label: 'Research', href: '/capabilities/research/', blurb: 'Something worth saying comes first.' },
      { label: 'Education IQ', href: '/products/education-iq/', blurb: 'Who should actually receive this?' },
      { label: 'Content creation', href: '/capabilities/content-creation/' },
      { label: 'Events & CPD', href: '/capabilities/events-and-cpd/' },
      { label: 'Reach & engage educators', href: '/reach-and-engage-educators/' },
      { label: 'Tell us what you’re trying to achieve', href: '/contact/' },
    ],
  },
  {
    page: true,
    slug: 'events-and-cpd',
    navLabel: 'Events & CPD',
    title: 'An event shouldn’t be a moment.',
    standfirst: 'Live → on-demand → content → ongoing relationship.',
    summary:
      'Events and CPD that create an asset and a reason to continue the relationship, not a good afternoon.',
    blocks: [
      {
        type: 'list',
        title: 'What we can take on',
        columns: 3,
        lead: 'All of it, or the parts you don’t want to do.',
        items: [
          'Concept and topic development',
          'Speakers',
          'Content',
          'Educator recruitment',
          'Promotion',
          'Registration',
          'Reminders',
          'Live delivery',
          'Physical events',
          'Virtual events',
          'Hybrid events',
          'Attendance tracking',
          'On-demand content',
          'Follow-up',
          'Engagement analysis',
        ],
      },
      {
        type: 'prose',
        title: 'The day is the smallest part of it',
        paras: [
          'A good event produces something that outlives it: a recording, a set of clips, an article, a resource, a group of people who have now heard you say something useful — and a record of who they were.',
          'That is the difference between an event and an engagement programme.',
        ],
      },
      { type: 'pull', text: 'Nobody wants your webinar. They might want the knowledge inside it.' },
    ],
    testimonialTheme: 'EdCo feeling like part of the client team',
    next: [
      { label: 'Content creation', href: '/capabilities/content-creation/' },
      { label: 'Marketing Services', href: '/capabilities/marketing-services/', blurb: 'Filling the room.' },
      { label: 'The Curriculum Network', href: '/products/the-curriculum-network/' },
      { label: 'International Schools Network', href: '/products/international-schools-network/' },
      { label: 'Build your reputation & audience', href: '/build-your-reputation-and-audience/' },
      { label: 'Tell us what you’re trying to achieve', href: '/contact/' },
    ],
  },
  {
    page: true,
    slug: 'data-services',
    navLabel: 'Data Services',
    title: 'Data is the foundation. Understanding is the useful bit.',
    standfirst: 'Knowing who exists is useful. Knowing who matters is better.',
    summary:
      'Education organisation and contact data, cleansed, enriched, matched and connected to the systems you work in.',
    blocks: [
      {
        type: 'list',
        title: 'What we do with data',
        columns: 3,
        items: [
          'Education organisation data',
          'Contacts',
          'Data cleansing',
          'Validation',
          'Enrichment',
          'Integration',
          'Matching',
          'Segmentation',
          'Database management',
          'APIs',
          'Customer-data analysis',
        ],
      },
      {
        type: 'prose',
        title: 'We’ve been doing this for a long time',
        paras: [
          'EdCo has held and maintained education data for decades, and that capability still matters. It is the thing everything else stands on.',
          'But a large database is not, on its own, a proposition. The value is in what the data lets you understand and what you then do differently.',
        ],
      },
    ],
    testimonialTheme: 'EdCo understanding both education and the client’s business',
    next: [
      { label: 'Education IQ', href: '/products/education-iq/', blurb: 'The intelligence layer on top.' },
      { label: 'Free customer analysis', href: '/free-customer-analysis/', blurb: 'Data services applied to your own list.' },
      { label: 'Technology & integration', href: '/capabilities/technology-and-integration/' },
      { label: 'SPIRIT', href: '/products/spirit/' },
      { label: 'Grow & retain customers', href: '/grow-and-retain-customers/' },
      { label: 'Tell us what you’re trying to achieve', href: '/contact/' },
    ],
  },

  /* --- Phase 2 detail pages. Summarised on /capabilities/ for now. ------- */
  {
    page: false,
    slug: 'content-creation',
    navLabel: 'Content creation',
    title: 'Create something genuinely useful.',
    summary:
      'CPD, webinars, articles, guides, classroom resources, reports, videos, diagnostics and interactive tools. The organising principle isn’t format — it’s what problem this helps an educator understand or solve.',
    blocks: [],
    next: [],
  },
  {
    page: false,
    slug: 'csr-programmes',
    navLabel: 'CSR programmes',
    title: 'Education programmes that create genuine value.',
    summary:
      'From identifying educational need through to development, school recruitment, delivery and measurement — often working alongside your existing CSR agency, never around it.',
    blocks: [],
    next: [],
  },
  {
    page: false,
    slug: 'education-strategy',
    navLabel: 'Education strategy',
    title: 'Diagnose before you prescribe.',
    summary:
      'The critical-friend engagement: research, interviews, market intelligence, proposition development and route to market, before anyone spends money doing things.',
    blocks: [],
    next: [],
  },
  {
    page: false,
    slug: 'proposition-development',
    navLabel: 'Proposition development',
    title: 'Your product is fascinating to you.',
    summary:
      'Their problem is fascinating to them. We help you work out what you are actually offering educators, and whether it lands.',
    blocks: [],
    next: [],
  },
  {
    page: false,
    slug: 'technology-and-integration',
    navLabel: 'Technology & integration',
    title: 'Sometimes making things work better means making things work together.',
    summary:
      'APIs, system and CRM integration, data flows, automation, intelligent tools and technical consultancy. Technology should solve the problem, not become the project.',
    blocks: [],
    next: [],
  },
  {
    page: false,
    slug: 'bespoke-technology',
    navLabel: 'Bespoke technology',
    title: 'Need something that doesn’t exist? We build things too.',
    summary:
      'Discover → define → build → launch → operate → improve. EdCo built Navigate, now used by more than 250,000 post-16 students. Where agreed, the product and the IP are yours.',
    blocks: [],
    next: [],
  },
];

export const capabilityPages = capabilities.filter((c) => c.page);
export const capabilityBySlug = Object.fromEntries(capabilityPages.map((c) => [c.slug, c]));
