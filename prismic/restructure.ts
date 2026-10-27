/*
  One-off: moves every page into the component structure of EdCo's
  component deck (Oct 2026). See prismic/models.ts.

    node --env-file=.env prismic/restructure.ts           # build it into the migration release
    node --env-file=.env prismic/restructure.ts publish   # publish the release

  - Product, capability and outcome pages: their banner fields become a
    Banner component, social proof a two-column Quote, and "You might also
    be interested in" a Content listing (Links).
  - The homepage, the six other top-level pages: their fixed fields become
    components, keeping their words.
  - Insights: the three streams become two sections (What we're hearing,
    Opinion) under Insights & Opinion; each article becomes an Insight or
    an Opinion page. Research & insight joins What we're hearing.

  Nothing is published until the second command, so the result can be
  checked first (build with PRISMIC_REF set to the release's ref). Refuses
  to run if any page already has a Banner component.
*/

import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import * as prismic from '@prismicio/client';

const repo = process.env.PRISMIC_REPOSITORY!;
const writeClient = prismic.createWriteClient(repo, { writeToken: process.env.PRISMIC_WRITE_TOKEN! });
const client = prismic.createClient(repo);
const LANG = 'en-gb';
const SITE = 'https://www.educationcompany.co.uk';
const root = new URL('../', import.meta.url);

if (process.argv[2] === 'publish') {
  await writeClient.publishMigrationRelease();
  console.log('Published the migration release.');
  process.exit(0);
}

const docs = await client.dangerouslyGetAll();
const already = docs.filter((d) => (d.data.slices as any[] | undefined)?.some((s) => s.slice_type === 'banner'));
if (already.length) {
  console.error(`Already restructured (${already.map((d) => d.type).join(', ')}); not running again.`);
  process.exit(1);
}

const migration = prismic.createMigration();
const one = (type: string) => docs.find((d) => d.type === type)!;
const byUID = (type: string, uid: string) => docs.find((d) => d.type === type && d.uid === uid)!;
const t = (s: unknown) => (typeof s === 'string' ? s.trim() : '');
const paras = (...texts: string[]) => texts.filter(Boolean).map((text) => ({ type: 'paragraph', text, spans: [] }));

/* ---------- links and images ---------- */

const web = (path: string) => ({ link_type: 'Web', url: SITE + path });

/** Old /what-we-think/ addresses -> /insights/. */
const MOVED: Record<string, string> = {
  '/what-we-think/': '/insights/',
  '/what-we-think/what-were-hearing/': '/insights/what-were-hearing/',
  '/what-we-think/opinion/': '/insights/opinion/',
  '/what-we-think/research-and-insight/': '/insights/what-were-hearing/',
};
function relink(link: any) {
  if (link?.link_type !== 'Web' || !link.url) return link;
  const path = link.url.replace(/^https?:\/\/(www\.)?educationcompany\.co\.uk/, '');
  return MOVED[path] ? web(MOVED[path]) : link;
}

/* Hub banners were files in the code. Reuse the copy already in Prismic's
   media library where a page uses the same photo; otherwise upload it. */
const existingImages = docs.flatMap((d) => [d.data.banner, ...((d.data.slices as any[]) ?? []).map((s) => s.primary?.image)]).filter((i) => i?.url);
const uploads = new Map<string, unknown>();
function bannerImage(key: string, alt: string) {
  const found = existingImages.find((i) => new URL(i.url).pathname.endsWith(`_${key}.jpg`));
  if (found) return found;
  if (!uploads.has(key)) {
    uploads.set(key, migration.createAsset(new Blob([readFileSync(new URL(`src/assets/banners/${key}.jpg`, root))]), `${key}.jpg`, { alt }));
  }
  return uploads.get(key);
}
const EMPTY_IMAGE = {};

/* ---------- components ---------- */

const component = (slice_type: string, primary: Record<string, unknown>, variation = 'default') => ({
  id: `${slice_type}$${randomUUID()}`,
  slice_type,
  slice_label: null,
  variation,
  version: 'initial',
  primary,
  items: [],
});

const banner = (p: {
  title: string; positioning?: string; intro?: string; image?: unknown; focus?: string;
  large?: boolean; button?: [string, unknown];
}) =>
  component('banner', {
    eyebrow: '',
    title: p.title,
    positioning: p.positioning ?? '',
    intro: p.intro ?? '',
    image: p.image ?? EMPTY_IMAGE,
    image_focus: p.focus ?? 'centre',
    size: p.large ? 'Large' : 'Standard',
    button_label: p.button?.[0] ?? '',
    button_link: p.button?.[1] ?? { link_type: 'Any' },
  });

const links = (heading: string, items: { page: unknown; label?: string; blurb?: string }[], icons: boolean) =>
  component('content_listing', {
    heading,
    items: items.map((i) => ({ page: i.page, label: i.label ?? '', blurb: i.blurb ?? '' })),
    icons,
    background: 'white',
  }, 'links');

const pick = (docsOrMigration: unknown[]) => docsOrMigration.map((page) => ({ page }));

/** An existing component, in the new model's fields. */
function carry(s: any) {
  const p = { ...s.primary };
  switch (s.slice_type) {
    case 'quote':
      return component('quote', { header: '', text: t(p.text), footer: t(p.supporting_line) });
    case 'item_list':
      return component('item_list', {
        eyebrow: '', heading: t(p.heading), intro: t(p.intro),
        items: (p.items ?? []).map((i: any) => ({ icon: t(i.icon), text: t(i.text), explainer: '' })),
        background: 'white',
      });
    case 'screenshots':
      return component('screenshots', { eyebrow: '', heading: t(p.heading), intro: t(p.intro), photo: EMPTY_IMAGE, shots: p.shots ?? [] });
    case 'how_we_do_it': {
      const heading = t(p.heading);
      return component('how_we_do_it', {
        eyebrow: 'How we do it',
        heading: heading && !/^[“"]/.test(heading) ? `“${heading}”` : heading,
        intro: t(p.intro),
        pages: p.pages ?? [],
        background: 'navy',
      });
    }
    case 'latest_articles': {
      const show = p.stream === 'opinion' ? 'Opinion' : p.stream === 'All' ? 'Insights and opinion' : 'Insights';
      return component('content_listing', {
        eyebrow: t(p.eyebrow), heading: t(p.heading), intro: t(p.intro), photo: EMPTY_IMAGE, show,
        count: p.count ?? null, button_label: t(p.button_label), button_link: relink(p.button_link),
        empty_note: t(p.empty_note), background: p.background ?? 'grey',
      }, 'latest');
    }
    case 'link_words':
      return component('link_words', { ...p, button_link: relink(p.button_link), words: (p.words ?? []).map((w: any) => ({ ...w, link: relink(w.link) })) });
    case 'link_cards':
      return component('link_cards', { ...p, cards: (p.cards ?? []).map((c: any) => ({ ...c, link: relink(c.link) })) });
    case 'page_cards':
      return component('page_cards', { ...p, pages: (p.pages ?? []).map((x: any) => ({ page: relink(x.page) })) });
    default:
      return component(s.slice_type, p);
  }
}

/** The Preview and SEO tabs. */
const preview = (p: { title: string; positioning?: string; text: string; icon?: string; linkLabel?: string; metaTitle?: string; metaDescription?: string; tags?: string[] }) => ({
  nav_label: p.title,
  preview_positioning: p.positioning ?? '',
  summary: p.text,
  interest_tags: (p.tags ?? []).map((tag) => ({ tag })),
  icon: p.icon ?? '',
  preview_image: EMPTY_IMAGE,
  panel_link_label: p.linkLabel ?? '',
  meta_title: p.metaTitle ?? '',
  meta_description: p.metaDescription ?? '',
});

function update(doc: prismic.PrismicDocument, data: Record<string, unknown>) {
  migration.updateDocument({ ...doc, data } as any, t(doc.data.nav_label) || t(doc.data.title) || t(doc.data.hero_title) || doc.type);
}

/* ---------- product, capability and outcome pages ---------- */

const MENU = {
  outcome: ['understand-education-and-educators', 'build-your-reputation-and-audience', 'reach-and-engage-educators', 'generate-leads-and-build-pipeline', 'grow-and-retain-customers', 'education-strategy'],
  product: ['education-iq', 'ednet', 'spirit', 'international-schools-network', 'the-curriculum-network'],
  capability: ['research', 'marketing-services', 'events-and-cpd', 'content-creation', 'data-services', 'csr-programmes', 'technology-and-integration', 'bespoke-technology'],
};

for (const doc of docs.filter((d) => ['product', 'capability', 'outcome'].includes(d.type))) {
  const d = doc.data as Record<string, any>;
  const slices = [
    banner({
      title: t(d.title),
      positioning: t(d.standfirst),
      intro: t(d.lead),
      image: d.banner?.url ? d.banner : EMPTY_IMAGE,
      focus: d.banner_focus,
      large: doc.type === 'outcome',
      button: doc.type === 'product' && (t(d.site_label) || d.site_link?.url) ? [t(d.site_label) || `Visit ${t(d.nav_label)}`, d.site_link] : undefined,
    }),
    ...(d.slices ?? []).map(carry),
    ...(d.show_social_proof !== false
      ? [component('quote', {
          eyebrow: 'Social proof',
          header: 'Don’t take our word for it.',
          text: '',
          footer: '',
          theme: d.testimonial_theme || 'working with EdCo',
          show_logos: true,
        }, 'two_column')]
      : []),
    ...((d.related ?? []).filter((r: any) => r.link?.link_type && r.link.link_type !== 'Any').length
      ? [links('You might also be interested in', (d.related ?? []).filter((r: any) => r.link?.link_type && r.link.link_type !== 'Any').map((r: any) => ({ page: relink(r.link), label: t(r.label), blurb: t(r.blurb) })), true)]
      : []),
  ];
  update(doc, {
    ...preview({
      title: t(d.nav_label),
      positioning: t(d.standfirst),
      text: t(d.summary),
      icon: t(d.icon),
      linkLabel: t(d.panel_link_label),
      metaTitle: t(d.meta_title),
      metaDescription: t(d.meta_description),
    }),
    slices,
  });
}

/* ---------- Insights & Opinion ---------- */

const settings = one('site_settings').data as Record<string, any>;
const stream = (slug: string) => (settings.streams as any[]).find((s) => s.slug === slug);

function section(slug: string, show: 'Insights' | 'Opinion') {
  const s = stream(slug);
  return migration.createDocument(
    {
      type: 'insights_section',
      uid: slug,
      lang: LANG,
      data: {
        ...preview({ title: t(s.label), positioning: t(s.question), text: t(s.note), metaTitle: t(s.label), metaDescription: t(s.lead) }),
        slices: [
          banner({ title: t(s.title), positioning: t(s.question), intro: t(s.lead), image: bannerImage('lecture-hall', 'A lecture hall'), focus: 'centre' }),
          component('content_listing', {
            eyebrow: '', heading: '', intro: '', photo: EMPTY_IMAGE, show, count: null,
            button_label: '', button_link: { link_type: 'Any' }, empty_note: t(s.note), background: 'white',
          }, 'latest'),
        ],
      },
    } as any,
    t(s.label)
  );
}
const hearing = section('what-were-hearing', 'Insights');
const opinion = section('opinion', 'Opinion');

for (const a of docs.filter((d) => d.type === 'article')) {
  const d = a.data as Record<string, any>;
  migration.createDocument(
    {
      type: d.stream === 'opinion' ? 'opinion' : 'insight',
      uid: a.uid,
      lang: LANG,
      data: {
        ...preview({ title: t(d.title), text: t(d.summary), tags: (d.themes ?? []).map((x: any) => t(x.theme)).filter(Boolean) }),
        date: d.date,
        author: t(d.author),
        status: d.status ?? 'live',
        slices: [
          banner({ title: t(d.title), intro: t(d.summary) }),
          component('text_block', { heading: '', body: d.body ?? [] }),
          component('content_listing', {
            eyebrow: '', heading: 'Found that useful?', intro: 'Get more of what we’re hearing, researching and thinking about education.',
            photo: EMPTY_IMAGE, show: 'Insights and opinion', count: 3,
            button_label: '', button_link: { link_type: 'Any' }, empty_note: '', background: 'grey',
          }, 'latest'),
        ],
      },
    } as any,
    t(d.title)
  );
}

/* ---------- the top-level pages ---------- */

{
  const doc = one('home_page');
  const d = doc.data as Record<string, any>;
  update(doc, {
    ...preview({ title: 'Home', text: t(d.hero_body), metaDescription: t(d.meta_description) }),
    slices: [
      component('banner', {
        eyebrow: t(d.hero_eyebrow),
        title: t(d.hero_heading),
        positioning: t(d.hero_standfirst),
        intro: t(d.hero_body),
        image: d.banner?.url ? d.banner : EMPTY_IMAGE,
        image_focus: d.banner_focus || 'centre',
        button_label: 'Tell us what you’re trying to achieve',
        button_link: web('/contact/'),
        button2_label: 'See how EdCo works',
        button2_link: web('/#how-edco-works'),
      }, 'home'),
      ...(d.slices ?? []).map(carry),
    ],
  });
}

{
  const doc = one('outcomes_hub');
  const d = doc.data as Record<string, any>;
  update(doc, {
    ...preview({ title: t(d.hero_eyebrow), positioning: t(d.hero_standfirst), text: t(d.meta_description), metaTitle: t(d.meta_title), metaDescription: t(d.meta_description) }),
    slices: [
      banner({ title: t(d.hero_title), positioning: t(d.hero_standfirst), intro: t(d.hero_lead), image: bannerImage('teacher-board', 'A teacher at the board'), large: true }),
      component('outcomes', { eyebrow: '', heading: '', intro: '', pages: pick(MENU.outcome.map((u) => byUID('outcome', u))), background: 'white' }),
      component('statement', { eyebrow: 'Why we start here', heading: t(d.heading), body: paras(t(d.body), t(d.body2)), closing_line: t(d.body3), background: 'navy' }),
      component('routes', { heading: t(d.heading2), closing: t(d.body4) }),
    ],
  });
}

for (const [type, kind, image, focus] of [
  ['products_hub', 'product', 'laptop-charts', 'centre'],
  ['capabilities_hub', 'capability', 'workshop-group', 'right'],
] as const) {
  const doc = one(type);
  const d = doc.data as Record<string, any>;
  update(doc, {
    ...preview({ title: t(d.hero_eyebrow), positioning: t(d.hero_standfirst), text: t(d.meta_description), metaTitle: t(d.meta_title), metaDescription: t(d.meta_description) }),
    slices: [
      banner({ title: t(d.hero_title), positioning: t(d.hero_standfirst), intro: t(d.hero_lead), image: bannerImage(image, ''), focus }),
      component('how_we_do_it', { eyebrow: '', heading: '', intro: '', pages: pick(MENU[kind].map((u) => byUID(kind, u))), background: 'white' }),
      component('quote', { header: '', text: t(d.body), footer: t(d.body2) }),
      ...(type === 'products_hub'
        ? [links('Where might you go next?', [
            { page: one('outcomes_hub'), label: 'What are you trying to achieve?', blurb: 'A better starting point than a product list.' },
            { page: one('capabilities_hub'), label: 'Capabilities', blurb: 'The people and services around the products.' },
            { page: web('/free-customer-analysis/'), label: 'Free customer analysis', blurb: 'See Education IQ applied to your own data.' },
          ], false)]
        : []),
    ],
  });
}

{
  const doc = one('what_we_think_page');
  const d = doc.data as Record<string, any>;
  update(doc, {
    ...preview({ title: 'Insights & Opinion', positioning: t(d.hero_standfirst), text: t(d.meta_description), metaTitle: 'Insights & Opinion', metaDescription: t(d.meta_description) }),
    slices: [
      banner({ title: t(d.hero_title), positioning: t(d.hero_standfirst), intro: t(d.hero_lead), image: bannerImage('lecture-hall', 'A lecture hall'), focus: 'right' }),
      component('content_listing', { eyebrow: '', heading: '', intro: '', photo: EMPTY_IMAGE, items: pick([hearing, opinion]), background: 'white' }),
      component('content_listing', {
        eyebrow: '', heading: 'Most recent', intro: '', photo: EMPTY_IMAGE, show: 'Insights and opinion', count: null,
        button_label: '', button_link: { link_type: 'Any' }, empty_note: 'Editorial pipeline: volume and cadence to agree.', background: 'grey',
      }, 'latest'),
      component('cta_band', { title: t(d.cta_title), body: t(d.cta_body), button_label: t(d.cta_cta_label), button_link: web('/contact/') }),
    ],
  });
}

{
  const doc = one('about_page');
  const d = doc.data as Record<string, any>;
  update(doc, {
    ...preview({ title: t(d.hero_eyebrow), positioning: t(d.hero_standfirst), text: t(d.meta_description), metaTitle: t(d.meta_title), metaDescription: t(d.meta_description) }),
    slices: [
      banner({ title: t(d.hero_title), positioning: t(d.hero_standfirst), intro: t(d.hero_lead), image: bannerImage('lecture-hall', 'A lecture hall'), large: true }),
      component('item_list', {
        eyebrow: '', heading: '', intro: '',
        items: (settings.beliefs ?? []).map((b: any) => ({ icon: '', text: t(b.title), explainer: t(b.body) })),
        background: 'white',
      }),
      component('figures', { eyebrow: 'Heritage', heading: t(d.heading), body: paras(t(d.body), t(d.body2)), background: 'navy' }),
      component('link_cards', {
        eyebrow: t(d.section_eyebrow), heading: t(d.section_title), intro: t(d.section_lead),
        cards: [1, 2, 3, 4].map(() => ({ eyebrow: '', title: `[LEADERSHIP PROFILE: ${t(d.body3).replace(/\.$/, '').toLowerCase()}]`, body: '', link: { link_type: 'Any' }, link_label: '' })),
        background: 'white',
      }),
      component('statement', { eyebrow: t(d.body4), heading: t(d.heading2), body: paras(t(d.body5), t(d.body6)), closing_line: '', background: 'grey' }),
      links('Where might you go next?', [
        { page: one('what_we_think_page'), label: 'Insights & Opinion', blurb: 'The beliefs, argued in public.' },
        { page: web('/case-studies/'), label: 'Case studies', blurb: 'The beliefs, applied to real work.' },
        { page: one('agencies_page'), label: 'Agencies & Partners', blurb: 'How we work alongside other agencies.' },
      ], false),
    ],
  });
}

{
  const doc = one('agencies_page');
  const d = doc.data as Record<string, any>;
  update(doc, {
    ...preview({ title: t(d.hero_eyebrow), positioning: t(d.hero_standfirst), text: t(d.meta_description), metaTitle: t(d.meta_title), metaDescription: t(d.meta_description) }),
    slices: [
      banner({ title: t(d.hero_title), positioning: t(d.hero_standfirst), intro: t(d.hero_lead), image: bannerImage('meeting-table', 'A meeting around a table'), focus: 'left', large: true }),
      component('item_list', {
        eyebrow: t(d.body), heading: t(d.heading), intro: t(d.body2),
        items: (d.capabilities ?? []).map((c: any) => ({ icon: t(c.icon), text: t(c.text), explainer: '' })),
        background: 'white',
      }),
      component('quote', { header: '', text: t(d.body3), footer: t(d.body4) }),
      component('link_cards', {
        eyebrow: t(d.section_eyebrow), heading: t(d.section_title), intro: `${t(d.section_lead)} ${t(d.body5)}`.trim(),
        cards: [1, 2, 3].map(() => ({ eyebrow: '', title: '[PARTNER LOGO, NAME AND ONE SENTENCE ON WHAT THEY ADD]', body: '', link: { link_type: 'Any' }, link_label: '' })),
        background: 'white',
      }),
      component('quote', { eyebrow: t(d.body6), header: t(d.heading2), text: '', footer: '', theme: 'EdCo feeling like part of the client team', show_logos: false }, 'two_column'),
      links('Where might you go next?', [
        { page: byUID('capability', 'research'), label: 'Research', blurb: 'Including educator recruitment on its own.' },
        { page: byUID('product', 'education-iq'), label: 'Education IQ', blurb: 'Education intelligence for your client’s market.' },
        { page: one('capabilities_hub'), label: 'Capabilities', blurb: 'Everything you could bring us in for.' },
      ], false),
      component('cta_band', { title: t(d.cta_title), body: t(d.cta_body), button_label: '', button_link: { link_type: 'Any' } }),
    ],
  });
}

/* ---------- run ---------- */

await writeClient.migrate(migration, {
  reporter: (e: any) => {
    if (/:(created|updated)$|^end$/.test(e.type)) console.log(e.type);
  },
});
console.log('Built into the migration release. Check it, then run with "publish".');
