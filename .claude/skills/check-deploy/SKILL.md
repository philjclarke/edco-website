---
name: check-deploy
description: Check whether the EdCo site's Vercel deploy succeeded, and investigate failed or missing deploys. Use after pushing, or when someone reports failed deploys or a Prismic change not appearing.
---

# Checking a deploy

The site is a Vercel project in EdCo's team (Pro plan), https://edco-website.vercel.app. www.educationcompany.co.uk is still the old site. Builds run on every push to `main` and on every Prismic publish, through a deploy hook.

## A pushed commit

Neither `gh` nor the Vercel CLI is installed, and the repo is public, so read the commit's status from GitHub:

```sh
curl -s https://api.github.com/repos/philjclarke/edco-website/commits/$(git rev-parse HEAD)/status \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['state']); [print(s['context'], s['state'], s.get('target_url')) for s in d['statuses']]"
```

`pending` means it's still building (usually 1 to 2 minutes). Check again rather than guessing. Report what it says.

Don't go looking for Vercel credentials or auth files. The build logs are in the Vercel dashboard; ask the user for the error text if it's needed.

## A failed or missing build

A Prismic publish rebuilds `main` with the content just published, so a failure there doesn't show on any commit. Reproduce it locally: `npm run build` reads the same published content. Look for:

- **"Left out the … page"** warnings. A page without a web address, or with an address another page already has. The build carries on; tell the user which page, so the editor can fix it in Prismic.
- **"still has its old fields rather than components"** (src/lib/pages.ts). This stops the build on purpose.
- Errors from a component meeting content it doesn't expect, such as an empty field. Fix the component to cope, rather than the content.

Expected and harmless: the astro-icon "src/icons" warning, and "The collection caseStudies does not exist or is empty".

## A change that isn't showing

- Publishing in Prismic, not just saving, triggers the build.
- The Prismic CDN can lag a few seconds, and a build that starts at that moment may get the old content. Publishing again fixes it.
- Pages listed by hand (How we do it, Outcomes components) only show the pages picked there, and only once those pages are published.
