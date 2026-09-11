/*
  The copy-deck logic, as pure functions so it runs in a serverless function as
  well as in scripts/copy-deck.mjs. Nothing here touches the filesystem — the
  server routes read and write the JSON through the GitHub API instead.

  Keep this in step with scripts/copy-deck.mjs; the two share a format.
*/

/** Keys that describe structure rather than words. Never editable. */
export const STRUCTURAL = new Set([
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
  'icon',
  'banner',
]);

/** Which source file each deck document is cut from, and how it is split. */
export const SOURCES = [
  { file: 'home.json', docId: 'home', split: false },
  { file: 'outcomes.json', split: true },
  { file: 'products.json', split: true },
  { file: 'capabilities.json', split: true },
  { file: 'model.json', docId: 'model', split: false },
  { file: 'proof.json', docId: 'proof', split: false },
  { file: 'streams.json', docId: 'streams', split: false },
] as const;

export const COPY_DIR = 'src/data/copy';

/* ----------------------------------------------------------------- CSV */

/** RFC 4180 parse. Handles quoted fields containing commas and newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/* ------------------------------------------------------------ paths */

/** Read one dotted path out of a structure, or undefined if it isn't a string. */
export function readPath(root: unknown, dotted: string): string | undefined {
  let node: any = root;
  for (const part of dotted.split('.')) {
    if (node == null) return undefined;
    node = Array.isArray(node) ? node[Number(part)] : node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Write a string at a dotted path. Returns false if the path is not a string. */
export function writePath(root: unknown, dotted: string, value: string): boolean {
  const parts = dotted.split('.');
  let node: any = root;
  for (const part of parts.slice(0, -1)) {
    const key = Array.isArray(node) ? Number(part) : part;
    if (node?.[key] === undefined) return false;
    node = node[key];
  }
  const last = parts.at(-1)!;
  const key = Array.isArray(node) ? Number(last) : last;
  if (typeof node?.[key] !== 'string') return false;
  node[key] = value;
  return true;
}

/* ------------------------------------------------------------ deck ids */

/**
 * The doc id a sheet row's Ref points at, mapped back to a file and an index.
 * `products-ednet` means products.json, the entry whose slug is `ednet`.
 */
export function resolveDoc(docId: string, files: Record<string, any>) {
  for (const src of SOURCES) {
    const stem = src.file.replace('.json', '');
    if (!src.split) {
      if (docId === (src as any).docId) return { file: src.file, root: files[src.file] };
      continue;
    }
    if (!docId.startsWith(`${stem}-`)) continue;
    const slug = docId.slice(stem.length + 1);
    const list = files[src.file];
    const item = Array.isArray(list) ? list.find((i: any) => i.slug === slug) : undefined;
    if (item) return { file: src.file, root: item };
  }
  return null;
}

/* ---------------------------------------------------------- the diff */

export interface FieldChange {
  docId: string;
  page: string;
  field: string;
  path: string;
  file: string;
  from: string;
  to: string;
}

export interface DeckDiff {
  changes: FieldChange[];
  /**
   * Rows where someone typed over "Current copy" instead of filling in
   * "New copy". Reported so it can be corrected — never published, because
   * an edited reference column is indistinguishable from one the site has
   * simply moved past.
   */
  inPlaceEdits: { page: string; field: string; value: string }[];
  /** Rows whose Ref no longer matches anything in the content. */
  unmatched: { ref: string; reason: string }[];
  rows: number;
  /** The commit this deck was exported from, if it carries a stamp. */
  exportedFrom: string | null;
}

/**
 * Compare the sheet against the live content.
 *
 * One rule: **"New copy" is the instruction.** Filled in, it says what that
 * field should say; empty, it says nothing at all. Nothing else on the sheet
 * changes the site.
 *
 * "Current copy" is a reference, printed at export time, and is never used as
 * an instruction. It goes out of date as things are published, which is
 * harmless — but if someone types over it by mistake, that edit would otherwise
 * vanish silently, so those rows are reported. Spotting them needs `base`: the
 * content as it stood at the deck's export stamp.
 *
 * An earlier version treated an empty "New copy" as "use Current copy", which
 * made an empty cell mean two different things and made reverting a published
 * change impossible.
 */
export function diffDeck(
  csv: string,
  files: Record<string, any>,
  base?: Record<string, any>
): DeckDiff {
  const rows = parseCsv(csv);
  const header = rows.shift()!.map((h) => h.replace(/^\uFEFF/, '').trim());
  const iRef = header.indexOf('Ref');
  const iCur = header.indexOf('Current copy');
  const iNew = header.indexOf('New copy');
  const iPage = header.indexOf('Page');
  const iField = header.indexOf('Field');
  if (iRef < 0 || iNew < 0) {
    throw new Error('That sheet has no Ref / New copy columns — is it the copy deck?');
  }

  const changes: FieldChange[] = [];
  const inPlaceEdits: { page: string; field: string; value: string }[] = [];
  const unmatched: { ref: string; reason: string }[] = [];
  let exportedFrom: string | null = null;

  for (const r of rows) {
    const ref = (r[iRef] ?? '').trim();
    if (!ref.includes('::')) continue;
    const [docId, fieldPath] = ref.split('::');

    if (docId === '__meta__') {
      if (fieldPath === 'exportedFrom') exportedFrom = (r[iCur] ?? '').trim() || null;
      continue;
    }

    const doc = resolveDoc(docId, files);
    if (!doc) {
      unmatched.push({ ref, reason: 'page no longer exists' });
      continue;
    }
    const live = readPath(doc.root, fieldPath);
    if (live === undefined) {
      unmatched.push({ ref, reason: 'field no longer exists' });
      continue;
    }

    const page = r[iPage] ?? docId;
    const field = r[iField] ?? fieldPath;
    const proposed = r[iNew] ?? '';

    if (proposed.trim() === '') {
      // Nothing asked for here. Flag a typed-over reference so it isn't lost.
      if (base) {
        const baseDoc = resolveDoc(docId, base);
        const was = baseDoc ? readPath(baseDoc.root, fieldPath) : undefined;
        const current = r[iCur] ?? '';
        if (was !== undefined && current !== was) {
          inPlaceEdits.push({ page, field, value: current });
        }
      }
      continue;
    }

    if (proposed === live) continue;

    changes.push({ docId, page, field, path: fieldPath, file: doc.file, from: live, to: proposed });
  }

  return { changes, inPlaceEdits, unmatched, rows: rows.length, exportedFrom };
}

/** Apply a diff to the parsed files. Returns the filenames that changed. */
export function applyDiff(changes: FieldChange[], files: Record<string, any>): string[] {
  const touched = new Set<string>();
  for (const c of changes) {
    const doc = resolveDoc(c.docId, files);
    if (!doc) continue;
    if (writePath(doc.root, c.path, c.to)) touched.add(doc.file);
  }
  return [...touched];
}

/* ------------------------------------------------------- fetching it */

/**
 * Accept either form of a Google Sheets link.
 *
 * Copying the URL out of the browser gives the `/edit` address, which serves
 * the spreadsheet application rather than the data. Rewriting it here means the
 * setting works whichever one gets pasted in.
 */
export function normaliseDeckUrl(url: string): string {
  const sheet = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!sheet) return url;
  if (/[?&]format=csv/.test(url)) return url;

  // Keep the tab if the link points at one.
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1];
  const base = `https://docs.google.com/spreadsheets/d/${sheet[1]}/export?format=csv`;
  return gid ? `${base}&gid=${gid}` : base;
}

/** Fetch the deck as CSV, with errors that say what to do about them. */
export async function fetchDeck(url: string): Promise<string> {
  const res = await fetch(normaliseDeckUrl(url), { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(
      res.status === 404 || res.status === 403
        ? 'The copy deck could not be read. It needs to be shared as “anyone with the link can view”.'
        : `The copy deck could not be read (${res.status}).`
    );
  }
  const text = await res.text();
  if (text.trimStart().startsWith('<')) {
    throw new Error(
      'That link returned a web page rather than the spreadsheet data. ' +
        'Check DECK_CSV_URL points at the sheet, and that it is shared as ' +
        '“anyone with the link can view”.'
    );
  }
  return text;
}
