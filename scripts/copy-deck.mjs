/*
  Bridge between the repo's copy JSON and the online copy deck.

    node scripts/copy-deck.mjs csv              -> copy-deck.csv           (import into Sheets)
    node scripts/copy-deck.mjs apply-csv <file> -> src/data/copy/*.json    (pull edits back)

    node scripts/copy-deck.mjs pack             -> .copy-deck/<doc>.json   (JSON form)
    node scripts/copy-deck.mjs apply <dir>      -> src/data/copy/*.json

  `pack` flattens each source file into a flat map of dotted paths to strings —
  one deck document per page, so two people editing different pages never
  collide. `apply` reverses it, writing only string leaves back into the
  existing structure. Structural fields (slugs, hrefs, block types) are never
  exposed to the deck and never written back, so an edit cannot break a route.
*/

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const COPY_DIR = 'src/data/copy';
const OUT_DIR = '.copy-deck';

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

/*
  Find the edited deck without being told where it is. Sheets exports land in
  ~/Downloads under whatever the spreadsheet is called, so rather than make
  someone move the file, take the newest CSV that looks like a copy deck.
*/
async function findCsv() {
  const candidates = [];
  const isDeck = async (p) => {
    try {
      const head = (await readFile(p, 'utf8')).slice(0, 400);
      return head.includes('"Ref"') && head.includes('"New copy"');
    } catch {
      return false;
    }
  };

  if (await isDeck(CSV_FILE)) return CSV_FILE;

  const downloads = path.join(os.homedir(), 'Downloads');
  let names = [];
  try {
    names = await readdir(downloads);
  } catch {
    names = [];
  }
  for (const n of names) {
    if (!n.toLowerCase().endsWith('.csv')) continue;
    const full = path.join(downloads, n);
    if (!(await isDeck(full))) continue;
    candidates.push({ full, mtime: (await stat(full)).mtimeMs });
  }
  if (!candidates.length) {
    throw new Error(
      'No copy deck CSV found. Pass the path explicitly, or export the sheet ' +
        'to ~/Downloads (File > Download > Comma-separated values).'
    );
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  console.log(`using ${candidates[0].full}`);
  return candidates[0].full;
}

async function applyCsv(fileArg) {
  const file = fileArg ?? (await findCsv());
  const rows = parseCsv(await readFile(file, 'utf8'));
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

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'pack') await pack();
else if (cmd === 'apply') await apply(arg ?? OUT_DIR);
else if (cmd === 'csv') await csv();
else if (cmd === 'apply-csv') await applyCsv(arg);
else {
  console.error('usage: copy-deck.mjs csv | apply-csv <file> | pack | apply <dir>');
  process.exit(1);
}
