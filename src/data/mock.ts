/*
  MOCK PROOF — invented quotes, so the design can be judged in full while
  EdCo's real copy is outstanding.

  Every name, role and organisation is deliberately, obviously fake. None of
  this is in the copy deck: it is never "copy", and it can't be published as
  if it were. Anything filled in for real — a shout-out's text in the deck, a
  testimonial once one exists — replaces the mock in that spot.

  Set MOCK_PROOF to false (or delete this file's usages) before launch: every
  mock goes back to being a visible [PLACEHOLDER]. Each one is rendered with
  data-mock, so `grep -r data-mock` over the build lists what is still mock.
*/

export const MOCK_PROOF = true;

export interface MockCite {
  name: string;
  role: string;
  org: string;
}
export interface MockQuote {
  text: string;
  cite: MockCite;
}

const people: MockCite[] = [
  { name: 'Alex Example', role: 'Head of Example Partnerships', org: 'Sample Learning Ltd' },
  { name: 'Sam Placeholder', role: 'Director of Placeholder Marketing', org: 'Fictional Academy Trust' },
  { name: 'Jo Bloggs', role: 'Pretend Head of Product', org: 'Mock Education Group' },
  { name: 'Pat Sample', role: 'Imaginary Chief Executive', org: 'Placeholder Publishing' },
  { name: 'Morgan Mockup', role: 'Hypothetical Head of Growth', org: 'Example EdTech Co.' },
  { name: 'Taylor Testcase', role: 'Made-up Marketing Manager', org: 'Dummy Resources plc' },
  { name: 'Robin Lorem', role: 'Fictitious Partnerships Lead', org: 'Specimen Schools Trust' },
  { name: 'Chris Dummy', role: 'Invented Insight Director', org: 'Not-A-Real Agency' },
];

/* Shout-out bands: short, punchy, the kind of thing a client says in one line. */
const shoutLines = [
  'They told us what we didn’t want to hear — and they were right.',
  'For the first time, we knew which schools actually needed us.',
  'It felt like an extension of our own team, not a supplier.',
  'We stopped guessing what teachers wanted. We asked them.',
  'Our pipeline is smaller, and worth three times as much.',
  'They understood education and our business in the same conversation.',
  'Six years in, they still challenge the brief.',
  'The webinar was the start. The relationships are what we kept.',
  'They found the headteachers we’d been failing to reach for years.',
  'We came for a campaign and left with a strategy.',
];

/* Testimonials, keyed by the theme the brief says each should speak to. */
const testimonials: Record<string, string[]> = {
  'EdCo challenging the original brief': [
    'We came in asking for a campaign. EdCo asked why, spoke to a dozen school leaders, and showed us the campaign was answering the wrong question. What we built instead is still working three years later.',
    'The most useful thing they did was push back. Our brief assumed teachers wanted a product. What they wanted was help with a problem — and that changed everything we did next.',
  ],
  'EdCo understanding both education and the client’s business': [
    'Most agencies understand marketing or understand schools. EdCo understood both, and understood what we needed to sell, which is rarer still.',
    'They spoke our language in the boardroom and the staffroom’s language in the content. We have not found that combination anywhere else.',
  ],
  'EdCo feeling like part of the client team': [
    'By the second month nobody in our team thought of them as an agency. They were in our stand-ups, they knew our numbers, and they cared about them.',
    'They worked under our name, to our standards, and never once made it about them. Our client still thinks it was all us.',
  ],
  'a long-term relationship': [
    'We have worked with EdCo for the better part of a decade. The team has changed, the market has changed, and they have still been the people we call first.',
  ],
  'working with EdCo': [
    'Straightforward, honest and genuinely expert. They made the education market feel a lot less opaque.',
  ],
};

/** A stable number from a string, so a page always shows the same mock. */
function seed(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

/** The mock for the nth shout-out on a page. Consecutive bands never repeat. */
export function mockShout(page: string, n: number): MockQuote {
  const base = seed(page);
  return {
    text: shoutLines[(base + n) % shoutLines.length],
    cite: people[(base + n * 3) % people.length],
  };
}

/** The mock testimonial for a page and theme. */
export function mockTestimonial(page: string, theme: string): MockQuote {
  const pool = testimonials[theme] ?? testimonials['working with EdCo'];
  const base = seed(page + theme);
  return { text: pool[base % pool.length], cite: people[(base + 5) % people.length] };
}
