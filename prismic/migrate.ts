/*
  One-off import of the current site's product, capability and outcome pages
  into Prismic: their copy (src/data/copy/*.json), banner photos and product
  screenshots. Run through scripts/prismic.ts:

    node --env-file=.env scripts/prismic.ts migrate

  Sections are imported in the order the section template showed them
  (context, quote, problems we solve, quote, how we do it / screenshots,
  quote, how to use it, quote, proof), so each page reads exactly as it did.
  Empty quote slots come across as empty Quote slices, which the site fills
  with a mock quote while MOCK_PROOF is on.

  It refuses to run if any of these pages are already published in Prismic,
  so it can't create duplicates.
*/

import { readFileSync } from 'node:fs';
import * as prismic from '@prismicio/client';

const repo = process.env.PRISMIC_REPOSITORY!;
const writeClient = prismic.createWriteClient(repo, { writeToken: process.env.PRISMIC_WRITE_TOKEN! });
const migration = prismic.createMigration();
const LANG = 'en-gb';
const SITE = 'https://www.educationcompany.co.uk';

const load = (f: string) => JSON.parse(readFileSync(new URL(`../src/data/copy/${f}`, import.meta.url), 'utf8'));
const products = load('products.json');
const capabilities = load('capabilities.json');
const outcomes = load('outcomes.json');
const model = load('model.json');

for (const type of ['product', 'capability', 'outcome']) {
  const existing = await writeClient.getAllByType(type).catch(() => []);
  if (existing.length) {
    console.error(`Prismic already has published ${type} pages; not importing again.`);
    process.exit(1);
  }
}

/* ---------- assets ---------- */

const BANNERS: Record<string, string> = {
  'students-laptops': 'src/assets/banners/students-laptops.jpg',
  'primary-classroom': 'src/assets/banners/primary-classroom.jpg',
  'teacher-board': 'src/assets/banners/teacher-board.jpg',
  'lecture-hall': 'src/assets/banners/lecture-hall.jpg',
  'meeting-table': 'src/assets/banners/meeting-table.jpg',
  'workshop-group': 'src/assets/banners/workshop-group.jpg',
  'data-screen': 'src/assets/banners/data-screen.jpg',
  'laptop-charts': 'src/assets/banners/laptop-charts.jpg',
  classroom: 'src/assets/images/classroom.jpg',
};
const SCREENS: Record<string, string> = {
  'eiq/search': 'src/assets/screens/education-iq/01-search-dark.png',
  'eiq/top-list-financial': 'src/assets/screens/education-iq/03-top-list-financial-dark.png',
  'eiq/trust-overview': 'src/assets/screens/education-iq/04-trust-overview-dark.png',
  'eiq/trust-comparisons': 'src/assets/screens/education-iq/05-trust-school-comparisons-dark.png',
  'eiq/school-overview': 'src/assets/screens/education-iq/09-school-overview-dark.png',
  'eiq/school-ofsted-finance': 'src/assets/screens/education-iq/11-school-ofsted-finance-dark.png',
  'eiq/pitch-briefing': 'src/assets/screens/education-iq/14-pitch-briefing-dark.png',
  'eiq/projects-analyse': 'src/assets/screens/education-iq/16-projects-analyse-financial-dark.png',
};

const root = new URL('../', import.meta.url);
const asset = (path: string, alt: string, notes: string) =>
  migration.createAsset(new Blob([readFileSync(new URL(path, root))]), path.split('/').pop()!, { alt, notes });

const banner = (key?: string) =>
  key && BANNERS[key] ? asset(BANNERS[key], '', 'Stand-in banner photo (Unsplash). Replace with commissioned photography.') : {};
const screen = (key: string | undefined, caption: string) =>
  key && SCREENS[key] ? asset(SCREENS[key], caption, 'Education IQ design prototype with example data.') : {};

/* ---------- links ---------- */

const outcomeSlugs = new Set(outcomes.map((o: { slug: string }) => o.slug));

/** A site path as a Prismic link: a page link where the page is in Prismic, otherwise a web address. */
function linkTo(href: string) {
  let m = /^\/products\/([^/]+)\/$/.exec(href);
  if (m) return () => migration.getByUID('product', m![1]);
  m = /^\/capabilities\/([^/]+)\/$/.exec(href);
  if (m) return () => migration.getByUID('capability', m![1]);
  m = /^\/([^/]+)\/$/.exec(href);
  if (m && outcomeSlugs.has(m[1])) return () => migration.getByUID('outcome', m![1]);
  return { link_type: 'Web', url: SITE + href };
}

const navLabelFor = new Map<string, string>([
  ...products.map((p: any) => [`/products/${p.slug}/`, p.navLabel] as const),
  ...capabilities.map((c: any) => [`/capabilities/${c.slug}/`, c.navLabel] as const),
  ...outcomes.map((o: any) => [`/${o.slug}/`, o.navLabel] as const),
]);

/* ---------- text ---------- */

const paragraphs = (paras: string[]) =>
  paras
    .flatMap((p) => p.split(/\n\s*\n/))
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ type: 'paragraph', text: t, spans: [] }));
const listItems = (items: string[]) => items.map((t) => ({ type: 'list-item', text: t, spans: [] }));

/* ---------- blocks -> slices ---------- */

const slice = (slice_type: string, primary: Record<string, unknown>) => ({
  slice_type,
  variation: 'default',
  version: 'initial',
  primary,
  items: [],
});

function blockToSlice(b: any) {
  switch (b.type) {
    case 'prose':
      return slice('text_block', { heading: b.title ?? '', body: paragraphs(b.paras) });
    case 'pull':
      return slice('quote', { text: b.text ?? '', supporting_line: b.sub ?? '' });
    case 'list':
      return slice('item_list', {
        heading: b.title ?? '',
        intro: b.lead ?? '',
        items: b.items.map((t: string, i: number) => ({ text: t, icon: b.icons?.[i] ?? '' })),
      });
    case 'shots':
      return slice('screenshots', {
        heading: b.title ?? '',
        intro: b.lead ?? '',
        shots: b.shots.map((s: any) => ({ image: screen(s.src, s.caption), caption: s.caption })),
      });
    case 'cards':
      return slice('feature_cards', {
        heading: b.title ?? '',
        intro: b.lead ?? '',
        cards: b.items.map((c: any) => ({
          icon: c.icon ?? '',
          title: c.title,
          body: c.body,
          detail: c.detail ?? '',
          image: screen(c.shot, c.title),
        })),
      });
    case 'steps':
      return slice('steps', { heading: b.title ?? '', intro: b.lead ?? '', steps: b.steps.map((label: string) => ({ label })) });
    case 'ways':
      return slice('numbered_options', {
        heading: b.title ?? '',
        intro: b.lead ?? '',
        options: b.items.map((w: any) => ({
          icon: w.icon ?? '',
          title: w.title,
          body: w.body,
          points: listItems(w.points),
        })),
      });
    default:
      throw new Error(`No slice for block type ${b.type}`);
  }
}

const emptyQuote = () => slice('quote', { text: '', supporting_line: '' });
const isQuote = (s: { slice_type: string }) => s.slice_type === 'quote';

/** Lay the blocks out in the section template's order; never two quote bands in a row. */
function sectionSlices(blocks: any[], order: string[]) {
  const out: ReturnType<typeof slice>[] = [];
  order.forEach((slot, i) => {
    out.push(...blocks.filter((b) => b.slot === slot).map(blockToSlice));
    const shout = blocks.find((b) => b.slot === `shout${i + 1}`);
    const q = shout ? blockToSlice(shout) : emptyQuote();
    const prev = out[out.length - 1];
    // Never two quote bands in a row: a quote with words replaces an empty one.
    if (!prev || !isQuote(prev)) out.push(q);
    else if (!prev.primary.text && q.primary.text) out[out.length - 1] = q;
  });
  out.push(...blocks.filter((b) => b.slot === 'proof').map(blockToSlice));
  return out;
}

const related = (next: { label: string; href: string; blurb?: string }[]) =>
  next
    .filter((n) => n.href !== '/contact/')
    .map((n) => ({
      link: linkTo(n.href),
      label: navLabelFor.get(n.href) === n.label ? '' : n.label,
      blurb: n.blurb ?? '',
    }));

const common = (p: any) => ({
  nav_label: p.navLabel,
  title: p.title,
  standfirst: p.standfirst ?? '',
  lead: p.lead ?? '',
  summary: p.summary ?? '',
  banner: banner(p.banner?.src),
  banner_focus: p.banner?.focus ?? 'centre',
  icon: p.icon ?? '',
  meta_title: '',
  meta_description: '',
});

/* ---------- documents ---------- */

for (const p of products) {
  migration.createDocument(
    {
      type: 'product',
      uid: p.slug,
      lang: LANG,
      data: {
        ...common(p),
        site_label: p.externalSite?.label ?? '',
        site_link: p.externalSite?.href ? { link_type: 'Web', url: p.externalSite.href, target: '_blank' } : { link_type: 'Any' },
        slices: sectionSlices(p.blocks, ['context', 'problems', 'how', 'use']),
        show_social_proof: true,
        testimonial_theme: p.testimonialTheme ?? 'working with EdCo',
        related: related(p.next),
      },
    } as any,
    p.navLabel
  );
}

for (const c of capabilities) {
  migration.createDocument(
    {
      type: 'capability',
      uid: c.slug,
      lang: LANG,
      data: {
        ...common(c),
        slices: sectionSlices(c.blocks, ['context', 'problems', 'use']),
        show_social_proof: true,
        testimonial_theme: c.testimonialTheme ?? 'working with EdCo',
        related: related(c.next),
      },
    } as any,
    c.navLabel
  );
}

for (const o of outcomes) {
  const route = model.routes.find((r: any) => r.objective === o.routeObjective);
  const shout = (i: number) =>
    o.shouts?.[i] ? slice('quote', { text: o.shouts[i].text ?? '', supporting_line: o.shouts[i].sub ?? '' }) : emptyQuote();
  const slices = [
    slice('text_block', { heading: '', body: paragraphs(o.intro) }),
    shout(0),
    slice('item_list', {
      heading: o.helpTitle,
      intro: '',
      items: o.help.map((t: string, i: number) => ({ text: t, icon: o.helpIcons?.[i] ?? '' })),
    }),
    shout(1),
    slice('how_we_do_it', {
      heading: route.objective,
      intro: 'One example of how it could come together — not a fixed process. Each step takes you to where we do it.',
      steps: route.steps.map((label: string, i: number) => ({ label, link: linkTo(route.stepHrefs[i]) })),
    }),
    shout(2),
  ];
  migration.createDocument(
    {
      type: 'outcome',
      uid: o.slug,
      lang: LANG,
      data: {
        ...common(o),
        slices,
        show_social_proof: true,
        testimonial_theme: 'EdCo challenging the original brief',
        // Other outcomes, in order; label and description come from each page.
        related: outcomes
          .filter((x: any) => x.slug !== o.slug)
          .map((x: any) => ({ link: () => migration.getByUID('outcome', x.slug), label: '', blurb: '' })),
      },
    } as any,
    o.navLabel
  );
}

let last = '';
await writeClient.migrate(migration, {
  reporter: (event: any) => {
    const line = `${event.type}${event.data?.current ? ` ${event.data.current}/${event.data.total}` : ''}`;
    if (line !== last && !/progress/i.test(event.type)) console.log(line);
    last = line;
  },
});
console.log('Imported into the migration release. Publishing…');
await writeClient.publishMigrationRelease();
console.log('Published.');
