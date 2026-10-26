/*
  Prismic content models, in code.

  This file is the source of truth for what editors see in Prismic: the page
  types, their fields, and the slices (page sections) they can add. Push it
  with:

    node --env-file=.env scripts/prismic.ts push

  The structure follows the content framework (Oct 2026): a single template
  where each page is built from switchable sections. Product, capability
  and outcome pages share every slice and almost every field; product pages
  also link to the product's own website.

  Typed against @prismicio/client's model types, so a model with the wrong
  shape fails the type check before it ever reaches Prismic.
*/

import type {
  CustomTypeModel,
  CustomTypeModelField,
  CustomTypeModelFieldForNestedGroup,
  SharedSliceModel,
} from '@prismicio/client';

/* ---------- field helpers ---------- */

type Nested = CustomTypeModelFieldForNestedGroup;

const text = (label: string, placeholder?: string): Nested => ({
  type: 'Text',
  config: { label, placeholder },
});

/** Running text: paragraphs, bold, italic, links and bullet lists. */
const prose = (label: string, placeholder?: string): Nested => ({
  type: 'StructuredText',
  config: { label, placeholder, multi: 'paragraph,strong,em,hyperlink,list-item', allowTargetBlank: true },
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

const webLink = (label: string): Nested => ({
  type: 'Link',
  config: { label, select: 'web', allowTargetBlank: true },
});

const select = <O extends string>(label: string, options: readonly O[], default_value?: O): Nested => ({
  type: 'Select',
  config: { label, options, default_value },
});

const boolean = (label: string, default_value: boolean): Nested => ({
  type: 'Boolean',
  config: { label, default_value, placeholder_true: 'Shown', placeholder_false: 'Hidden' },
});

const group = (label: string, fields: Record<string, Nested>): CustomTypeModelField => ({
  type: 'Group',
  config: { label, fields },
});

const ICON_HINT = 'Icon name, e.g. fa6-solid:chart-simple (leave blank for none)';

/* ---------- slices ---------- */

const slice = (
  id: string,
  name: string,
  description: string,
  primary: Record<string, CustomTypeModelField>
): SharedSliceModel => ({
  type: 'SharedSlice',
  id,
  name,
  description,
  variations: [
    {
      id: 'default',
      name: 'Default',
      docURL: '...',
      version: 'initial',
      description,
      imageUrl: '',
      primary: primary as SharedSliceModel['variations'][number]['primary'],
    },
  ],
});

/** Section heading and the short paragraph under it — most slices open with these. */
const intro = {
  heading: text('Heading'),
  intro: text('Intro line', 'One sentence under the heading (optional)'),
};

export const slices: SharedSliceModel[] = [
  slice('text_block', 'Text', 'Introduction text, or any section of running text.', {
    heading: text('Heading', 'Optional'),
    body: prose('Text'),
  }),

  slice('quote', 'Quote', 'A quote or engaging thought, as a full-width band.', {
    text: text('Quote', 'The line that carries the argument'),
    supporting_line: text('Supporting line', 'Optional'),
  }),

  slice('item_list', 'List', 'Outcomes we can help with, or a content listing: short items, each with an icon.', {
    ...intro,
    items: group('Items', {
      text: text('Item'),
      icon: text('Icon', ICON_HINT),
    }),
  }),

  slice('screenshots', 'Screenshots', 'Product screenshots with captions.', {
    ...intro,
    shots: group('Screenshots', {
      image: image('Screenshot'),
      caption: text('Caption'),
    }),
  }),

  slice('feature_cards', 'Cards', 'Cards with a title and short text. Add detail or an image and each card opens to show it.', {
    ...intro,
    cards: group('Cards', {
      icon: text('Icon', ICON_HINT),
      title: text('Title'),
      body: text('Text'),
      detail: text('More detail', 'Shown when the card is opened (optional)'),
      image: image('Image shown when opened'),
    }),
  }),

  slice('steps', 'Steps', 'A sequence, shown as a timeline.', {
    ...intro,
    steps: group('Steps', { label: text('Step') }),
  }),

  slice('numbered_options', 'Options', 'A numbered menu of options, each with a few bullet points.', {
    ...intro,
    options: group('Options', {
      icon: text('Icon', ICON_HINT),
      title: text('Title'),
      body: text('Text'),
      points: bullets('Points'),
    }),
  }),

  slice('how_we_do_it', 'HowWeDoIt', 'How we do it: an example route, where each step links to where it is done.', {
    heading: text('Objective', 'e.g. We need more MAT customers'),
    intro: text('Intro line'),
    steps: group('Steps', {
      label: text('Step'),
      link: link('Links to', 'The page where this step is done'),
    }),
  }),
];

/* ---------- page types ---------- */

const TESTIMONIAL_THEMES = [
  'EdCo challenging the original brief',
  'EdCo understanding both education and the client’s business',
  'EdCo feeling like part of the client team',
  'a long-term relationship',
  'working with EdCo',
] as const;

function pageType(id: string, label: string, extraMain: Record<string, CustomTypeModelField> = {}): CustomTypeModel {
  return {
    id,
    label,
    repeatable: true,
    format: 'page',
    status: true,
    json: {
      Main: {
        uid: { type: 'UID', config: { label: 'Web address', placeholder: 'e.g. education-iq' } },
        nav_label: text('Short name', 'Used in menus, cards and links'),
        title: text('Page heading (H1)'),
        standfirst: text('Standfirst', 'The one line that carries the argument'),
        lead: text('Intro paragraph', 'Under the heading in the banner'),
        summary: text('Summary', 'One or two sentences for cards and search engines'),
        banner: image('Banner photo'),
        banner_focus: select('Banner crop', ['centre', 'left', 'right'] as const, 'centre'),
        icon: text('Icon', ICON_HINT),
        ...extraMain,
        slices: { type: 'Slices', fieldset: 'Page sections', config: { choices: Object.fromEntries(slices.map((s) => [s.id, { type: 'SharedSlice' as const }])) } },
      },
      'Proof & related': {
        show_social_proof: boolean('Social proof (testimonial and logos)', true),
        testimonial_theme: select('Testimonial theme', TESTIMONIAL_THEMES, 'working with EdCo'),
        related: group('You might also be interested in', {
          link: link('Page'),
          label: text('Label', 'Leave blank to use the page’s short name'),
          blurb: text('Description', 'Leave blank to use the page’s summary'),
        }),
      },
      SEO: {
        meta_title: text('Browser tab title', 'Leave blank to use the short name'),
        meta_description: text('Search engine description', 'Leave blank to use the summary'),
      },
    },
  };
}

export const customTypes: CustomTypeModel[] = [
  pageType('product', 'Product', {
    site_label: text('Product website button label', 'e.g. Visit Education IQ'),
    site_link: webLink('Product website'),
  }),
  pageType('capability', 'Capability'),
  pageType('outcome', 'What are you trying to achieve'),
];
