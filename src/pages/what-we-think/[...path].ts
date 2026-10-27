/*
  What We Think became Insights & Opinion (Oct 2026). Research & insight
  merged into What we're hearing, and articles moved up to /insights/<name>/.
  Old addresses, with or without their trailing slash, redirect permanently.

  Runs on request rather than as config redirects: the Vercel adapter only
  matches a redirect's address exactly, so /what-we-think/ (with its slash)
  would 404.
*/
import type { APIRoute } from 'astro';

export const prerender = false;

const SECTIONS: Record<string, string> = {
  'what-were-hearing': 'what-were-hearing',
  opinion: 'opinion',
  'research-and-insight': 'what-were-hearing',
};

export const GET: APIRoute = ({ params, redirect }) => {
  const [section, article] = (params.path ?? '').split('/').filter(Boolean);
  const to = article ? `/insights/${article}/` : section && SECTIONS[section] ? `/insights/${SECTIONS[section]}/` : '/insights/';
  return redirect(to, 301);
};
