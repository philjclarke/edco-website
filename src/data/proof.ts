/*
  Brief §16 and §76. Every figure is a candidate drawn from the brief and is
  UNVERIFIED until EdCo confirm it in writing — flipping `verified` to true is
  what removes the [VERIFY] chip from the page. Brief §16 also bans vanity
  statistics such as email volume.

  Words in ./copy/proof.json — see outcomes.ts for the rationale.
*/

import data from './copy/proof.json';

export interface ProofStat {
  value: string;
  label: string;
  verified: boolean;
}

export const proofStats: ProofStat[] = data.proofStats;

/* Brief §76: do not imply a historical relationship is current unless confirmed. */
export const logoCandidates: string[] = data.logoCandidates;

/* Brief §59 — testimonials are commissioned against these themes. */
export const testimonialThemes: string[] = data.testimonialThemes;

/* Brief §57 — the case-study themes to source for launch. */
export const caseStudyThemes: string[] = data.caseStudyThemes;
