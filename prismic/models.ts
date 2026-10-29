/*
  Prismic content models, in code.

  This file is the source of truth for what editors see in Prismic: the page
  types, their fields, and the components (Prismic calls them slices) pages
  are built from. Push it with:

    node --env-file=.env scripts/prismic.ts push

  The structure follows EdCo's component deck (Oct 2026, "EdCo Website
  Components"):

  - Every page type has the same anatomy. A Page tab holding nothing but its
    components, a Preview tab (how the page appears wherever another page
    links to it: How we do it panels, content listings, related links) and
    an SEO tab. The banner is a component too.
  - Each section of the site has its own types, a top-level page and the
    pages below it, even where they are identical today, so each can grow
    its own fields later without affecting the others.
  - The components are the deck's list. Components the site already had
    that aren't on it are kept as components in their own right; EdCo use
    them alongside the deck's.

  Typed against @prismicio/client's model types, so a model with the wrong
  shape fails the type check before it ever reaches Prismic.
*/

import type {
  CustomTypeModel,
  CustomTypeModelField,
  CustomTypeModelFieldForNestedGroup,
  SharedSliceModel,
} from '@prismicio/client';
import { specs, type Field, type Group, type Kind } from './specs.ts';
import { PAGE_TYPES } from './pageTypes.ts';

/* ---------- field helpers ---------- */

type Nested = CustomTypeModelFieldForNestedGroup;
type Fields = Record<string, CustomTypeModelField>;

const text = (label: string, placeholder?: string): Nested => ({
  type: 'Text',
  config: { label, placeholder },
});

/** Running text: paragraphs, bold, italic, links and bullet lists. */
const prose = (label: string, placeholder?: string, headings = false): Nested => ({
  type: 'StructuredText',
  config: {
    label,
    placeholder,
    multi: `paragraph,${headings ? 'heading2,heading3,' : ''}strong,em,hyperlink,list-item${headings ? ',o-list-item' : ''}`,
    allowTargetBlank: true,
  },
});

/** Bullet points only. */
const bullets = (label: string): Nested => ({
  type: 'StructuredText',
  config: { label, multi: 'list-item,strong,em' },
});

const image = (label: string): Nested => ({ type: 'Image', config: { label, constraint: {}, thumbnails: [] } });

/** Any link: another Prismic page, or a web address (including pages on this site). */
const link = (label: string, placeholder?: string): Nested => ({
  type: 'Link',
  config: { label, placeholder, select: null, allowTargetBlank: true },
});

/** A link to a page of one of these types. */
const pageLink = (label: string, customtypes: string[]): Nested => ({
  type: 'Link',
  config: { label, select: 'document', customtypes },
});

const select = <O extends string>(label: string, options: readonly O[], default_value?: O): Nested => ({
  type: 'Select',
  config: { label, options, default_value },
});

const boolean = (label: string, default_value: boolean, yes = 'Shown', no = 'Hidden'): Nested => ({
  type: 'Boolean',
  config: { label, default_value, placeholder_true: yes, placeholder_false: no },
});

const number = (label: string, placeholder?: string): Nested => ({ type: 'Number', config: { label, placeholder } });

const date = (label: string): Nested => ({ type: 'Date', config: { label } });

const group = (label: string, fields: Record<string, Nested>): CustomTypeModelField => ({
  type: 'Group',
  config: { label, fields },
});

const ICON_HINT = 'Icon name, e.g. fa6-solid:chart-simple (leave blank for none)';

const BACKGROUND = (default_value: 'white' | 'grey' | 'navy') =>
  select('Background', ['white', 'grey', 'navy'] as const, default_value);

/* ---------- page types (listed in pageTypes.ts) ---------- */

/** Types a How we do it panel can show. */
const PANEL_TYPES = ['product', 'capability'];
/** Every page type, for content listings. */
const LISTABLE = [...PAGE_TYPES.map((t) => t.id), 'case_study'];

/* ---------- components ---------- */

type Variation = { id: string; name: string; description: string; primary: Fields };

const slice = (id: string, name: string, description: string, primary: Fields | Variation[]): SharedSliceModel => ({
  type: 'SharedSlice',
  id,
  name,
  description,
  variations: (Array.isArray(primary) ? primary : [{ id: 'default', name: 'Default', description, primary }]).map((v) => ({
    id: v.id,
    name: v.name,
    docURL: '...',
    version: 'initial',
    description: v.description,
    imageUrl: '',
    primary: v.primary as SharedSliceModel['variations'][number]['primary'],
  })),
});

/** The small label above a section's heading, as the deck calls it. */
const sectionHeader = (placeholder = 'Optional, e.g. How we do it') => text('Section header text', placeholder);

const TESTIMONIAL_THEMES = [
  'EdCo challenging the original brief',
  'EdCo understanding both education and the client’s business',
  'EdCo feeling like part of the client team',
  'a long-term relationship',
  'working with EdCo',
] as const;

const bannerFields = {
  eyebrow: text('Small label', 'Leave blank to show the breadcrumb (or the page title on a top-level page)'),
  title: text('Title', 'The page heading'),
  positioning: text('Positioning statement', 'The one line that carries the argument'),
  intro: text('Introduction text'),
  image: image('Banner image'),
  image_focus: select('Banner crop', ['centre', 'left', 'right'] as const, 'centre'),
};

/** The deck's components, in its order. */
export const components: SharedSliceModel[] = [
  slice('banner', 'Banner', 'The top of the page: title, positioning statement, introduction text and banner image. Every page starts with one.', [
    {
      id: 'default',
      name: 'Page',
      description: 'The banner for most pages.',
      primary: {
        ...bannerFields,
        size: select('Heading size', ['Standard', 'Large'] as const, 'Standard'),
        button_label: text('Button label', 'Optional, e.g. Visit Education IQ'),
        button_link: link('Button link', 'Leave blank to show a placeholder until the address is known'),
      },
    },
    {
      id: 'home',
      name: 'Homepage',
      description: 'The large homepage banner, with two buttons.',
      primary: {
        ...bannerFields,
        button_label: text('Button label'),
        button_link: link('Button link'),
        button2_label: text('Second button label'),
        button2_link: link('Second button link'),
      },
    },
  ]),

  slice('text_block', 'Explainer text', 'A header and running text, e.g. the page introduction.', {
    heading: text('Header', 'Optional'),
    body: prose('Text', undefined, true),
    layout: select('Layout', ['Standard', 'Heading beside text', 'Wide'] as const, 'Standard'),
    text_size: select('Text size', ['Large', 'Standard'] as const, 'Large'),
  }),

  slice('quote', 'Quote', 'A quote or engaging thought. Leave the text blank to show a mock quote until there’s a real one.', [
    {
      id: 'default',
      name: 'One column',
      description: 'A full-width band, centred.',
      primary: {
        header: text('Header', 'Optional small label above the quote'),
        text: text('Text', 'The line that carries the argument'),
        name: text('Footer: name', 'Who said it, shown in bold, e.g. Sam Example. With a name, the text gets quote marks'),
        footer: text('Footer: role and organisation', 'e.g. Head of Marketing, Example Trust. Without a name, a supporting line'),
      },
    },
    {
      id: 'two_column',
      name: 'Two column',
      description: 'A header on the left, the quote in a card on the right.',
      primary: {
        eyebrow: sectionHeader('e.g. Social proof'),
        header: text('Header', 'e.g. Don’t take our word for it.'),
        text: text('Text', 'The quote'),
        name: text('Footer: name', 'Who said it, shown in bold, e.g. Sam Example'),
        footer: text('Footer: role and organisation', 'e.g. Head of Marketing, Example Trust'),
        theme: select('Testimonial theme', TESTIMONIAL_THEMES, 'working with EdCo'),
        show_logos: boolean('Client logos underneath', false),
      },
    },
  ]),

  slice('outcomes', 'Outcomes we can help with', 'Cards for the outcomes you pick, each filled from that page’s Preview tab.', {
    eyebrow: sectionHeader(),
    heading: text('Header'),
    intro: text('Text'),
    pages: group('Outcomes', { page: pageLink('Outcome', ['outcome']) }),
    background: BACKGROUND('white'),
  }),

  slice('content_listing', 'Content listing', 'Cards for content: the pages you pick, the latest articles, or a short list of links. Each card is filled from that page’s Preview tab.', [
    {
      id: 'default',
      name: 'Chosen',
      description: 'Cards for the pages you pick.',
      primary: {
        eyebrow: sectionHeader(),
        heading: text('Header'),
        intro: text('Text'),
        photo: image('Background photo (optional, faded behind the header)'),
        items: group('Content', { page: pageLink('Page', LISTABLE) }),
        background: BACKGROUND('white'),
      },
    },
    {
      id: 'latest',
      name: 'Latest',
      description: 'The newest articles, filled in automatically. Empty slots show a placeholder.',
      primary: {
        eyebrow: sectionHeader(),
        heading: text('Header'),
        intro: text('Text'),
        photo: image('Background photo (optional, faded behind the header)'),
        show: select('Show', ['Insights and opinion', 'Insights', 'Opinion', 'Case studies'] as const, 'Insights and opinion'),
        count: number('How many', '3'),
        button_label: text('Button label'),
        button_link: link('Button link'),
        empty_note: text('Note on empty slots'),
        background: BACKGROUND('white'),
      },
    },
    {
      id: 'links',
      name: 'Links',
      description: 'A compact list of links, e.g. “You might also be interested in”.',
      primary: {
        heading: text('Header', 'e.g. You might also be interested in'),
        items: group('Links', {
          page: link('Page'),
          label: text('Label', 'Leave blank to use the page’s Preview title'),
          blurb: text('Description', 'Leave blank to use the page’s Preview introduction text'),
        }),
        icons: boolean('Show each page’s icon', true),
        background: BACKGROUND('white'),
      },
    },
  ]),

  slice('how_we_do_it', 'How we do it', 'Panels for the products and capabilities you pick, each filled from that page’s Preview tab.', {
    eyebrow: sectionHeader('e.g. How we do it'),
    heading: text('Header', 'e.g. “We want relationships before people are ready to buy”'),
    intro: text('Text'),
    pages: group('Products and capabilities', { page: pageLink('Page', PANEL_TYPES) }),
    background: BACKGROUND('navy'),
  }),

  slice('screenshots', 'Screenshots', 'Screenshots, each with a strapline.', {
    eyebrow: sectionHeader(),
    heading: text('Header'),
    intro: text('Text'),
    photo: image('Background photo (optional, faded behind the header)'),
    shots: group('Screenshots', {
      image: image('Screenshot'),
      caption: text('Strapline'),
    }),
  }),

  slice('item_list', 'Features listing', 'Features, each with an icon, title and explainer.', {
    eyebrow: sectionHeader(),
    heading: text('Header'),
    intro: text('Text'),
    items: group('Features', {
      icon: text('Icon', ICON_HINT),
      text: text('Title'),
      explainer: text('Explainer', 'Optional'),
    }),
    background: BACKGROUND('white'),
    layout: select('Layout', ['Standard', 'Heading beside list'] as const, 'Standard'),
  }),

  // Kept from before the deck at EdCo's request, with its own figures.
  slice('figures', 'Figures', 'A heading and text, with a row of figures underneath.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    body: prose('Text'),
    figures: group('Figures', {
      value: text('Figure', 'e.g. 35 years'),
      label: text('Label', 'e.g. working in education'),
      verified: boolean('Confirmed', true, 'Yes', 'No: show a VERIFY tag'),
    }),
    background: BACKGROUND('navy'),
  }),
];

/** Components the site had before the deck, kept at EdCo's request. */
export const earlierComponents: SharedSliceModel[] = [
  slice('statement', 'Statement', 'A big heading on the left, a few paragraphs on the right. Text in [SQUARE BRACKETS] shows as a placeholder.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    body: prose('Text'),
    closing_line: text('Closing line', 'Shown in bold under the text (optional)'),
    background: BACKGROUND('white'),
  }),

  slice('comparison', 'Comparison', 'A heading beside a ruled list of who/what pairs, then a turning line and text.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    rows: group('Rows', { who: text('Who'), what: text('What') }),
    turn: text('Turning line'),
    body: text('Text'),
    closing_line: text('Closing line'),
    background: BACKGROUND('white'),
  }),

  slice('model', 'How EdCo works', 'The Listen → Grow model, with a heading and intro. Add stages to give it its own; leave them empty to show the standard stages from Site settings.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    intro: text('Intro'),
    stages: group('Stages', {
      icon: text('Icon', ICON_HINT),
      name: text('Name', 'e.g. Listen'),
      summary: text('Summary'),
      methods: bullets('Methods'),
    }),
    anchor: text('Link name', 'e.g. how-edco-works, so links can jump to this section (optional)'),
    background: BACKGROUND('navy'),
  }),

  slice('page_cards', 'Page cards', 'Cards linking to pages: all outcomes, all products, all capabilities, or ones you choose.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    intro: text('Intro'),
    show: select('Show', ['All outcomes', 'All products', 'All capabilities', 'Chosen pages'] as const, 'All outcomes'),
    pages: group('Chosen pages', { page: link('Page') }),
    card_link_label: text('Card link label', 'e.g. Explore this'),
    numbered: boolean('Number the cards', false, 'Numbered', 'Not numbered'),
    background: BACKGROUND('white'),
  }),

  slice('link_words', 'Link words', 'A heading and button beside a cloud of linked words.', {
    heading: text('Heading'),
    intro: text('Intro'),
    button_label: text('Button label'),
    button_link: link('Button link'),
    words: group('Words', { label: text('Word'), link: link('Links to') }),
    background: BACKGROUND('grey'),
  }),

  slice('logo_wall', 'Logo wall', 'The client logo wall, with a centred heading.', {
    heading: text('Heading'),
    intro: text('Intro'),
    background: BACKGROUND('white'),
  }),

  slice('latest_articles', 'Latest articles', 'The latest insights and opinion. Content listing → Latest does the same, with more choices.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    intro: text('Intro'),
    stream: select('Show', ['All', 'Insights', 'Opinion'] as const, 'All'),
    count: number('How many', '3'),
    button_label: text('Button label'),
    button_link: link('Button link'),
    empty_note: text('Note on empty slots'),
    background: BACKGROUND('grey'),
  }),

  slice('link_cards', 'Link cards', 'Cards you write yourself, each linking somewhere. A card titled [IN BRACKETS] shows as a placeholder.', {
    eyebrow: text('Small label'),
    heading: text('Heading'),
    intro: text('Intro'),
    cards: group('Cards', {
      eyebrow: text('Small label'),
      title: text('Title'),
      body: text('Text'),
      link: link('Links to'),
      link_label: text('Link label'),
    }),
    background: BACKGROUND('white'),
  }),

  slice('feature_cards', 'Cards', 'Cards with a title and short text. Add detail or an image and each card opens to show it.', {
    heading: text('Heading'),
    intro: text('Intro line'),
    cards: group('Cards', {
      icon: text('Icon', ICON_HINT),
      title: text('Title'),
      body: text('Text'),
      detail: text('More detail', 'Shown when the card is opened (optional)'),
      image: image('Image shown when opened'),
    }),
  }),

  slice('steps', 'Steps', 'A sequence, shown as a timeline, with optional text and a button underneath.', {
    heading: text('Heading'),
    intro: text('Intro line'),
    steps: group('Steps', { label: text('Step') }),
    closing: text('Text underneath', 'Optional'),
    button_label: text('Button label', 'Optional'),
    button_link: link('Button link'),
    background: BACKGROUND('white'),
  }),

  slice('numbered_options', 'Options', 'A numbered menu of options, each with a few bullet points.', {
    heading: text('Heading'),
    intro: text('Intro line'),
    options: group('Options', {
      icon: text('Icon', ICON_HINT),
      title: text('Title'),
      body: text('Text'),
      points: bullets('Points'),
    }),
  }),

  slice('routes', 'Routes', 'Each outcome’s objective and the products and capabilities its How we do it picks, listed in turn.', {
    heading: text('Heading'),
    closing: text('Closing line'),
  }),

  slice('cta_band', 'Call to action', 'Replaces the call to action at the foot of the page. Leave a field blank to keep the site-wide wording.', {
    title: text('Heading'),
    body: text('Text'),
    button_label: text('Button label'),
    button_link: link('Button link'),
  }),
];

/*
  Components that belong to one page, offered only on that page's type: the
  parts held in code (the contact form, the login list), with their wording
  editable.
*/
export const pageComponents: { page: string; slice: SharedSliceModel }[] = [
  {
    page: 'contact_page',
    slice: slice('contact_form', 'Contact form', 'The enquiry form, with what happens next and the phone number beside it. The form’s fields themselves are fixed.', {
      heading: text('Heading', 'e.g. What are you trying to achieve?'),
      intro: text('Text under the heading'),
      analysis_option: text('Free customer analysis option', 'The last tick box, e.g. I’d like the free customer analysis'),
      more_heading: text('Message heading', 'e.g. Tell us a little more'),
      more_intro: text('Text under the message heading'),
      details_heading: text('Details heading', 'e.g. And who are you?'),
      button_label: text('Button label', 'e.g. Start the conversation'),
      next_heading: text('Side panel heading', 'e.g. What happens next'),
      next_text: prose('Side panel text'),
      phone_heading: text('Phone heading', 'e.g. Or just ring us. The number and address come from the site’s contact details'),
      customers_heading: text('Customer box heading', 'e.g. Already an EdCo customer?'),
      customers_text: prose('Customer box text'),
    }),
  },
  {
    page: 'customer_page',
    slice: slice('customer_logins', 'Customer logins', 'The page heading, the list of logins, then support and account manager boxes.', {
      eyebrow: text('Small label', 'e.g. Customer area'),
      heading: text('Heading', 'e.g. Logins and support'),
      intro: text('Introduction text'),
      logins: group('Logins', {
        name: text('Name', 'e.g. Education IQ'),
        note: text('Description', 'e.g. Intelligence platform login'),
        link: link('Login address', 'Leave blank to show a placeholder until it’s known'),
        link_label: text('Button label', 'Leave blank for “Log in”'),
      }),
      support_heading: text('Support box heading', 'e.g. Support. The phone number comes from the site’s contact details'),
      support_text: prose('Support box text', 'e.g. the support email or ticket address. Leave blank to show a placeholder'),
      manager_heading: text('Second box heading', 'e.g. Your account manager'),
      manager_text: prose('Second box text'),
    }),
  },
];

export const slices: SharedSliceModel[] = [...components, ...earlierComponents, ...pageComponents.map((c) => c.slice)];

/** The components a page type offers: everyone's, plus any that belong to that page. */
const sliceZone = (type: string): CustomTypeModelField => ({
  type: 'Slices',
  fieldset: 'Components',
  config: {
    choices: Object.fromEntries(
      [...components, ...earlierComponents, ...pageComponents.filter((c) => c.page === type).map((c) => c.slice)].map((s) => [s.id, { type: 'SharedSlice' as const }])
    ),
  },
});

/*
  The anatomy every page type shares. Fields are flat in Prismic, whichever
  tab they sit on, so fields that moved here (nav_label, summary, icon) kept
  their content.
*/
function pageType(t: (typeof PAGE_TYPES)[number]): CustomTypeModel {
  const repeatable = t.path.includes(':uid');
  const article = 'article' in t && t.article;
  const inMenu = 'inMenu' in t ? t.inMenu : undefined;
  return {
    id: t.id,
    label: t.label,
    repeatable,
    format: 'page',
    status: true,
    json: {
      // The web address sits first on the tab editors work in: Prismic won't save a
      // page without one, and a duplicated page starts with it blank.
      Page: {
        ...(repeatable ? { uid: { type: 'UID', config: { label: 'Web address', placeholder: 'uidHint' in t ? t.uidHint : undefined } } } : {}),
        slices: sliceZone(t.id),
      },
      // How this page appears wherever another page features it. One place to edit it.
      Preview: {
        nav_label: text('Title', 'Used in menus, cards, links and the breadcrumb'),
        ...(inMenu !== undefined
          ? {
              show_in_menu: boolean('Show in main menu', inMenu, 'Yes', 'No'),
              menu_order: number('Menu order', 'Lower numbers come first, e.g. 10, 20, 30. Blank goes last'),
            }
          : {}),
        preview_positioning: text('Positioning statement'),
        summary: text('Introduction text', 'One or two sentences. Also the search engine description unless SEO says otherwise'),
        interest_tags: group('Interest tags', { tag: text('Tag') }),
        icon: text('Icon', ICON_HINT),
        preview_image: image('Preview image'),
        panel_link_label: text('Link label', 'e.g. See SPIRIT. Leave blank for “Find out more”'),
        ...(article
          ? {
              date: date('Date'),
              author: text('Author', 'Opinion is attributed; insights have no named author'),
              status: select('Status', ['sample', 'live'] as const, 'live'),
            }
          : {}),
      },
      SEO: {
        meta_title: text('Browser tab title', 'Leave blank to use the Preview title'),
        meta_description: text('Search engine description', 'Leave blank to use the Preview introduction text'),
      },
    },
  };
}

export const customTypes: CustomTypeModel[] = PAGE_TYPES.map(pageType);

/* ---------- other single-instance pages and site settings (from specs.ts) ---------- */

const fieldFor = (kind: Kind, label: string): Nested =>
  kind === 'text' ? text(label)
  : kind === 'link' ? link(label)
  : kind === 'boolean' ? boolean(label, false, 'Yes', 'No')
  : bullets(label);

function fromSpec(id: string, label: string, fields: Record<string, Field | Group>): CustomTypeModel {
  const json: Record<string, Fields> = {};
  for (const [fid, f] of Object.entries(fields)) {
    json[f.tab] ??= {};
    json[f.tab][fid] =
      f.kind === 'group'
        ? group(f.label, Object.fromEntries(Object.entries(f.fields).map(([k, x]) => [k, fieldFor(x.kind, x.label)])))
        : fieldFor(f.kind, f.label);
  }
  return { id, label, repeatable: false, format: id === 'site_settings' ? 'custom' : 'page', status: true, json };
}

/* ---------- case studies, and the retired article type ---------- */

const caseStudy: CustomTypeModel = {
  id: 'case_study',
  label: 'Case study',
  repeatable: true,
  format: 'page',
  status: true,
  json: {
    Main: {
      uid: { type: 'UID', config: { label: 'Web address' } },
      title: text('Title', 'Framed as what the customer was trying to achieve'),
      client: text('Client'),
      summary: text('Summary', 'One sentence on the objective and what changed'),
      outcome: pageLink('Outcome it belongs under', ['outcome']),
      status: select('Status', ['placeholder', 'live'] as const, 'placeholder'),
    },
    'The story': {
      objective: text('What were they trying to achieve?'),
      discovered: text('What did we discover?'),
      recommended: text('What did we recommend?'),
      did: group('What did we do?', { text: text('Capability or product used') }),
      changed: text('What changed?'),
      evidence: group('The evidence', { text: text('Metric') }),
      testimonial: text('Testimonial'),
      body: prose('Notes shown under the story'),
    },
  },
};

/* Replaced by Insight and Opinion (Oct 2026). Disabled, so it can't be used
   for new pages; its three old documents can be deleted in Prismic. */
const oldArticle: CustomTypeModel = {
  id: 'article',
  label: 'Insights article (old, replaced by Insight and Opinion)',
  repeatable: true,
  format: 'page',
  status: false,
  json: {
    Main: {
      uid: { type: 'UID', config: { label: 'Web address' } },
      title: text('Title'),
      stream: select('Stream', ['what-were-hearing', 'opinion', 'research-and-insight'] as const, 'opinion'),
      summary: text('Summary'),
      date: date('Date'),
      author: text('Author'),
      status: select('Status', ['sample', 'live'] as const, 'live'),
      body: prose('Article', undefined, true),
    },
    Tags: { themes: group('Themes', { theme: text('Theme') }) },
  },
};

customTypes.push(...specs.map((s) => fromSpec(s.id, s.label, s.fields)), caseStudy, oldArticle);
