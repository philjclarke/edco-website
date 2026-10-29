---
name: prismic-content
description: Read or change EdCo's content in Prismic from a script — inspect pages, fill in fields, fix titles or web addresses — using the Content and Migration APIs. Use when content (not models) needs reading or changing in bulk, or when investigating what editors have published.
---

# Reading and changing Prismic content

Repository `66bbee42`. The Content API is public, so reading needs no token. Writing goes through the Migration API with `PRISMIC_WRITE_TOKEN` from `.env`, which you load with `node --env-file=.env` and never print.

## Scripts

Write scratch scripts in the session's scratchpad, not the repo. Import the client by absolute path, because a script outside the repo can't resolve the package:

```js
import * as prismic from '/Users/philjclarke/Documents/GitHub.nosync/edco-website/node_modules/@prismicio/client/dist/index.js';
const client = prismic.createClient('66bbee42');
```

(puppeteer-core is the other way round: it only resolves from the scratchpad.)

Reading: `client.dangerouslyGetAll({ filters: [prismic.filter.any('document.type', [...])] })`, `getByUID(type, uid)`, `getByID(id)`. Only published content is visible. Editors' drafts can't be seen.

## Writing

```js
const writeClient = prismic.createWriteClient(process.env.PRISMIC_REPOSITORY, { writeToken: process.env.PRISMIC_WRITE_TOKEN });
const migration = prismic.createMigration();
migration.updateDocument({ ...doc, data: { ...doc.data, field: value } }, title);
await writeClient.migrate(migration, { reporter: (e) => e.type === 'end' && console.log('done') });
await writeClient.publishMigrationRelease();
```

- **Try one page first.** Save its `data` to a file before and after, and diff them. Expect only your change, plus new `key` values on link fields in groups, which Prismic regenerates and which don't matter.
- **Ask before writing to EdCo's pages.** Editors (Jason) are working in Prismic. Publishing a migration publishes the page as you sent it, and an editor's older draft can later overwrite your change. Say what you changed so they can check.
- **The CDN lags** for a few seconds after publishing. Re-read in a loop with a fresh client. A stale read can return null fields, and writing those back fails with errors like "title must be a string": wait and retry.
- Publishing triggers a site rebuild (Prismic webhook to a Vercel deploy hook). The hook URL is only in Prismic; don't look for it.

## Things that catch people out

- `meta_title` (SEO tab) is the browser tab title without the site name: the layout adds " | EdCo". Leave it blank to use the Preview title.
- Repeatable pages need a web address (UID, first field on the Page tab). Pages without one, or with an address an older page already has, are left out of the build with a "Left out the … page" warning. Duplicated pages start without one.
- A page's Preview title (`nav_label`) is its name in menus, cards and breadcrumbs. Duplicated pages keep the original's title until someone changes it.
- The main menu comes from `show_in_menu` and `menu_order` on each section page (src/lib/menu.ts). Unset `show_in_menu` takes the type's default (`inMenu` in prismic/pageTypes.ts).
