# EdCo website — phase 1

A new corporate site for The Education Company, built to the *EdCo Website — Master Brief*
(Sept 2026). Static and fast, with content managed in **Prismic**.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # builds into .vercel/output/, then the search index
npm run preview  # serve the built static output
npm run check    # type-check
```

Every page is prerendered to HTML from published Prismic content. The only
routes that run on request are Prismic's draft previews and the slice
simulator's render route (see *Prismic* below).

Node 22 (pinned via Volta in `package.json`).

## Why this stack

- **Astro 5:** static output, zero JS shipped except the nav toggle and the contact-form
  deep link.
- **Tailwind 4:** design tokens live in `src/styles/global.css` under `@theme`.
- **Pagefind:** search index built from the output at build time. No search service,
  no API key, works on any static host.
- **Prismic:** hosted headless CMS. Editors get their own logins, a media library,
  previews and scheduling. Content models are kept in code (below).

## Where the content lives

| Content | In Prismic as | Read by |
| --- | --- | --- |
| Product, capability and outcome pages | Page types `product`, `capability`, `outcome`, built from slices | [sectionPages.ts](src/data/sectionPages.ts), [PrismicPage.astro](src/components/PrismicPage.astro) |
| Homepage | `home_page`: banner fields plus sections (slices) | [pageCopy.ts](src/data/pageCopy.ts), [index.astro](src/pages/index.astro) |
| Hubs, About, Agencies & Partners, Contact, For Educators, Free customer analysis, Customer login, Search, 404 | One single-instance type each (`about_page` …) | [pageCopy.ts](src/data/pageCopy.ts) |
| The Listen → Grow model, beliefs, proof figures, logo list, themes, What We Think streams | `site_settings` | [pageCopy.ts](src/data/pageCopy.ts), then `model.ts`, `proof.ts`, `streams.ts` |
| Insights articles | `article` | content collection `articles` ([content.config.ts](src/content.config.ts)) |
| Case studies | `case_study` | content collection `caseStudies` |
| Navigation, footer, contact details | Code: [site.ts](src/data/site.ts) | |
| Mock testimonials, logos and quotes | Code: [mock.ts](src/data/mock.ts) | |

## Prismic

Repository `66bbee42` (“EdCo Website”), https://66bbee42.prismic.io. Pages are
built from **published** content, so a change appears after the next build,
which publishing triggers automatically. The editor guide for EdCo is at
https://claude.ai/artifact/CQ92WZ2jERv9PMoxJUya5Y.

- **Content models are code**, typed against `@prismicio/client`:
  - [prismic/models.ts](prismic/models.ts): page types and slices.
  - [prismic/specs.ts](prismic/specs.ts): fields for the single-instance
    pages and settings. The same spec turns their content back into the shape
    the templates read ([prismic/shape.ts](prismic/shape.ts)), so their layouts
    stay in code.

  Change either, then push with `node --env-file=.env scripts/prismic.ts push`
  (`status` shows what would change). This uses Prismic's Types API directly,
  because the Prismic CLI only works in Next.js, Nuxt and SvelteKit projects.
  Don't edit types in Prismic's own Types screens: a push overwrites them.
- **Slices** (page sections) on the homepage and product, capability and outcome pages:
  - **Content sections:** Text, Quote, List, Screenshots, Cards, Steps,
    Options and HowWeDoIt.
    [src/lib/slices.ts](src/lib/slices.ts) translates them into the block shapes
    in [blocks.ts](src/data/blocks.ts) for the existing section components, and
    runs of them share a background.
  - **Self-contained sections:** Statement, Comparison, Figures, HowItWorks,
    PageCards, LinkWords, LogoWall, LatestArticles and LinkCards
    ([src/components/sections/](src/components/sections/)). Each renders its
    own full-width section with a Background choice (white, grey, navy). Figures,
    HowItWorks and LogoWall draw their content from Site settings, PageCards from
    the page lists, and LatestArticles from Insights.
  - **Placeholders:** text in square brackets, like `[VERIFIED METRIC: 28 years]`,
    or a card titled `[CURRENT EVENT]`, renders as a placeholder chip
    ([src/lib/placeholders.ts](src/lib/placeholders.ts)).
- **Reading content:** [src/lib/prismic.ts](src/lib/prismic.ts) has the client,
  links, images and rich text. Links to this site’s own addresses are made
  relative, so they work on preview builds too.
- **Images** are served from Prismic's image CDN at the sizes the page asks for.
- **Icons** typed into Prismic are checked against the installed sets
  ([src/lib/icons.ts](src/lib/icons.ts)). An unknown name is dropped with a build
  warning rather than failing the build.
- **Previews** work for every page type. Prismic's Preview button goes to
  `/api/preview`, which stores the preview session in Prismic's cookie and
  redirects to `/preview/<published address>`. That route sets
  `Astro.locals.prismicPreview` and renders the same template the published page
  uses:
  - the homepage, hub and single pages are rendered from their page files;
  - articles and case studies through `ArticleView` / `CaseStudyView`;
  - section pages through `PrismicPage`.

  Pages and components read content through [src/lib/content.ts](src/lib/content.ts)
  (`siteCopy`, `siteSettings`). These return published content in the static
  build, and content at the preview's ref while previewing, fetched once per
  request. The layout adds `noindex`, Prismic's toolbar (which reloads on save)
  and an "Exit preview" bar. Site settings open on the homepage. The preview
  URLs registered in Prismic are the live site and `localhost:4321`.
- **Live previews in the Page Builder** use the slice simulator at
  `/slice-simulator/`. Prismic sends the sections being edited to that page in
  the browser. It posts them to `/slice-simulator/render`, which renders them
  with the site's own components, and swaps the HTML in. The render route only
  answers that page's own requests ([src/lib/http.ts](src/lib/http.ts)). The
  simulator only accepts messages from `*.prismic.io`.
- **Publishing** fires a Prismic webhook to a Vercel deploy hook, which rebuilds
  `main`. The hook URL is stored only in Prismic.
- **Hub and menu order** follows the menu in `src/data/site.ts`. A new page
  goes at the end until it's added there.
- **History.** The content was imported on 26 October 2026 from the JSON and
  Markdown files that used to hold it. Those files, the import scripts, the
  Google Sheet copy deck and the `/admin` publish console it fed are in git
  history before commit "Retire the copy deck and /admin".

## Mock proof

While EdCo's copy is outstanding, empty shout-out bands and every testimonial
show **invented** quotes, and the logo wall shows invented organisations, from [src/data/mock.ts](src/data/mock.ts), so the design
can be judged in full. The names, roles and organisations are deliberately fake
("Alex Example, Head of Example Partnerships, Sample Learning Ltd"). The mocks
aren't in Prismic, they're kept out of site search, and real copy replaces
them where it exists. **Before launch, set `MOCK_PROOF` to `false`:** every mock
then shows as a visible placeholder again. Running
`grep -rl data-mock .vercel/output/static` lists the pages still showing them.

## Snapshots

`/v1/` (16 September 2026) and `/v2/` (26 October 2026, before the move to Prismic)
are frozen copies of the whole site, so old and new can be compared side by side. It's
plain HTML in `public/v1/` with its own copies of the CSS and images. Nothing links
to it, it's `noindex`, and it's left out of the sitemap and site search. Prismic
doesn't touch it, and it never changes. Each page has a bar at the top that
links to the same page on the live site, and `/v1/pages/` lists every page.

To take another one, build first and then give the snapshot a new name:

```bash
npm run build && node scripts/snapshot.mjs v2
```

URLs on Vercel are case-sensitive, so the address is `/v1/`, not `/V1/`.

## Placeholders

Brief §77 requires live copy to be visually distinct from content still being sourced.
Every placeholder renders through one component:

```bash
grep -rn "<Placeholder" src/          # every outstanding content item
# unconfirmed figures: in Prismic, Site settings > Proof > Figures, "Verified" unticked
```

They render as dashed orange chips. Removing the styling in `src/components/Placeholder.astro`
hides them all at once — but the point is that anything still bracketed at launch is a
visible bug, not a quiet one.

**No client facts, metrics or testimonials have been invented anywhere in this build.**

## Design system

Derived from the 2024 logo and the *Do schools still need suppliers?* deck, not from a
written brand guideline. Anything marked `PROVISIONAL` needs EdCo sign-off.

- Navy `#0F1421` is the anchor. Dark sections carry the proposition; light sections carry
  editorial. That alternation is how the brand deck works, and it stops a long page reading
  as a generic dark SaaS template.
- The orange `#F7901F` → pink `#E8437F` gradient is the accent. It appears as the ribbon
  device, the rule under section heads, gradient text on standfirsts, and the single
  primary button per view. It is not a background.
- The looping ribbon (`src/assets/brand/ribbon-*.png`) is the signature graphic. Full
  strength beside copy on desktop, a 20% wash behind copy on mobile.
- Type is **Poppins** (display) and **Inter** (body), both provisional stand-ins loaded
  from Google Fonts. Swap for EdCo's licensed face and self-host.

### Icons

`astro-icon`, inlined as an SVG sprite at build — each unique glyph's path data
appears once no matter how often it's used, and **no JavaScript ships**. Icons
take `currentColor`, so they pick up the theme and the gradient for free.

```astro
<Icon name="fa6-solid:magnifying-glass" />   <!-- npm: @iconify-json/fa6-solid -->
<Icon name="my-glyph" />                     <!-- a file in src/icons/ -->
```

Font Awesome **Pro** is deliberately not a build dependency: the licence token
would have to live in Vercel's environment forever. Export any Pro glyph to
`src/icons/` instead and commit the SVG — same licence, hermetic build.

Two treatments, and only two:

**The icon always sits above the heading**, never on the line with it — on the
line it competes with whatever else is there.

- **In a grid** — the bare glyph in the accent colour. Used on the Listen→Grow
  model.
- **In a panel** — the glyph in a gradient disc. Used on the outcome, product
  and capability cards, where it replaces the numeral (a card carries one
  marker, not two, and those sets are options rather than sequences).

Because an icon is a name, changing one is a text instruction rather than an
asset request. Browse at icones.js.org.

### Banner photography

`BannerImage` treats hero photography in CSS, so nothing needs opening in an
image editor and nothing has to be aligned by hand.

| Prop | Effect |
| --- | --- |
| `treatment="fade"` | The photo dissolves into the section ground on its left edge. Works with any crop. |
| `treatment="shape"` | Clipped into a curve echoing the ribbon, in `objectBoundingBox` units so it scales. |
| `duotone` | Brand gradient blended through via `mix-blend-mode: luminosity` — pulls any stock shot onto the palette. |
| `focus` | Which part of the photo survives the crop. |

Images live in `src/assets/banners/` and are named in `src/data/banners.ts`, so
the copy JSON refers to one by key. **Every image must be registered there** —
an unknown key throws at build rather than rendering an empty hero, which is a
mistake that is otherwise silent.

Every hero uses `fade` with `duotone`. The ribbon remains as the fallback when a
page has no photography, and as the decorative wave on the homepage, but it is
no longer the hero device.

An editor never handles a file: they describe the shot, it gets sourced and
named in a line of JSON.

### Shape says whether a thing is clickable

The one rule to hold on to. It came out of review — pills were being used for
process steps that went nowhere, so people tried to click them.

| | Panel | Grid |
| --- | --- | --- |
| Means | this goes somewhere | this is just information |
| Form | own border, radius, gap between siblings | flush cells, shared hairlines, one outer radius |
| Hover | lifts, gradient rule wipes across the top | none |
| Built by | `Card.astro` (with `href`), `NextSteps.astro` | `Grid.astro`, `ProcessGrid.astro`, `TickList.astro` |

Both take `tone="dark" | "light"`, because either can land on a navy or a paper
section and the hairline has to come from the right palette.

`ProcessGrid` is the sequence variant: numbered cells, no arrows. Anything that
is a series of steps — "How it runs", the joined-up routes, the customer-analysis
process — uses it, and none of them look like buttons any more.

The trap when adding a Grid by hand is a part-filled last row: a `gap-px` over a
coloured background leaves a stray block where a cell would have been.
`Grid.astro` avoids it by having each cell draw its own bottom and right
hairline and pull it back a pixel, so the count never matters. Use the component
rather than rebuilding the pattern.

## Structure

```
src/
  assets/brand/     logos, ribbon device, icons
  assets/images/    photography
  components/       ~15 components; ContentPage.astro drives product + capability pages
  content/          markdown — articles and case studies
  content.config.ts collection schemas
  data/             structured content (see table above)
  layouts/          Layout.astro — head, header, footer, skip link
  pages/            routes; [outcome].astro renders the six root-level outcome pages
  styles/global.css design tokens + component classes
```

## What isn't built yet

See `OUTSTANDING.md`. In short: `/resources/`, `/events/`, interactive diagnostics
and real case-study content are phase 2. Every one of them has a
route reserved or a placeholder on the page that will hold it.
