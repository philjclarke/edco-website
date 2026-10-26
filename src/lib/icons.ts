/*
  Icon names typed into Prismic are checked here before they reach
  astro-icon, which fails the whole build on a name it doesn't know. A typo
  in Prismic would otherwise stop every later publish from going live. An
  unknown name is dropped (the item shows without an icon) and the build log
  says which.
*/
import solid from '@iconify-json/fa6-solid/icons.json';
import regular from '@iconify-json/fa6-regular/icons.json';

const sets: Record<string, { icons: Record<string, unknown>; aliases?: Record<string, unknown> }> = {
  'fa6-solid': solid,
  'fa6-regular': regular,
};

// Local SVGs in src/icons/ are referenced by bare file name.
const local = new Set(
  Object.keys(import.meta.glob('/src/icons/*.svg')).map((p) => p.split('/').pop()!.replace(/\.svg$/, ''))
);

const warned = new Set<string>();

export function knownIcon(name: string | null | undefined): string | undefined {
  const n = (name ?? '').trim();
  if (!n) return undefined;
  const [prefix, icon] = n.includes(':') ? n.split(':', 2) : ['', n];
  const set = sets[prefix];
  const ok = set ? Boolean(set.icons[icon] || set.aliases?.[icon]) : !prefix && local.has(icon);
  if (!ok && !warned.has(n)) {
    warned.add(n);
    console.warn(`[icons] Unknown icon "${n}" from Prismic: shown without an icon. Check the name, e.g. fa6-solid:chart-simple.`);
  }
  return ok ? n : undefined;
}
