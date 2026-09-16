/*
  Freeze the built site into public/<name>/ as plain static HTML.

    npm run build && node scripts/snapshot.mjs v1

  The snapshot is a record, not a second site: it has its own copies of every
  stylesheet, image and logo it uses (the build's asset filenames change each
  time, so pointing at them would break the snapshot on the next deploy), its
  internal links are rewritten to stay inside the snapshot, and it is hidden
  from search engines, the sitemap and site search. It is not connected to the
  copy deck — it's just files, and nothing edits it.

  Pages that only make sense live are left out: the publish console (it isn't
  static anyway), site search (its index is always the live site), the 404 page
  and internal prototypes.
*/

import { readFile, writeFile, mkdir, readdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';

const name = process.argv[2];
if (!name || !/^[a-z0-9-]+$/.test(name)) {
  console.error('usage: node scripts/snapshot.mjs <name>   e.g. v1 (lowercase letters, digits, dashes)');
  process.exit(1);
}

const SRC = '.vercel/output/static';
const OUT = path.join('public', name);
const PREFIX = `/${name}`;
const SKIP = [/^\/404/, /^\/search\//, /^\/prototype\//, /^\/admin\//];

const taken = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

try {
  await stat(OUT);
  console.error(`${OUT} already exists. Snapshots are meant to be frozen — pick a new name, or delete it first.`);
  process.exit(1);
} catch {}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const urlOf = (file) => {
  const rel = '/' + path.relative(SRC, file).split(path.sep).join('/');
  return rel.endsWith('index.html') ? rel.slice(0, -'index.html'.length) : rel;
};

const files = (await walk(SRC)).filter((f) => {
  const u = urlOf(f);
  return !u.startsWith(`${PREFIX}/`) && !SKIP.some((re) => re.test(u));
});
const pages = new Map(files.map((f) => [urlOf(f), f]));
const assets = new Set();

// Anything under / with a file extension that isn't a page — images, css,
// logos. Search's own files stay live on purpose.
const isAsset = (u) => /^\/(?!pagefind\/)[^?#]*\.[a-z0-9]{2,5}$/i.test(u) && !u.endsWith('.html');

function localise(u) {
  const [pathname, rest = ''] = u.split(/(?=[?#])/);
  if (isAsset(pathname)) {
    assets.add(pathname);
    return PREFIX + pathname + rest;
  }
  if (pages.has(pathname)) return PREFIX + pathname + rest;
  return u; // live-only destinations (search, admin, contact form posts) stay live
}

const listing = [];

for (const [url, file] of pages) {
  let html = await readFile(file, 'utf8');

  html = html.replace(/\b(href|src)="(\/[^"]*)"/g, (m, attr, u) => `${attr}="${localise(u)}"`);
  html = html.replace(/\bsrcset="([^"]*)"/g, (m, set) =>
    `srcset="${set
      .split(',')
      .map((part) => {
        const [u, ...d] = part.trim().split(/\s+/);
        return [u.startsWith('/') ? localise(u) : u, ...d].join(' ');
      })
      .join(', ')}"`
  );
  html = html.replace(/url\((['"]?)(\/[^)'"]+)\1\)/g, (m, q, u) => `url(${q}${localise(u)}${q})`);

  // Hidden: not indexed by search engines, not picked up by site search.
  html = html.replace(/<meta name="robots"[^>]*>/g, '');
  html = html.replace('<head>', '<head><meta name="robots" content="noindex, nofollow">');
  html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="https://www.educationcompany.co.uk${url}">`);

  const title = (html.match(/<title>(.*?)<\/title>/s)?.[1] ?? url).trim();
  html = html.replace(/<title>(.*?)<\/title>/s, `<title>[${name.toUpperCase()}] $1</title>`);

  // A bar on every page, so nobody mistakes the snapshot for the live site.
  const bar =
    `<div style="position:sticky;top:0;z-index:100;display:flex;flex-wrap:wrap;gap:6px 16px;align-items:center;justify-content:center;` +
    `padding:8px 16px;background:#f7901f;color:#0f1421;font:600 13px/1.4 Inter,system-ui,sans-serif">` +
    `<span>Snapshot ${name.toUpperCase()} · taken ${taken} · not the live site</span>` +
    `<a href="${PREFIX}/" style="color:#0f1421">All ${name.toUpperCase()} pages</a>` +
    `<a href="${url}" style="color:#0f1421">This page now</a></div>`;
  html = html.replace(/<body([^>]*)>/, `<body$1 data-pagefind-ignore="all">${bar}`);

  const dest = path.join(OUT, path.relative(SRC, file));
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, html);
  listing.push({ url, title });
}

let bytes = 0;
for (const a of assets) {
  const from = path.join(SRC, a);
  const to = path.join(OUT, a);
  await mkdir(path.dirname(to), { recursive: true });
  try {
    await copyFile(from, to);
    bytes += (await stat(to)).size;
  } catch {
    console.warn(`missing asset, left unresolved: ${a}`);
  }
}

// An index of the snapshot.
listing.sort((a, b) => a.url.localeCompare(b.url));
const rows = listing
  .map(
    (p) =>
      `<li><a href="${PREFIX}${p.url}">${p.title.replace(/ \| EdCo$/, '')}</a>` +
      `<span>${p.url}</span><a class="now" href="${p.url}">now</a></li>`
  )
  .join('\n');
await writeFile(
  path.join(OUT, 'index.html'),
  `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>[${name.toUpperCase()}] Site snapshot</title>
<style>
body{margin:0;padding:40px 20px;background:#0f1421;color:#fff;font:15px/1.55 Inter,system-ui,sans-serif}
main{max-width:860px;margin:0 auto}
h1{font:700 32px/1.1 Poppins,system-ui,sans-serif;margin:0 0 8px}
p{color:#a8b0c4;margin:0 0 28px}
ul{list-style:none;margin:0;padding:0;border-top:1px solid #232b3f}
li{display:flex;flex-wrap:wrap;gap:4px 14px;align-items:baseline;padding:10px 0;border-bottom:1px solid #232b3f}
li a{color:#fff;font-weight:500}
li span{flex:1;min-width:12ch;color:#6f7891;font:12px ui-monospace,Menlo,monospace}
li a.now{color:#f7901f;font-size:13px}
</style></head><body data-pagefind-ignore="all"><main>
<h1>Snapshot ${name.toUpperCase()}</h1>
<p>The site as it stood on ${taken} — ${listing.length} pages, frozen. Not linked from the live site,
not indexed, and not connected to the copy deck. “now” opens the same page on the live site.</p>
<ul>
${rows}
</ul>
</main></body></html>
`
);

console.log(`${OUT}: ${listing.length} pages, ${assets.size} assets (${(bytes / 1048576).toFixed(1)} MB)`);
