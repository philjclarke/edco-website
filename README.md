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
| `src/data/capabilities.ts` | Ten capabilities, four with full pages (§34–43) | Repeatable "capability" type |
| `src/data/model.ts` | The Listen→Grow model, beliefs, joined-up routes | Settings / repeatable |
| `src/data/proof.ts` | Stats, logo candidates, testimonial and case themes | Settings / repeatable |
| `src/data/blocks.ts` | The five-block page vocabulary | Component / blocks model |
| `src/content/articles/` | What We're Hearing, Opinion, Research & Insight | "Post" type |
| `src/content/case-studies/` | Case studies | "Case study" type |

Product and capability pages are assembled from five block types only — `prose`, `list`,
`steps`, `pull`, `cards`. Keeping that vocabulary small is what makes the pages consistent
and gives a CMS an obvious components model. Adding a sixth type should need two pages to
genuinely want it.

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

See `OUTSTANDING.md`. In short: `/resources/`, `/events/`, six capability detail pages,
interactive diagnostics, and real case-study content are phase 2. Every one of them has a
route reserved or a placeholder on the page that will hold it.
