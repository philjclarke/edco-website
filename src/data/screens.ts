/*
  Product screenshots, keyed so that the copy JSON can reference one by name
  without holding an import. Astro optimises whatever is imported here.

  These are Education IQ *design prototypes* using example data — the footer of
  each capture says so. They stand in until EdCo supply captures of the live
  product; see OUTSTANDING.md.
*/

import search from '@/assets/screens/education-iq/01-search-dark.png';
import topListFinancial from '@/assets/screens/education-iq/03-top-list-financial-dark.png';
import trustOverview from '@/assets/screens/education-iq/04-trust-overview-dark.png';
import trustComparisons from '@/assets/screens/education-iq/05-trust-school-comparisons-dark.png';
import schoolOverview from '@/assets/screens/education-iq/09-school-overview-dark.png';
import schoolOfstedFinance from '@/assets/screens/education-iq/11-school-ofsted-finance-dark.png';
import pitchBriefing from '@/assets/screens/education-iq/14-pitch-briefing-dark.png';
import projectsAnalyse from '@/assets/screens/education-iq/16-projects-analyse-financial-dark.png';

export const screens = {
  'eiq/search': search,
  'eiq/top-list-financial': topListFinancial,
  'eiq/trust-overview': trustOverview,
  'eiq/trust-comparisons': trustComparisons,
  'eiq/school-overview': schoolOverview,
  'eiq/school-ofsted-finance': schoolOfstedFinance,
  'eiq/pitch-briefing': pitchBriefing,
  'eiq/projects-analyse': projectsAnalyse,
} as const;

export type ScreenKey = keyof typeof screens;
export const isScreenKey = (k: string | undefined): k is ScreenKey =>
  Boolean(k && k in screens);
