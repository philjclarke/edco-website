# Publishing copy changes

EdCo edit wording in the copy deck, then publish it themselves. Nobody needs the
repo, and nothing about the layout can be changed this way.

- **Copy deck** — [the Google Sheet](https://docs.google.com/spreadsheets/d/1tIJqD10Xente09Q4pjejPsd7qyaYfcGevYmNA3Sbj4o/edit)
- **Publish console** — `/admin` on the live site

---

## For whoever is editing

1. Open the copy deck and type the new wording into the **New copy** column.
   Leave anything you aren't changing blank.
2. Go to `/admin` and sign in.
3. Read the list of changes. Each one shows the old wording struck through and
   the new wording underneath.
4. Put your name in and press **Publish**.

The site rebuilds and the new wording is live in about a minute.

### Things worth knowing

**Nothing is published until you press the button.** Editing the sheet changes
nothing on the website.

**You can only change words.** Page addresses, links, layouts and which sections
exist are not editable from the deck — so nothing typed there can break a page.

**If the console says the deck is out of date**, stop and ask for a fresh
export. It means the website changed after the deck was made, so the sheet no
longer knows what the site currently says. Publishing anyway would undo those
changes, which is why the button disappears. Anything already typed into *New
copy* survives a re-export.

**Every publish is recorded** — who, when, and exactly what changed. The last
five are listed at the bottom of the console, and any of them can be undone.

---

## For whoever maintains it

### How it works

The deck is compared against the copy that is committed in GitHub. Differences
become a commit to `src/data/copy/*.json`, which Vercel picks up and rebuilds
from. Git is the source of truth throughout: there is no separate content
database, and every publish is an ordinary commit with a diff and an author.

`src/lib/deck.ts` holds the comparison logic, shared with
`scripts/copy-deck.mjs` so the console and the command line agree.

### The export stamp

Every CSV export carries the commit it was taken from, in a `__meta__` row.
Before publishing, the console checks that stamp against the live commit for
`src/data/copy`. If they differ, publishing is refused — in the console and
again in the API, because a hidden button is not a safety mechanism.

This exists because it nearly went wrong: a deck exported before a week of edits
would have reverted all of them, and nothing in the sheet showed that.

**So: re-export and re-import the sheet after any copy change made from the
repo.**

```bash
node scripts/copy-deck.mjs csv     # writes copy-deck.csv, stamped with HEAD
```

Then in Sheets: File → Import → Upload → **Replace spreadsheet**.

### Environment variables

Set in the Vercel project, not in the repo. `.env.example` lists them.

| Variable | What it is |
| --- | --- |
| `ADMIN_PASSWORD` | Shared password for `/admin` |
| `AUTH_SECRET` | Any long random string; signs the session cookie. `openssl rand -base64 32` |
| `GITHUB_TOKEN` | Fine-grained PAT, **this repository only**, Contents: read and write |
| `GITHUB_REPO` | `philjclarke/edco-website` |
| `GITHUB_BRANCH` | `main` |
| `DECK_CSV_URL` | The sheet's CSV export URL |

The sheet must stay shared as *anyone with the link can view* for the console to
read it.

### Local development

`npm run dev` runs everything including `/admin`, given a `.env` file.
`astro preview` no longer works — an adapter disables it — so `npm run preview`
serves the built static output instead. The admin routes need `vercel dev` or a
real deployment.

### If something goes wrong

Every publish is a commit. `git revert <sha>` and push, or use Vercel's instant
rollback. The console lists recent publishes with links.
