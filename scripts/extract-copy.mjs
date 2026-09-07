/*
  One-off: lift the content out of the src/data/*.ts modules into JSON so the
  copy deck can round-trip it. Run once; after this the .ts modules import the
  JSON and this script is only useful if the split ever needs redoing.
*/
import { build } from 'esbuild';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = process.cwd();
const tmp = path.join(root, '.copy-tmp');
await mkdir(tmp, { recursive: true });

const modules = {
  outcomes: ['outcomes'],
  products: ['products'],
  capabilities: ['capabilities'],
  model: ['edcoModel', 'beliefs', 'routes'],
  proof: ['proofStats', 'logoCandidates', 'testimonialThemes', 'caseStudyThemes'],
  streams: ['streams'],
};

for (const [name, exports] of Object.entries(modules)) {
  const out = path.join(tmp, `${name}.mjs`);
  await build({
    entryPoints: [path.join(root, 'src', 'data', `${name}.ts`)],
    outfile: out,
    bundle: true,
    format: 'esm',
    platform: 'node',
    logLevel: 'silent',
  });
  const mod = await import(pathToFileURL(out).href);
  const payload = exports.length === 1 ? mod[exports[0]] : Object.fromEntries(exports.map((e) => [e, mod[e]]));
  await writeFile(
    path.join(root, 'src', 'data', 'copy', `${name}.json`),
    JSON.stringify(payload, null, 2) + '\n'
  );
  console.log(`${name}.json`, JSON.stringify(payload).length, 'bytes');
}

await rm(tmp, { recursive: true, force: true });
