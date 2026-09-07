/*
  Brief §5 — the conceptual model underpinning the entire website — plus the
  beliefs that lead About EdCo (§61) and the joined-up routes (§71).
  Words in ./copy/model.json — see outcomes.ts for the rationale.
*/

import data from './copy/model.json';

export interface ModelStep {
  name: string;
  summary: string;
  methods: string[];
}
export interface Belief {
  title: string;
  body: string;
}
export interface Route {
  objective: string;
  steps: string[];
}

/* LISTEN → UNDERSTAND → GIVE → ENGAGE → BUILD → GROW */
export const edcoModel: ModelStep[] = data.edcoModel;

/* Brief §61 — About EdCo leads with beliefs, not a corporate timeline. */
export const beliefs: Belief[] = data.beliefs;

/* Brief §71 — joined-up routes through EdCo for real customer objectives.
   Deliberately not labelled "plays" in public. */
export const routes: Route[] = data.routes;
