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

### What happens to the sheet

**Nothing.** Publishing doesn't rewrite the deck: your wording stays in *New
copy*, and *Current copy* keeps showing what the site said when the deck was
made.

That's deliberate, and it doesn't cause a problem. Once a change is live, that
row simply stops producing a change — the site already says what the deck says.
You can publish again straight away, leave *New copy* filled in, or clear it.
None of it matters.

*Current copy* does drift out of date as you publish. It's only a reference, so
that's cosmetic — but it's why a fresh export is worth asking for every so
often, so the column reads true again.

### Things worth knowing

**Nothing is published until you press the button.** Editing the sheet changes
nothing on the website.

**You can only change words.** Page addresses, links, layouts and which sections
exist are not editable from the deck — so nothing typed there can break a page.

**If something "needs a decision"**, it means that wording was edited in the deck
*and* changed on the website since the deck was made. The console shows both and
publishes neither. Ask which is right.

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

### The export stamp, and the three-way merge

Every CSV export carries the commit it was taken from, in a `__meta__` row. That
stamp is the merge base: the console fetches the copy as it stood at that commit
and compares three versions rather than two.

| | Result |
| --- | --- |
| Edited in the deck, unchanged on the site | Published |
| Changed on the site, untouched in the deck | Left alone |
| Both changed, differently | Shown as a conflict, never published |

This is what keeps a deck usable indefinitely. A two-way comparison would have
had to refuse any deck the site had moved past — which, since publishing itself
moves the site on, meant the deck expired the moment it was first used.

A deck with **no stamp** can't be merged, because an edit and an out-of-date cell
are indistinguishable without a base. Those are refused outright.

**Re-exporting is therefore a convenience, not a requirement** — it refreshes the
*Current copy* column so it reads true again.

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
