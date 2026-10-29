/*
  Prismic content -> the shape the site's page templates read, driven by the
  same spec that defines the models (specs.ts). Plain module, usable from
  the site build and from Node scripts alike.
*/
import * as prismic from '@prismicio/client';
import type { DocSpec, Kind } from './specs.ts';

const SITE = /^https?:\/\/(www\.)?educationcompany\.co\.uk/i;

const routes: Record<string, (uid: string) => string> = {
  product: (u) => `/products/${u}/`,
  capability: (u) => `/capabilities/${u}/`,
  outcome: (u) => `/${u}/`,
};

/** A link field as an href: Prismic pages by their route, this site's own addresses made relative. */
export function hrefOfLink(link: any): string {
  if (!prismic.isFilled.link(link)) return '';
  const l = link as any;
  if (l.link_type === 'Document' && l.uid && routes[l.type]) return routes[l.type](l.uid);
  const url = prismic.asLink(link) ?? '';
  return url.replace(SITE, '') || (url ? '/' : '');
}

const listText = (rt: any) =>
  (Array.isArray(rt) ? rt : []).filter((n: any) => n.type === 'list-item').map((n: any) => n.text as string);

function valueOf(kind: Kind, v: any) {
  if (kind === 'text') return typeof v === 'string' ? v : '';
  if (kind === 'link') return hrefOfLink(v);
  if (kind === 'boolean') return Boolean(v);
  if (kind === 'image') return prismic.isFilled.image(v) ? v : undefined;
  return listText(v);
}

function set(obj: any, path: string, v: unknown) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  o[keys[keys.length - 1]] = v;
}

export function shapeOf(spec: DocSpec, data: Record<string, any>): any {
  const out: any = {};
  for (const [fid, f] of Object.entries(spec.fields)) {
    const v = data[fid];
    if (f.kind !== 'group') {
      set(out, f.path, valueOf(f.kind, v));
      continue;
    }
    const items: any[] = Array.isArray(v) ? v : [];
    if (f.split) for (const [k, path] of Object.entries(f.split)) set(out, path, items.map((it) => it[k] ?? ''));
    else if (f.strings) set(out, f.path, items.map((it) => it.text ?? ''));
    else
      set(
        out,
        f.path,
        items.map((it) =>
          Object.fromEntries(Object.entries(f.fields).map(([k, x]) => [x.key ?? k, valueOf(x.kind, it[k])]))
        )
      );
  }
  return out;
}
