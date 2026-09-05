/* Brief §46–§49. Three clearly differentiated editorial voices — the
   distinction has to stay clear, so it is described in one place. */

export const streams = [
  {
    slug: 'what-were-hearing',
    label: 'What we’re hearing',
    question: 'What is the sector telling us?',
    title: 'What we’re hearing',
    lead: 'We spend a lot of time talking to educators. This is where we share the themes, concerns and opportunities we’re hearing — and what they might mean for organisations working with education.',
    note: 'The EdCo institutional voice. Not education news, and not personally attributed.',
  },
  {
    slug: 'opinion',
    label: 'Opinion',
    question: 'What do we think about it?',
    title: 'What we think',
    lead: 'Sometimes listening leads to conclusions. Opinion is where EdCo people make the case for them.',
    note: 'Stronger, occasionally provocative, always attributed to a named author.',
  },
  {
    slug: 'research-and-insight',
    label: 'Research & insight',
    question: 'What does the evidence say?',
    title: 'Research worth knowing',
    lead: 'Deeper research, reports and evidence — with the finding first and the methodology available for anyone who wants it.',
    note: 'Evidence-led. Not a report archive.',
  },
] as const;

export type StreamSlug = (typeof streams)[number]['slug'];
export const streamBySlug = Object.fromEntries(streams.map((s) => [s.slug, s]));
