/*
  Where the site's forms post: the contact form and the footer's subscribe
  form. Each submission becomes an email to EdCo, sent through SendGrid's SMTP
  relay, with Reply-To set to the visitor so EdCo can answer it directly.

  The SMTP details live only in Vercel's environment variables (see README,
  Forms). Without them the form says it couldn't send and offers the phone
  number, rather than pretending to succeed.

  Two cheap checks keep out most automated spam: a hidden field people never
  fill in, and a minimum time between the page loading and the form sending.
*/
import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';
import { outcomes } from '@/data/outcomes';
import { sameOrigin } from '@/lib/http';

export const prerender = false;

const env = (k: string) => process.env[k]?.trim() || undefined;

// What the visitor typed, trimmed and capped, with line breaks kept only where
// they belong (the message box).
const field = (data: FormData, name: string, max = 200) =>
  String(data.get(name) ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const message = (data: FormData) =>
  String(data.get('more') ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, 5000);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MS = 2500;

const OBJECTIVES: Record<string, string> = {
  ...Object.fromEntries(outcomes.map((o) => [o.slug, o.navLabel])),
  'customer-analysis': 'The free customer analysis',
};

type Result = { ok: true } | { ok: false; error: 'invalid' | 'unavailable' | 'failed' };

const reply = (request: Request, result: Result, status: number, form = '') => {
  // Without JavaScript the browser posted the form itself: send it back to the
  // page it came from, with the form and the outcome in the address for the
  // page to show.
  if (!request.headers.get('accept')?.includes('application/json')) {
    const back = new URL(request.headers.get('referer') ?? '/', request.url);
    back.searchParams.set('form', form);
    back.searchParams.set('result', result.ok ? 'sent' : result.error);
    return Response.redirect(back.toString(), 303);
  }
  return new Response(JSON.stringify(result), { status, headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return new Response('Forbidden', { status: 403 });

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return reply(request, { ok: false, error: 'invalid' }, 400);
  }

  const form = field(data, 'form', 20);
  // A bot: pretend it worked, so it has nothing to learn from.
  const started = Number(data.get('started'));
  if (field(data, 'website') || (started && Date.now() - started < MIN_MS)) return reply(request, { ok: true }, 200, form);

  const name = field(data, 'name');
  const organisation = field(data, 'organisation');
  const email = field(data, 'email', 254);
  if (!EMAIL.test(email) || (form === 'contact' && (!name || !organisation)) || !['contact', 'subscribe'].includes(form)) {
    return reply(request, { ok: false, error: 'invalid' }, 400, form);
  }

  const host = env('SMTP_HOST');
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  const to = env('FORM_TO');
  const from = env('FORM_FROM');
  if (!host || !user || !pass || !to || !from) {
    console.error('[form] Not sent: set SMTP_HOST, SMTP_USER, SMTP_PASS, FORM_TO and FORM_FROM in Vercel.');
    return reply(request, { ok: false, error: 'unavailable' }, 503, form);
  }

  const page = field(data, 'page', 300);
  const who = organisation ? `${name}, ${organisation}` : name || email;
  let subject: string;
  let lines: string[];
  if (form === 'contact') {
    const objectives = data.getAll('objective').map((v) => OBJECTIVES[String(v)]).filter(Boolean);
    subject = `Website enquiry from ${who}`;
    lines = [
      `Name: ${name}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      '',
      'What they’re trying to achieve:',
      ...(objectives.length ? objectives.map((o) => `- ${o}`) : ['(nothing ticked)']),
      '',
      'Tell us a little more:',
      message(data) || '(left blank)',
    ];
  } else {
    subject = `Newsletter sign-up from ${who}`;
    lines = [`Name: ${name || '(not given)'}`, `Email: ${email}`];
  }
  lines.push('', `Sent from ${page || 'the website'} on ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}.`);

  const port = Number(env('SMTP_PORT') ?? 587);
  // SendGrid takes 587 with STARTTLS. A mail server on this machine, for testing, needn't.
  const local = ['localhost', '127.0.0.1'].includes(host);
  try {
    await nodemailer
      .createTransport({ host, port, secure: port === 465, requireTLS: port !== 465 && !local, auth: { user, pass } })
      .sendMail({ from, to: to.split(',').map((a) => a.trim()), replyTo: { name: name || email, address: email }, subject, text: lines.join('\n') });
  } catch (e) {
    console.error('[form] SMTP send failed:', e instanceof Error ? e.message : e);
    return reply(request, { ok: false, error: 'failed' }, 502, form);
  }
  return reply(request, { ok: true }, 200, form);
};
