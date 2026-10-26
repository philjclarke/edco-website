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
import { specs, type Field, type Group, type Kind } from './specs.ts';

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

/* ---------- single-instance pages and site settings (from specs.ts) ---------- */


const fieldFor = (kind: Kind, label: string): Nested =>
  kind === 'text' ? text(label)
  : kind === 'link' ? link(label)
  : kind === 'boolean' ? { type: 'Boolean', config: { label, default_value: false, placeholder_true: 'Yes', placeholder_false: 'No' } }
  : bullets(label);

function fromSpec(id: string, label: string, fields: Record<string, Field | Group>): CustomTypeModel {
  const json: Record<string, Record<string, CustomTypeModelField>> = {};
  for (const [fid, f] of Object.entries(fields)) {
    json[f.tab] ??= {};
    json[f.tab][fid] =
      f.kind === 'group'
        ? group(f.label, Object.fromEntries(Object.entries(f.fields).map(([k, x]) => [k, fieldFor(x.kind, x.label)])))
        : fieldFor(f.kind, f.label);
  }
  return { id, label, repeatable: false, format: id === 'site_settings' ? 'custom' : 'page', status: true, json };
}

/* ---------- Insights articles and case studies ---------- */

const STREAMS = ['what-were-hearing', 'opinion', 'research-and-insight'] as const;

const article: CustomTypeModel = {
  id: 'article',
  label: 'Insights article',
  repeatable: true,
  format: 'page',
  status: true,
  json: {
    Main: {
      uid: { type: 'UID', config: { label: 'Web address', placeholder: 'e.g. what-mat-finance-leaders-are-telling-us' } },
      title: text('Title'),
      stream: select('Stream', STREAMS, 'opinion'),
      summary: text('Summary', 'One or two sentences for cards and search engines'),
      date: { type: 'Date', config: { label: 'Date' } },
      author: text('Author', 'Opinion pieces are attributed; What we’re hearing has no named author'),
      status: select('Status', ['sample', 'live'] as const, 'live'),
      body: {
        type: 'StructuredText',
        config: { label: 'Article', multi: 'paragraph,heading2,heading3,strong,em,hyperlink,list-item,o-list-item', allowTargetBlank: true },
      },
    },
    Tags: {
      themes: group('Themes', { theme: text('Theme') }),
    },
  },
};

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
      outcome: {
        type: 'Link',
        config: { label: 'Outcome it belongs under', select: 'document', customtypes: ['outcome'] },
      },
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

customTypes.push(...specs.map((s) => fromSpec(s.id, s.label, s.fields)), article, caseStudy);
