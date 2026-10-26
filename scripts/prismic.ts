/*
  Prismic housekeeping, run with Node's built-in TypeScript support:

    node --env-file=.env scripts/prismic.ts push      # models in prismic/models.ts -> Prismic
    node --env-file=.env scripts/prismic.ts status    # what push would change

  Uses the Types API directly rather than the Prismic CLI, which only works
  inside Next.js, Nuxt and SvelteKit projects. Needs PRISMIC_REPOSITORY and
  PRISMIC_WRITE_TOKEN in .env.
*/

import { customTypes, slices } from '../prismic/models.ts';

const repo = process.env.PRISMIC_REPOSITORY;
const token = process.env.PRISMIC_WRITE_TOKEN;
if (!repo || !token) {
  console.error('Set PRISMIC_REPOSITORY and PRISMIC_WRITE_TOKEN in .env');
  process.exit(1);
}

const API = 'https://customtypes.prismic.io';
const headers = { repository: repo, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

/** Compare ignoring key order, so an unchanged model isn't re-sent. */
const canon = (v: unknown): string =>
  JSON.stringify(v, (_k, x) =>
    x && typeof x === 'object' && !Array.isArray(x)
      ? Object.fromEntries(Object.entries(x).filter(([, y]) => y !== undefined).sort(([a], [b]) => a.localeCompare(b)))
      : x
  );

async function plan() {
  const [remoteSlices, remoteTypes] = await Promise.all([call('GET', '/slices'), call('GET', '/customtypes')]);
  const rs = new Map<string, unknown>(remoteSlices.map((s: { id: string }) => [s.id, s]));
  const rt = new Map<string, unknown>(remoteTypes.map((t: { id: string }) => [t.id, t]));
  const steps: { kind: 'slices' | 'customtypes'; action: 'insert' | 'update'; id: string; model: unknown }[] = [];
  // Slices first: a page type can only offer slices that already exist.
  for (const s of slices) {
    const r = rs.get(s.id);
    if (!r) steps.push({ kind: 'slices', action: 'insert', id: s.id, model: s });
    else if (canon(r) !== canon(s)) steps.push({ kind: 'slices', action: 'update', id: s.id, model: s });
  }
  for (const t of customTypes) {
    const r = rt.get(t.id);
    if (!r) steps.push({ kind: 'customtypes', action: 'insert', id: t.id, model: t });
    else if (canon(r) !== canon(t)) steps.push({ kind: 'customtypes', action: 'update', id: t.id, model: t });
  }
  const local = new Set([...slices.map((s) => s.id), ...customTypes.map((t) => t.id)]);
  const orphans = [...rs.keys(), ...rt.keys()].filter((id) => !local.has(id));
  return { steps, orphans };
}

const cmd = process.argv[2];

if (cmd === 'status' || cmd === 'push') {
  const { steps, orphans } = await plan();
  if (!steps.length) console.log('Prismic models are up to date.');
  for (const s of steps) console.log(`${s.action.padEnd(6)} ${s.kind === 'slices' ? 'slice' : 'type '} ${s.id}`);
  if (orphans.length) console.log(`In Prismic but not in models.ts (left alone): ${orphans.join(', ')}`);
  if (cmd === 'push') {
    for (const s of steps) await call('POST', `/${s.kind}/${s.action}`, s.model);
    if (steps.length) console.log(`Pushed ${steps.length} change(s).`);
  }
} else {
  console.error('usage: node --env-file=.env scripts/prismic.ts <push|status>');
  process.exit(1);
}
