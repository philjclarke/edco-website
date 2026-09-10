# EdCo website — phase 1

A new corporate site for The Education Company, built to the *EdCo Website — Master Brief*
(Sept 2026). Static, fast to change, and deliberately not committed to a CMS.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site into dist/, then builds the search index
npm run preview  # serve dist/
npm run check    # type-check
```

Node 22 (pinned via Volta in `package.json`).

## Why this stack

The brief withholds the CMS and framework decision, so the build has to survive whichever
way that goes. Astro produces plain static HTML with no client-side framework, and its
content collections force the content model to be declared up front — that declaration is
what a CMS gets mapped onto later. Nothing here assumes a backend.

- **Astro 5** — static output, zero JS shipped except the nav toggle and the contact-form
  deep link.
- **Tailwind 4** — design tokens live in `src/styles/global.css` under `@theme`.
- **Pagefind** — search index built from the output at build time. No search service,
  no API key, works on any static host.

## Where the content lives

Content is separated from templates so that moving it into a CMS is a mapping exercise
rather than a rewrite.

| File | What it holds | Likely CMS shape |
| --- | --- | --- |
| `src/data/site.ts` | Navigation, footer, contact, global CTAs | Settings singleton |
| `src/data/outcomes.ts` | The six outcome routes (brief §21–26) | Repeatable "outcome" type |
| `src/data/products.ts` | The five products (§28–33) | Repeatable "product" type |
| `src/data/capabilities.ts` | Eight capabilities, all with full pages (§34–43) | Repeatable "capability" type |
| `src/data/model.ts` | The Listen→Grow model, beliefs, joined-up routes | Settings / repeatable |
| `src/data/proof.ts` | Stats, logo candidates, testimonial and case themes | Settings / repeatable |
| `src/data/blocks.ts` | The five-block page vocabulary | Component / blocks model |
| `src/content/articles/` | What We're Hearing, Opinion, Research & Insight | "Post" type |
| `src/content/case-studies/` | Case studies | "Case study" type |

Product and capability pages are assembled from five block types only — `prose`, `list`,
`steps`, `pull`, `cards`. Keeping that vocabulary small is what makes the pages consistent
and gives a CMS an obvious components model. Adding a sixth type should need two pages to
genuinely want it.

## The copy deck

All the site's words live in `src/data/copy/*.json`, and there is a **copy deck**
— a Google Sheet — where EdCo can edit them without touching the repo.

    https://docs.google.com/spreadsheets/d/1tIJqD10Xente09Q4pjejPsd7qyaYfcGevYmNA3Sbj4o/edit

760 fields across 25 pages, one row per field. Editing the deck does **not**
change the live site; the sync is deliberate:

```bash
node scripts/copy-deck.mjs apply-csv     # live sheet -> src/data/copy/
node scripts/copy-deck.mjs csv           # repo -> copy-deck.csv (re-seed the sheet)
```

`apply-csv` reads the sheet directly over Google's CSV export endpoint, so there
is no download step — but that endpoint only works while the sheet is shared as
*anyone with the link can view*. Pass a file path instead if it ever has to be
private.

The sheet has a **Current copy** column and an empty **New copy** column. Only
rows with something in *New copy* are applied, so a reviewer can work through it
a page at a time and unfinished rows are ignored. The `Ref` column maps a row
back to a field and must not be edited — it is protected in the sheet.

Structural fields — `slug`, `href`, `page`, `type`, `columns`, `verified` — are
never exposed to the deck and never written back, so no edit made there can break
a route or a layout. Everything under `src/content/` (articles, case studies) is
edited as markdown in the repo, not in the deck.

**Pushing edits live**: `apply-csv`, `npm run build` to check, commit, push. Then
re-run `csv` and re-import if the sheet needs its *Current copy* column brought
back in line with what shipped.

There is also a JSON form of the same data, used to seed a database-backed
editor:

```bash
node scripts/copy-deck.mjs pack          # repo  -> .copy-deck/
node scripts/copy-deck.mjs apply <dir>   # deck  -> src/data/copy/
```

## Placeholders

Brief §77 requires live copy to be visually distinct from content still being sourced.
Every placeholder renders through one component:

```bash
grep -rn "<Placeholder" src/          # every outstanding content item
grep -rn "verified: false" src/data/  # every unconfirmed statistic
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

- **In a grid** — a small icon on the line, inheriting the text colour. Used on
  the Listen→Grow model.
- **In a panel** — a gradient disc above the title. Used on the outcome,
  product and capability cards, where it replaces the numeral (a card carries
  one marker, not two, and those sets are options rather than sequences).

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
