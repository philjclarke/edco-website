---
name: edco-change-request
description: Handle a change request for the EdCo website, often relayed from Jason at EdCo — make it, check it in the browser, ship it and explain it. Use for any feedback or "can you change…" request about the site.
---

# Handling a change request

Requests usually arrive as Jason's words, often with a Prismic screenshot. Work out what he's trying to do, not just what he asked for. If the cause is content (a draft not published, a page missing its web address), say so plainly instead of changing code.

## Steps

1. **Find the cause.** Components are in `src/components/` (slices in `slices/`, sections in `sections/`), page types in `prismic/`, and menus in `src/lib/menu.ts` and `src/data/site.ts`. For content questions, read Prismic (see the `prismic-content` skill).
2. **Make the change** in the surrounding code's style: Tailwind 4 classes, comments that explain why, and labels in EdCo's own words. A new field means the `prismic-models` skill.
3. **Build:** `npm run build`. It must finish. Read any new "Left out" warnings.
4. **Look at it.** Serve the build (`npx --yes serve -l 4400 .vercel/output/static`) and take screenshots with puppeteer-core from a script in the scratchpad (Chrome is at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). Check 1024px, a wide desktop and about 390px phone width, and check `document.documentElement.scrollWidth` doesn't exceed the viewport. Headless screenshots can show a hover dropdown half-faded; check it with `elementFromPoint` before treating it as a bug.
5. **Commit and push to `main`.** Messages are one short sentence in plain words, e.g. "Make the closing call to action white", with a body only if the why isn't obvious.
6. **Check the deploy** (the `check-deploy` skill).
7. **Update the docs** that describe what changed: README.md, OUTSTANDING.md, and the editor guide if editors will see a difference (see `prismic-models`).
8. **Reply** with what changed and anything Jason needs to do in Prismic, in plain words he can pass on.

## Things to keep in mind

- EdCo's people edit in Prismic while you work. Don't overwrite their content without asking; say what you'd change.
- The closing call to action is added to every page automatically unless the page has its own Closing call to action component.
- Article pages (insights, opinion) ignore layout options on Explainer text.
