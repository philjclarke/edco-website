import type { APIRoute } from 'astro';
import { cookieIsValid, COOKIE_NAME, sameOrigin } from '@/lib/auth';
import { readJson, readJsonAt, commitFiles, currentCopyCommit } from '@/lib/github';
import { requireEnv } from '@/lib/env';
import { diffDeck, applyDiff, fetchDeck, SOURCES, COPY_DIR } from '@/lib/deck';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, request }) => {
  if (!sameOrigin(request)) {
    return new Response(JSON.stringify({ error: 'Forbidden.' }), { status: 403 });
  }
  if (!(await cookieIsValid(cookies.get(COOKIE_NAME)?.value))) {
    return new Response(JSON.stringify({ error: 'Not signed in.' }), { status: 401 });
  }

  try {
    const form = await request.formData();
    const who = String(form.get('who') ?? '').trim();

    const csv = await fetchDeck(requireEnv('DECK_CSV_URL'));

    // Read every file fresh, so the publish is based on what is actually live
    // rather than on whatever this deployment was built from.
    const files: Record<string, any> = {};
    const shas: Record<string, string> = {};
    for (const src of SOURCES) {
      const { data, sha } = await readJson(`${COPY_DIR}/${src.file}`);
      files[src.file] = data;
      shas[src.file] = sha;
    }

    const live = await currentCopyCommit();
    const stamp = diffDeck(csv, files).exportedFrom;

    // Without a stamp there is no merge base, so an edit can't be told apart
    // from a cell the site has since moved past. The console hides the button
    // in that case; this is the check that actually enforces it.
    if (!stamp) {
      return new Response(
        JSON.stringify({
          error:
            'This copy deck predates export stamps, so its edits cannot be told apart from ' +
            'out-of-date cells. Ask for a fresh export.',
        }),
        { status: 409 }
      );
    }

    let base: Record<string, any> | undefined;
    if (stamp !== live) {
      base = {};
      for (const src of SOURCES) {
        base[src.file] = await readJsonAt(`${COPY_DIR}/${src.file}`, stamp);
      }
    }
    const diff = diffDeck(csv, files, base);

    if (!diff.changes.length) {
      return new Response(
        JSON.stringify({
          ok: true,
          changed: 0,
          message: diff.conflicts.length
            ? 'Nothing could be published — every change needs a decision first.'
            : 'Nothing to publish.',
        }),
        { status: 200 }
      );
    }

    const touched = applyDiff(diff.changes, files);
    const payload = touched.map((f) => ({
      path: `${COPY_DIR}/${f}`,
      content: JSON.stringify(files[f], null, 2) + '\n',
    }));

    const n = diff.changes.length;
    const pages = [...new Set(diff.changes.map((c) => c.page))];
    const message =
      `Copy update: ${n} field${n === 1 ? '' : 's'} across ${pages.length} page${pages.length === 1 ? '' : 's'}\n\n` +
      pages.map((p) => `- ${p}`).join('\n') +
      `\n\nPublished from the copy deck${who ? ` by ${who}` : ''}.`;

    const commit = await commitFiles(payload, message);

    return new Response(
      JSON.stringify({ ok: true, changed: n, files: touched.length, commit: commit.url }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
};
