/*
  Brief §10, §11, §21–§26 — the six outcome routes.
  These are the spine of the site: the visitor self-selects by objective, not
  by EdCo's org chart.

  The words live in ./copy/outcomes.json so the copy deck can round-trip them.
  This file owns the shape; the JSON owns the content.
*/

import type { NavLink } from './site';
import data from './copy/outcomes.json';

export interface Outcome {
  slug: string;
  /** Short form used in nav and card grids. */
  navLabel: string;
  /** Page H1. */
  title: string;
  /** The single sentence that carries the argument. */
  standfirst: string;
  summary: string;
  intro: string[];
  helpTitle: string;
  help: string[];
  pull?: string;
  /** Which joined-up route in `routes` (brief §71) illustrates this outcome. */
  routeObjective: string;
  icon?: string;
  banner?: { src: string; focus?: 'left' | 'centre' | 'right' };
  next: NavLink[];
}

export const outcomes: Outcome[] = data as Outcome[];

export const outcomeBySlug = Object.fromEntries(outcomes.map((o) => [o.slug, o]));
