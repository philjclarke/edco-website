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

### The one rule

**"New copy" is the instruction.** Filled in, it says what that field should
say. Empty, it says nothing at all and that field is left alone.

Everything follows from that:

- **To change something**, type the new wording into *New copy*.
- **To change it back**, type the previous wording into *New copy*. Clearing the
  cell does not undo a publish — it just means "no instruction".
- **You can publish as often as you like.** Once a change is live, that row
  stops producing a change because the site already says it. Leave *New copy*
  filled or clear it; neither matters.

**"Current copy" is only a reference.** It's a printout of what the site said
when the deck was made, and nothing typed there is ever published. It goes out
of date as you publish — that's expected. If something does get typed over it by
mistake, the console says so rather than losing it quietly.

### Things worth knowing

**Nothing is published until you press the button.** Editing the sheet changes
nothing on the website.

**You can only change words.** Page addresses, links, layouts and which sections
exist are not editable from the deck — so nothing typed there can break a page.

**Every publish is recorded** — who, when, and exactly what changed. The last
five are listed at the bottom of the console, and any of them can be undone.

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

It is *not* used to decide what publishes — only *New copy* does that, which is
what keeps the rules predictable and the deck usable indefinitely. The stamp
exists so the console can fetch the copy as it stood at export time and spot
wording typed over *Current copy*, which would otherwise be silently ignored.

Two earlier designs were wrong and are worth not repeating. Treating a stale
deck as invalid expired it the moment it was first used, because publishing
itself moves the site on. Falling back to *Current copy* when *New copy* was
empty made an empty cell mean two things, and made reverting a published change
impossible.

**Re-exporting is therefore a convenience, not a requirement** — it refreshes the
*Current copy* column so it reads true again.

Re-importing uses *Replace spreadsheet*, which wipes the sheet, so `csv` reads
the live deck first and carries any filled-in *New copy* and *Notes* across into
the new export, matched on `Ref`. Unpublished edits survive a re-import.
`--no-carry` skips that if a clean sheet is genuinely wanted.

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
| `DECK_CSV_URL` | The sheet's URL. Either the `/edit` link from the browser or the `/export?format=csv` form — an edit link is rewritten automatically. |

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
