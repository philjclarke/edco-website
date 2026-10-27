/*
  Brief §5 — the conceptual model underpinning the entire website — plus the
  joined-up routes (§71). The beliefs that lead About EdCo (§61) are a
  Features listing on the About page.
  Words in Prismic (Site settings); see pageCopy.ts.
*/

import { settings } from './pageCopy';
import { outcomes, routeOf } from './outcomes';

export interface ModelStep {
  name: string;
  summary: string;
  methods: string[];
  icon?: string;
}
export interface Route {
  objective: string;
  steps: string[];
  /** Where each step is done, by position — every step links somewhere. */
  stepHrefs: string[];
}

/* LISTEN → UNDERSTAND → GIVE → ENGAGE → BUILD → GROW */
export const edcoModel: ModelStep[] = settings.edcoModel;

/* Brief §71 — joined-up routes through EdCo for real customer objectives.
   Deliberately not labelled "plays" in public.
   Each outcome page's How we do it section is the route for that outcome, so
   routes are read from there rather than kept twice. */
export const routes: Route[] = outcomes
  .map(routeOf)
  .filter((r): r is NonNullable<typeof r> => Boolean(r))
  .map((r) => ({ objective: r.objective, steps: r.steps, stepHrefs: r.stepHrefs.map((h) => h ?? '') }));
