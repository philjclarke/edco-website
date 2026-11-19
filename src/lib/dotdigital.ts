/*
  Adds a footer sign-up to EdCo's list in Dotdigital, with the consent wording
  they agreed to, through Dotdigital's contacts API (v3, "create or update a
  contact" by email). Someone already in Dotdigital is updated and added to the
  list; a blank last name doesn't wipe one they already have.

  The API user, password and list live only in Vercel's environment variables
  (see README, Forms). Without them this reports 'off' and the form handler
  emails the sign-up instead, as it did before Dotdigital.

  EdCo send their own welcome email from Dotdigital when someone joins the
  list, so nothing here emails anyone on success.
*/
const env = (k: string) => process.env[k]?.trim() || undefined;

export type Subscriber = {
  email: string;
  firstName: string;
  lastName: string;
  consent: { text: string; url: string; ipAddress: string; userAgent: string };
};

export type Added = 'added' | 'off' | 'failed';

export async function addSubscriber(s: Subscriber): Promise<Added> {
  const user = env('DOTDIGITAL_API_USER');
  const pass = env('DOTDIGITAL_API_PASSWORD');
  const list = Number(env('DOTDIGITAL_LIST_ID'));
  if (!user || !pass || !Number.isInteger(list) || list <= 0) return 'off';
  // The account's region is the r1/r2/r3 at the start of its Dotdigital address.
  const region = /^r[1-3]$/.test(env('DOTDIGITAL_REGION') ?? '') ? env('DOTDIGITAL_REGION') : 'r1';

  const dataFields: Record<string, string> = { FIRSTNAME: s.firstName };
  if (s.lastName) dataFields.LASTNAME = s.lastName;

  const url = `https://${region}-api.dotdigital.com/contacts/v3/email/${encodeURIComponent(s.email)}?merge-option=overwrite-if-not-empty`;
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        identifiers: { email: s.email },
        dataFields,
        lists: [list],
        channelProperties: { email: { status: 'subscribed', optInType: 'single', emailType: 'html' } },
        consentRecords: [{ ...s.consent, dateTimeConsented: new Date().toISOString() }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return 'added';
    console.error(`[form] Dotdigital refused the sign-up (${res.status}):`, (await res.text().catch(() => '')).slice(0, 300));
  } catch (e) {
    console.error('[form] Dotdigital unreachable:', e instanceof Error ? e.message : e);
  }
  return 'failed';
}
