---
name: prismic-models
description: Change what editors see in Prismic for the EdCo site — add or change a field, component (slice) or page type — and push it. Use whenever a request needs a new or different field in Prismic.
---

# Changing the Prismic models

The models are code. Prismic's Type Builder screens are never edited by hand: anything changed there is overwritten by the next push, and the site wouldn't know how to show it.

## Where things are

- `prismic/pageTypes.ts`: the page types, their addresses (`path`), breadcrumb `parent`, and `inMenu` (whether "Show in main menu" starts ticked).
- `prismic/models.ts`: every page type's fields (`pageType()`: Page, Preview and SEO tabs) and every component (`slice(...)`). The deck's components are in `components`; the ones the site had before the deck are in `earlierComponents`. Both are offered to editors.
- `prismic/specs.ts`: the single-instance pages with fixed fields (Contact, For Educators and others) and `site_settings`.
- `src/lib/slices.ts` maps a component's Prismic fields to the site's blocks (`src/data/blocks.ts`). `src/components/Blocks.astro` and `src/components/sections/` render them.

## Steps

1. Edit the model. Use the helpers at the top of models.ts: `text`, `prose`, `select`, `boolean`, `number`, `group`, `link`, `pageLink`, `image`. Fields are flat in Prismic whichever tab they sit on, so moving a field between tabs keeps its content. **Renaming a field's id loses its content**: change only the label.
2. Make the site read the new field, with a sensible fallback for pages saved before it existed. Prismic returns old pages without the field, or with it as null.
3. `npx astro check`. Five `slice.variation` errors (Slices.astro, Banner.astro, ContentListing.astro) already existed; nothing new should appear.
4. `node --env-file=.env scripts/prismic.ts status` shows what will change, then `node --env-file=.env scripts/prismic.ts push`. Mention any "In Prismic but not in models.ts" output; never delete it.
5. `npm run build` and look at the pages concerned (see the `edco-change-request` skill).
6. Update the README's component list or "Where the content lives", and the editor guide (see below).

## Rules

- **Never print** `.env`, `PRISMIC_WRITE_TOKEN` or `~/.npmrc`. The write token lives only in the git-ignored `.env` and must never be added to Vercel. Builds read the public Content API without one.
- Labels and placeholders are what editors read: plain words, no jargon. The deck's own name for a thing wins.
- Don't call any component deprecated; EdCo use all of them.

## The editor guide

EdCo's guide is a private artifact: https://claude.ai/artifact/CQ92WZ2jERv9PMoxJUya5Y. In a new session, read it with the Artifact tool (`action: "read"`), edit the saved copy and publish it back to the same `url`. Keep its plain style: what the field does for the page, not how it's built.
