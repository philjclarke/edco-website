/*
  Bridge between the repo's copy JSON and the online copy deck.

    node scripts/copy-deck.mjs csv                 -> copy-deck.csv        (import into Sheets)
    node scripts/copy-deck.mjs apply-csv [file|url] -> src/data/copy/*.json (pull edits back)

  `apply-csv` with no argument reads the live Google Sheet (DECK_URL below).
  Pass a path or a different URL to override it.

    node scripts/copy-deck.mjs pack             -> .copy-deck/<doc>.json   (JSON form)
    node scripts/copy-deck.mjs apply <dir>      -> src/data/copy/*.json

  `pack` flattens each source file into a flat map of dotted paths to strings —
  one deck document per page, so two people editing different pages never
  collide. `apply` reverses it, writing only string leaves back into the
  existing structure. Structural fields (slugs, hrefs, block types) are never
  exposed to the deck and never written back, so an edit cannot break a route.
*/

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const COPY_DIR = 'src/data/copy';
const OUT_DIR = '.copy-deck';

/*
  The live copy deck. Google serves any link-shared sheet as CSV from this
  endpoint, so no "publish to web" is needed — but it does mean the sheet has to
  stay shared as "anyone with the link can view" for the pull to work.
*/
const DECK_URL =
  'https://docs.google.com/spreadsheets/d/1tIJqD10Xente09Q4pjejPsd7qyaYfcGevYmNA3Sbj4o/export?format=csv';

/* Keys that describe structure rather than words. Never editable, never
   round-tripped — changing one would break a URL, a layout or a type. */
const STRUCTURAL = new Set([
  'slug',
  'href',
  'page',
  'type',
  'columns',
  'verified',
  'routeObjective',
  'stream',
  'status',
  'outcome',
  'testimonialTheme',
]);

/** Human labels for the field paths, so the deck reads like a document. */
const FIELD_LABELS = {
  navLabel: 'Nav label',
  title: 'Heading',
  heading: 'Heading',
  standfirst: 'Standfirst',
  summary: 'Summary / card text',
  lead: 'Intro paragraph',
  helpTitle: 'List heading',
  pull: 'Pull quote',
  body: 'Body',
  close: 'Closing line',
  eyebrow: 'Eyebrow',
  cta: 'Button label',
  label: 'Link label',
  blurb: 'Link description',
  question: 'Question',
  note: 'Note',
  name: 'Name',
  value: 'Figure',
  objective: 'Objective',
  description: 'Meta description',
};

/* ------------------------------------------------------------------ */

/** Flatten to { 'a.b.0.c': 'string' }, skipping structural keys. */
function flatten(node, prefix = '', out = {}) {
  if (typeof node === 'string') {
    out[prefix] = node;
    return out;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (STRUCTURAL.has(k)) continue;
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

/** Write flat values back into an existing structure, in place. */
function unflatten(target, values) {
  let applied = 0;
  for (const [dotted, value] of Object.entries(values)) {
    if (typeof value !== 'string') continue;
    const parts = dotted.split('.');
    let node = target;
    let ok = true;
    for (const part of parts.slice(0, -1)) {
      const key = Array.isArray(node) ? Number(part) : part;
      if (node?.[key] === undefined) {
        ok = false;
        break;
      }
      node = node[key];
    }
    if (!ok) continue;
    const last = parts.at(-1);
    const key = Array.isArray(node) ? Number(last) : last;
    // Only overwrite an existing string. A path that no longer exists, or that
    // points at an object, means the deck is stale — skip rather than corrupt.
    if (typeof node?.[key] !== 'string') continue;
    if (node[key] !== value) applied += 1;
    node[key] = value;
  }
  return applied;
}

function labelFor(dotted) {
  const leaf = dotted.split('.').at(-1);
  if (FIELD_LABELS[leaf]) return FIELD_LABELS[leaf];
  if (/^\d+$/.test(leaf)) {
    const parent = dotted.split('.').at(-2);
    const n = Number(leaf) + 1;
    return `${FIELD_LABELS[parent] ?? sentence(parent)} ${n}`;
  }
  return sentence(leaf);
}

const sentence = (s = '') =>
  s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();

/* Which source file each deck document is cut from, and how it is split. */
const SOURCES = [
  { file: 'home.json', group: 'Homepage', split: false, docId: 'home', title: 'Homepage' },
  { file: 'outcomes.json', group: 'Outcome pages', split: 'navLabel' },
  { file: 'products.json', group: 'Product pages', split: 'navLabel' },
  { file: 'capabilities.json', group: 'What we do', split: 'navLabel' },
  { file: 'model.json', group: 'Shared', split: false, docId: 'model', title: 'Model, beliefs & routes' },
  { file: 'proof.json', group: 'Shared', split: false, docId: 'proof', title: 'Proof, logos & themes' },
  { file: 'streams.json', group: 'Shared', split: false, docId: 'streams', title: 'What We Think streams' },
];

async function pack() {
  await mkdir(OUT_DIR, { recursive: true });
  const index = [];

  for (const src of SOURCES) {
    const raw = JSON.parse(await readFile(path.join(COPY_DIR, src.file), 'utf8'));

    const emit = async (docId, title, payload, sourcePath) => {
      const values = flatten(payload);
      const fields = Object.keys(values).map((k) => ({ path: k, label: labelFor(k) }));
      const doc = {
        docId,
        title,
        group: src.group,
        source: { file: src.file, path: sourcePath },
        fields,
        values,
        // Baseline at seed time, so the deck can mark what has been edited
        // since it was last synced with the repo.
        original: { ...values },
        seededAt: new Date().toISOString(),
      };
      await writeFile(path.join(OUT_DIR, `${docId}.json`), JSON.stringify(doc, null, 2) + '\n');
      index.push({ docId, title, group: src.group, count: fields.length });
    };

    if (src.split && Array.isArray(raw)) {
      for (const [i, item] of raw.entries()) {
        await emit(
          `${src.file.replace('.json', '')}-${item.slug}`,
          item[src.split] ?? item.slug,
          item,
          String(i)
        );
      }
    } else {
      await emit(src.docId, src.title, raw, '');
    }
  }

  await writeFile(path.join(OUT_DIR, '_index.json'), JSON.stringify(index, null, 2) + '\n');
  const total = index.reduce((n, d) => n + d.count, 0);
  console.log(`packed ${index.length} documents, ${total} editable fields -> ${OUT_DIR}/`);
}

async function apply(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  const loaded = new Map(); // source file -> parsed structure
  let changed = 0;

  for (const f of files) {
    const parsed = JSON.parse(await readFile(path.join(dir, f), 'utf8'));
    // A document downloaded from the deck's database arrives wrapped in a
    // {id, data, version} envelope; one written by `pack` is bare.
    const doc = parsed?.data?.source ? parsed.data : parsed;
    if (!doc?.source?.file || !doc.values) {
      console.warn(`skipped ${f}: not a deck document`);
      continue;
    }
    const srcFile = doc.source.file;
    if (!loaded.has(srcFile)) {
      loaded.set(srcFile, JSON.parse(await readFile(path.join(COPY_DIR, srcFile), 'utf8')));
    }
    const root = loaded.get(srcFile);
    const target = doc.source.path === '' ? root : root[Number(doc.source.path)];
    const n = unflatten(target, doc.values);
    if (n) console.log(`${doc.title}: ${n} field${n === 1 ? '' : 's'} changed`);
    changed += n;
  }

  for (const [file, data] of loaded) {
    await writeFile(path.join(COPY_DIR, file), JSON.stringify(data, null, 2) + '\n');
  }
  console.log(changed ? `\napplied ${changed} changes across ${loaded.size} files` : '\nno changes');
}

/* ------------------------------------------------------- spreadsheet */

const CSV_FILE = 'copy-deck.csv';
const HEADERS = ['Page', 'Section', 'Field', 'Ref', 'Current copy', 'New copy', 'Notes'];

/** RFC 4180: quote everything, double any embedded quote. */
const cell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

/** The section a field belongs to — the first segment of its path, humanised. */
function sectionOf(dotted) {
  const head = dotted.split('.')[0];
  return /^\d+$/.test(head) ? '' : sentence(head);
}

async function csv() {
  await pack();
  const index = JSON.parse(await readFile(path.join(OUT_DIR, '_index.json'), 'utf8'));
  // A BOM keeps curly quotes and em dashes intact when Sheets and Excel open it.
  const lines = ['\uFEFF' + HEADERS.map(cell).join(',')];

  for (const entry of index) {
    const doc = JSON.parse(await readFile(path.join(OUT_DIR, `${entry.docId}.json`), 'utf8'));
    for (const f of doc.fields) {
      lines.push(
        [
          doc.title,
          sectionOf(f.path),
          f.label,
          `${doc.docId}::${f.path}`,
          doc.values[f.path] ?? '',
          '',
          '',
        ]
          .map(cell)
          .join(',')
      );
    }
  }

  await writeFile(CSV_FILE, lines.join('\n') + '\n');
  console.log(`wrote ${CSV_FILE} — ${lines.length - 1} rows`);
  console.log('Import into Google Sheets: File > Import > Upload, "Replace spreadsheet".');
}

/** The deck as CSV text: the live sheet by default, a path or URL if given. */
async function fetchDeck(fileArg) {
  const source = fileArg ?? DECK_URL;
  if (!/^https?:\/\//.test(source)) return readFile(source, 'utf8');

  const res = await fetch(source, { redirect: 'follow' });
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  const text = await res.text();
  if (!text.includes('Ref') || !text.includes('New copy')) {
    throw new Error(
      'That URL did not return the copy deck — most likely the sheet is no ' +
        'longer shared. It needs "anyone with the link can view" for the CSV ' +
        'export to be readable. Pass a downloaded file instead if it must stay private.'
    );
  }
  console.log(`fetched ${text.length} bytes from the sheet`);
  return text;
}

async function applyCsv(fileArg) {
  const rows = parseCsv(await fetchDeck(fileArg));
  const header = rows.shift().map((h) => h.replace(/^\uFEFF/, '').trim());
  const col = (name) => {
    const i = header.indexOf(name);
    if (i < 0) throw new Error(`column "${name}" not found. Found: ${header.join(', ')}`);
    return i;
  };
  const iRef = col('Ref');
  const iNew = col('New copy');
  const iCur = col('Current copy');

  // Group the rows that carry a new wording back into per-document value maps.
  const byDoc = new Map();
  let proposed = 0;
  for (const r of rows) {
    const ref = (r[iRef] ?? '').trim();
    if (!ref.includes('::')) continue;
    const next = r[iNew] ?? '';
    if (next.trim() === '') continue;              // blank means "leave it alone"
    if (next === (r[iCur] ?? '')) continue;        // pasted back unchanged
    const [docId, fieldPath] = ref.split('::');
    if (!byDoc.has(docId)) byDoc.set(docId, {});
    byDoc.get(docId)[fieldPath] = next;
    proposed += 1;
  }

  if (!proposed) {
    console.log('No rows have anything in the "New copy" column — nothing to apply.');
    return;
  }

  const loaded = new Map();
  let changed = 0;
  for (const [docId, values] of byDoc) {
    const doc = JSON.parse(await readFile(path.join(OUT_DIR, `${docId}.json`), 'utf8'));
    const srcFile = doc.source.file;
    if (!loaded.has(srcFile)) {
      loaded.set(srcFile, JSON.parse(await readFile(path.join(COPY_DIR, srcFile), 'utf8')));
    }
    const root = loaded.get(srcFile);
    const target = doc.source.path === '' ? root : root[Number(doc.source.path)];
    const n = unflatten(target, values);
    if (n) console.log(`${doc.title}: ${n} field${n === 1 ? '' : 's'} changed`);
    changed += n;
  }

  for (const [f, data] of loaded) {
    await writeFile(path.join(COPY_DIR, f), JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`\napplied ${changed} of ${proposed} proposed changes across ${loaded.size} files`);
  if (changed < proposed) {
    console.log('Some rows were skipped — their Ref no longer matches a field (deck out of date).');
  }
}

/* --------------------------------------------------------- reconcile */

/*
  Recovery for the predictable accident: a reviewer edits "Current copy" in
  place instead of filling in "New copy". The edits are still there, but they
  are no longer distinguishable from the original by looking at the sheet alone.

  Three-way merge against the commit the sheet was cut from:
    base  = repo at <ref>            what the sheet was generated from
    sheet = "Current copy" column    base + the reviewer's edits
    head  = repo now                 base + our edits since

  sheet != base  ->  the reviewer changed it
  head  != base  ->  we changed it
  both           ->  a genuine conflict; reported, never applied silently.
*/
function readAtRef(ref, file) {
  const out = execFileSync('git', ['show', `${ref}:${COPY_DIR}/${file}`], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out);
}

/** Read one dotted path out of a structure, or undefined. */
function readPath(root, dotted) {
  let node = root;
  for (const part of dotted.split('.')) {
    if (node == null) return undefined;
    node = Array.isArray(node) ? node[Number(part)] : node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

async function reconcile(ref, { write = false } = {}) {
  if (!ref) throw new Error('reconcile needs the commit the sheet was cut from, e.g. `reconcile 9631834`');

  const text = await fetchDeck();
  const rows = parseCsv(text);
  const header = rows.shift().map((h) => h.replace(/^\uFEFF/, '').trim());
  const iRef = header.indexOf('Ref');
  const iCur = header.indexOf('Current copy');
  const iNew = header.indexOf('New copy');

  const bases = new Map();
  const heads = new Map();
  const docCache = new Map();
  const loadDoc = async (docId) => {
    if (!docCache.has(docId)) {
      docCache.set(docId, JSON.parse(await readFile(path.join(OUT_DIR, `${docId}.json`), 'utf8')));
    }
    return docCache.get(docId);
  };

  const edits = [];
  const conflicts = [];
  const gone = [];

  for (const r of rows) {
    const ref2 = (r[iRef] ?? '').trim();
    if (!ref2.includes('::')) continue;
    const [docId, fieldPath] = ref2.split('::');
    // An edit in the right column still wins — it is the clearer signal.
    const sheetVal = (r[iNew] ?? '').trim() !== '' ? r[iNew] : r[iCur] ?? '';

    let doc;
    try {
      doc = await loadDoc(docId);
    } catch {
      gone.push({ ref: ref2, why: 'page no longer in the deck' });
      continue;
    }
    const file = doc.source.file;
    const idx = doc.source.path === '' ? null : Number(doc.source.path);

    if (!bases.has(file)) bases.set(file, readAtRef(ref, file));
    if (!heads.has(file)) {
      heads.set(file, JSON.parse(await readFile(path.join(COPY_DIR, file), 'utf8')));
    }
    const baseRoot = idx === null ? bases.get(file) : bases.get(file)[idx];
    const headRoot = idx === null ? heads.get(file) : heads.get(file)[idx];
    if (baseRoot === undefined) {
      gone.push({ ref: ref2, why: 'not present at the base commit' });
      continue;
    }

    const baseVal = readPath(baseRoot, fieldPath);
    if (baseVal === undefined) {
      gone.push({ ref: ref2, why: 'field not at the base commit' });
      continue;
    }
    if (sheetVal === baseVal) continue; // reviewer left it alone

    // The shape may have moved on: a bare string can now be {label, href}.
    let headPath = fieldPath;
    let headVal = readPath(headRoot, headPath);
    if (headVal === undefined) {
      headVal = readPath(headRoot, `${fieldPath}.label`);
      if (headVal !== undefined) headPath = `${fieldPath}.label`;
    }
    if (headVal === undefined) {
      gone.push({ ref: ref2, why: 'field has since been removed', sheet: sheetVal });
      continue;
    }

    const entry = { docId, file, idx, headPath, baseVal, sheetVal, headVal, title: doc.title };
    if (headVal !== baseVal) conflicts.push(entry);
    else edits.push(entry);
  }

  const trunc = (v, n = 88) => (v.length > n ? v.slice(0, n) + '…' : v);
  console.log(`\nbase ${ref} · sheet rows ${rows.length}\n`);
  console.log(`Reviewer edits that apply cleanly: ${edits.length}`);
  console.log(`Conflicts (we changed it too):     ${conflicts.length}`);
  console.log(`Rows that no longer map:           ${gone.length}\n`);

  const byDoc = new Map();
  for (const e of edits) {
    if (!byDoc.has(e.title)) byDoc.set(e.title, []);
    byDoc.get(e.title).push(e);
  }
  for (const [title, list] of byDoc) {
    console.log(`  ${title} — ${list.length}`);
    for (const e of list) {
      console.log(`    ${e.headPath}`);
      console.log(`      was: ${trunc(e.baseVal)}`);
      console.log(`      now: ${trunc(e.sheetVal)}`);
    }
  }
  if (conflicts.length) {
    console.log('\nCONFLICTS — not applied, decide these by hand:');
    for (const c of conflicts) {
      console.log(`  ${c.title} · ${c.headPath}`);
      console.log(`    base:   ${trunc(c.baseVal)}`);
      console.log(`    sheet:  ${trunc(c.sheetVal)}`);
      console.log(`    repo:   ${trunc(c.headVal)}`);
    }
  }
  if (gone.length) {
    console.log('\nUnmappable rows:');
    for (const g of gone) console.log(`  ${g.ref} — ${g.why}`);
  }

  if (!write) {
    console.log('\nDry run. Re-run with --write to apply the clean edits.');
    return;
  }

  for (const e of edits) {
    const root = e.idx === null ? heads.get(e.file) : heads.get(e.file)[e.idx];
    unflatten(root, { [e.headPath]: e.sheetVal });
  }
  for (const [file, data] of heads) {
    await writeFile(path.join(COPY_DIR, file), JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`\napplied ${edits.length} edits across ${heads.size} files`);
}

const [cmd, arg] = process.argv.slice(2);
try {
  if (cmd === 'pack') await pack();
  else if (cmd === 'apply') await apply(arg ?? OUT_DIR);
  else if (cmd === 'csv') await csv();
  else if (cmd === 'apply-csv') await applyCsv(arg);
  else if (cmd === 'reconcile')
    await reconcile(arg, { write: process.argv.includes('--write') });
  else {
    console.error(
      'usage: copy-deck.mjs csv | apply-csv [file|url] | reconcile <git-ref> [--write] | pack | apply <dir>'
    );
    process.exit(1);
  }
} catch (err) {
  // A stack trace helps nobody here — the failures are all "wrong link" or
  // "no file", and the message says which.
  console.error(`\n${err.message}`);
  process.exit(1);
}
