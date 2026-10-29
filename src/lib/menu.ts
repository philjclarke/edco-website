/*
  The main menu and the footer's lists, built from Prismic at every build.

  The top level is fixed: one link per section's top-level page, in the order
  of prismic/pageTypes.ts, labelled with that page's Preview title. Under each
  one go the section's pages that have "Show in main menu" ticked, by their
  Menu order (lower first; blank goes last, oldest first). A section with
  nothing ticked is a plain link.

  While previewing, drafts count too, so an editor can see a menu change
  before publishing it.
*/
import type { PrismicDocument } from '@prismicio/client';
import { PAGE_TYPES } from '../../prismic/pageTypes';
import { footerExtras, footerEdCo, type NavGroup, type NavLink } from '@/data/site';
import { pages, type Pages } from './pages';

/** Second-tier types with a menu tick box, and whether it starts ticked. */
const MENU_TYPES = new Map<string, boolean>(PAGE_TYPES.flatMap((t) => ('inMenu' in t ? [[t.id, t.inMenu] as const] : [])));
/** The top-level pages, in menu order: those with second-tier types below them. */
const HUBS = PAGE_TYPES.filter((hub) => PAGE_TYPES.some((t) => 'parent' in t && t.parent === hub.id && MENU_TYPES.has(t.id)));

/** Whether a page is ticked to show in the main menu. Pages saved before the tick box existed take their type's default. */
export const inMenu = (doc: PrismicDocument) =>
  typeof doc.data.show_in_menu === 'boolean' ? doc.data.show_in_menu : (MENU_TYPES.get(doc.type) ?? false);

/** Sorts pages by Menu order, lower first, blank last. Stable, so pages with the same order stay oldest first. */
export const byMenuOrder = (a: PrismicDocument, b: PrismicDocument) => rank(a) - rank(b);
const rank = (doc: PrismicDocument) =>
  typeof doc.data.menu_order === 'number' ? doc.data.menu_order : Number.POSITIVE_INFINITY;

export interface Menu {
  main: (NavGroup & { type: string })[];
  footer: { heading: string; links: NavLink[] }[];
}

function build(all: Pages): Menu {
  const main = HUBS.flatMap((hub) => {
    const doc = all.single(hub.id);
    if (!doc) return [];
    const childTypes = PAGE_TYPES.filter((t) => 'parent' in t && t.parent === hub.id && MENU_TYPES.has(t.id)).map((t) => t.id as string);
    const children = all.docs
      .filter((d) => childTypes.includes(d.type) && inMenu(d))
      .sort(byMenuOrder)
      .map((d) => ({ label: all.preview(d).title, href: all.preview(d).href }));
    const { title, href } = all.preview(doc);
    return [{ type: hub.id, label: title, href, ...(children.length ? { children } : {}) }];
  });

  // The footer repeats some of the menu's sections, with a few extra links.
  const footer = Object.entries(footerExtras).flatMap(([type, extra]) => {
    const group = main.find((g) => g.type === type);
    return group ? [{ heading: group.label, links: [...(group.children ?? []), ...extra] }] : [];
  });
  return { main, footer: [...footer, footerEdCo] };
}

const built = new WeakMap<Pages, Menu>();

/** The menus, as the current request should see them (drafts while previewing). */
export async function menu(locals?: App.Locals): Promise<Menu> {
  const all = await pages(locals);
  if (!built.has(all)) built.set(all, build(all));
  return built.get(all)!;
}
