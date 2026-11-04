/*
  Sends any form marked data-form to /api/form without leaving the page, then
  swaps the form for its thank-you message (or shows what went wrong).
  The wording comes from the form's data-sent and data-error attributes.

  Without JavaScript the form still posts; the handler sends the visitor back
  with ?form=contact&result=sent (or the error) in the address, which is shown
  here on load.

  A sent form is reported to Google Analytics, when it's loaded (the live site
  only; see Analytics.astro): generate_lead for the contact form, sign_up for
  the newsletter, and the contact form's Google Ads conversion as before.
*/
import { analytics } from '@/data/site';

type Outcome = 'sent' | 'invalid' | 'unavailable' | 'failed';

function show(form: HTMLFormElement, outcome: Outcome) {
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  if (!status) return;
  const sent = outcome === 'sent';
  status.textContent =
    outcome === 'invalid'
      ? 'Please check your details and try again.'
      : ((sent ? form.dataset.sent : form.dataset.error) ?? '');
  status.dataset.state = sent ? 'sent' : 'error';
  status.hidden = false;
  if (sent) {
    for (const el of form.querySelectorAll<HTMLElement>(':scope > :not([data-form-status])')) el.hidden = true;
    // The form has just collapsed around the message: bring it into view.
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: 'center' });
  }
}

function track(form: HTMLFormElement) {
  const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;
  const name = form.dataset.form;
  gtag('event', name === 'subscribe' ? 'sign_up' : 'generate_lead', { form_name: name, page_path: location.pathname });
  if (name === 'contact') gtag('event', 'conversion', { send_to: analytics.contactConversion });
}

const started = String(Date.now());
const query = new URLSearchParams(location.search);
const returned = query.get('result') as Outcome | null;

for (const form of document.querySelectorAll<HTMLFormElement>('form[data-form]')) {
  const set = (name: string, value: string) => {
    let input = form.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    if (!input) form.append((input = Object.assign(document.createElement('input'), { type: 'hidden', name })));
    input.value = value;
  };
  set('started', started);
  set('page', location.pathname);
  if (returned && form.dataset.form === query.get('form')) show(form, returned);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const label = button?.textContent;
    if (button) {
      button.disabled = true;
      button.textContent = 'Sending…';
    }
    let outcome: Outcome = 'failed';
    try {
      const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      const body = await res.json().catch(() => ({}));
      outcome = body.ok ? 'sent' : (body.error ?? 'failed');
    } catch {
      outcome = 'failed';
    }
    if (button) {
      button.disabled = false;
      button.textContent = label ?? '';
    }
    show(form, outcome);
    if (outcome === 'sent') track(form);
  });
}
