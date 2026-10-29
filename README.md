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
| Every page built from components: the homepage, the top-level page of each section and the pages below it, insights, opinion, provision blueprints, Contact, For Educators, Free customer analysis, Customer login | One page type each (see below) | [pages.ts](src/lib/pages.ts), [PageView.astro](src/components/PageView.astro) |
| Case studies hub, Search, 404 | One single-instance type each, with fixed fields | [pageCopy.ts](src/data/pageCopy.ts) |
| The Listen → Grow model, proof figures, logo list, themes | `site_settings` | [pageCopy.ts](src/data/pageCopy.ts), then `model.ts`, `proof.ts` |
| Case studies | `case_study` | content collection `caseStudies` |
| Main menu, and the footer's section lists | Each section page's "Show in main menu" and "Menu order" (Preview tab) | [menu.ts](src/lib/menu.ts) |
| The menu's top level, the footer's extra links, contact details | Code: [site.ts](src/data/site.ts), [pageTypes.ts](prismic/pageTypes.ts) | |
| Mock testimonials, logos and quotes | Code: [mock.ts](src/data/mock.ts) | |

## Prismic

Repository `66bbee42` (“EdCo Website”), https://66bbee42.prismic.io. Pages are
built from **published** content, so a change appears after the next build,
which publishing triggers automatically. The editor guide for EdCo is at
https://claude.ai/artifact/CQ92WZ2jERv9PMoxJUya5Y.

- **Content models are code**, typed against `@prismicio/client`:
  - [prismic/pageTypes.ts](prismic/pageTypes.ts): the page types, each with its
    address and the section it sits in.
  - [prismic/models.ts](prismic/models.ts): their fields and the components.
  - [prismic/specs.ts](prismic/specs.ts): fields for the pages still built
    from fixed fields, and the settings. The same spec turns their content
    back into the shape the templates read ([prismic/shape.ts](prismic/shape.ts)).

  Change any of them, then push with `node --env-file=.env scripts/prismic.ts push`
  (`status` shows what would change). This uses Prismic's Types API directly,
  because the Prismic CLI only works in Next.js, Nuxt and SvelteKit projects.
  Don't edit types in Prismic's own Types screens: a push overwrites them.
- **Page types** follow EdCo's component deck (“EdCo Website Components”, Oct 2026).
  Each section has its own types, even where they're identical for now, so each
  can grow its own fields later:

  | Section | Top-level page | Pages below it |
  | --- | --- | --- |
  | Home | `home_page` | |
  | What are you trying to achieve | `outcomes_hub` | `outcome` (`/<name>/`) |
  | Products | `products_hub` | `product` |
  | Insights & Opinion | `what_we_think_page` (`/insights/`) | `insights_section`, and the articles `insight` and `opinion`, all at `/insights/<name>/` |
  | Capabilities | `capabilities_hub` | `capability` |
  | About | `about_page` | `about_subpage` |
  | Agencies & Partners | `agencies_page` | `agencies_subpage` |
  | Not in the menu | | `provision_blueprint` (`/provision-blueprints/<name>/`) |
  | One page each, not in the menu | `contact_page`, `for_educators_page`, `free_analysis_page`, `customer_page` | |

  The last four have no site-wide call to action at the foot (`closingCta:
  false` in pageTypes.ts); a page can still add a Call to action component.

  Every one has the same anatomy: a **Page** tab holding only its components, a
  **Preview** tab and an **SEO** tab. The **Preview** tab (title, positioning
  statement, introduction text, interest tags, icon, preview image, link label;
  plus date, author and status on articles) is how the page appears wherever
  another page links to it: How we do it, Outcomes we can help with, Content
  listings, related links and the breadcrumb. One place to edit it.
  A Prismic page that still has its pre-component fields stops the build
  (`assertComponents` in [pages.ts](src/lib/pages.ts)) rather than publish it broken.
- **Components** (Prismic calls them slices), in the deck's order:
  - **Banner** (variations Page and Homepage): title, positioning statement,
    introduction text, banner image. On a page below a section it shows the
    breadcrumb; on an insight or opinion it becomes the article header.
  - **Explainer text** (Layout: Standard, Heading beside text or Wide; Text
    size: Large or Standard; both ignored in an article's body), **Quote** (variations One column and Two column, the
    latter with optional client logos), **Outcomes we can help with**,
    **Content listing** (variations Chosen, Latest and Links), **How we do it**,
    **Screenshots**, **Features listing** (Layout: Standard, or Heading beside
    list), **Figures** (a heading and text over
    a row of figures; its own figures, or Site settings' proof figures if it
    has none; kept from before the deck at EdCo's request).

  Their renderers are in [src/components/slices/](src/components/slices/);
  [Slices.astro](src/components/Slices.astro) dispatches them. Explainer
  text, Features listing and Screenshots go through the block shapes in
  [blocks.ts](src/data/blocks.ts) ([src/lib/slices.ts](src/lib/slices.ts)),
  and runs of them share a background.
- **Earlier components:** Statement, Comparison, How EdCo works (its own stages, or Site settings' model if it
  has none), Page cards,
  Link words, Logo wall, Latest articles, Link cards, Cards, Steps (with
  optional text, a button and a background), Options, Routes and Call to
  action. They predate the deck; EdCo asked to keep them all as ordinary
  components ([src/components/sections/](src/components/sections/)).
- **Page components**, offered only on their own page (`pageComponents` in
  models.ts): **Contact form** (the enquiry form and its side panel; the
  wording is editable, the fields and the outcome tick boxes are code) and
  **Customer logins** (the customer area's heading, logins, support and
  account manager boxes).
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
  uses: `PageView` for every page built from components (found by its address),
  `CaseStudyView` for case studies, and the page files for the rest.

  Pages and components read content through [src/lib/pages.ts](src/lib/pages.ts)
  (`pages`) and [src/lib/content.ts](src/lib/content.ts) (`siteCopy`, `siteSettings`). These return published content in the static
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
- **The main menu** is built at each build ([src/lib/menu.ts](src/lib/menu.ts)).
  The top level is one link per section's top-level page, in the order of
  `prismic/pageTypes.ts`, labelled with its Preview title. Under each go the
  section's pages with **Show in main menu** ticked, by **Menu order** (lower
  first, blank last, then oldest first). Outcomes, products, capabilities and
  Insights & Opinion sections start ticked; About and Agencies & Partners
  pages start unticked (`inMenu` in pageTypes.ts). The footer repeats the
  outcomes, products and capabilities lists. The same order is used wherever
  the site lists those pages.
- **Checking content before it's published:** `PRISMIC_REF` (and
  `PRISMIC_ACCESS_TOKEN`, for a release) build from that ref instead of the
  published content. Local use only.
- **Old addresses:** What We Think became Insights & Opinion on 27 October 2026;
  `/what-we-think/…` redirects ([src/pages/what-we-think/](src/pages/what-we-think/)).
- **History.** The content was restructured into components on 27 October 2026
  by [prismic/restructure.ts](prismic/restructure.ts). It was imported on 26 October 2026 from the JSON and
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
