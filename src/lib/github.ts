/*
  Reading and writing the copy JSON through the GitHub API.

  GitHub stays the source of truth: the admin page compares the sheet against
  what is committed, and publishing is an ordinary commit. That means every
  change the client makes has an author, a timestamp and a diff, and can be
  reverted by anyone with the repo — no special tooling, no separate audit log.

  The commit is what triggers Vercel to rebuild; nothing here talks to Vercel.
*/

import { env, requireEnv } from './env';

const API = 'https://api.github.com';
const COPY_PATH = 'src/data/copy';

function config() {
  return {
    token: requireEnv('GITHUB_TOKEN'),
    repo: requireEnv('GITHUB_REPO'),
    branch: env('GITHUB_BRANCH') ?? 'main',
  };
}

async function gh(path: string, init: RequestInit = {}) {
  const { token } = config();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub ${res.status} on ${path}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

/** One file's current content and blob sha. */
export async function readJson(path: string): Promise<{ data: any; sha: string }> {
  const { repo, branch } = config();
  const file = await gh(`/repos/${repo}/contents/${encodeURI(path)}?ref=${branch}`);
  const text = Buffer.from(file.content, 'base64').toString('utf8');
  return { data: JSON.parse(text), sha: file.sha };
}

/**
 * Commit several files at once, as a single commit.
 *
 * Done through the git data API rather than one PUT per file, because separate
 * commits would each trigger their own Vercel build and leave the site briefly
 * showing half a publish.
 */
export async function commitFiles(
  files: { path: string; content: string }[],
  message: string
): Promise<{ sha: string; url: string }> {
  const { repo, branch } = config();

  const ref = await gh(`/repos/${repo}/git/ref/heads/${branch}`);
  const baseSha = ref.object.sha;
  const baseCommit = await gh(`/repos/${repo}/git/commits/${baseSha}`);

  const blobs = await Promise.all(
    files.map(async (f) => {
      const blob = await gh(`/repos/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: f.content, encoding: 'utf-8' }),
      });
      return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
    })
  );

  const tree = await gh(`/repos/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({ base_tree: baseCommit.tree.sha, tree: blobs }),
  });

  const commit = await gh(`/repos/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
  });

  await gh(`/repos/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha }),
  });

  return { sha: commit.sha, url: `https://github.com/${repo}/commit/${commit.sha}` };
}

/** The commit the live copy is at — compared against the deck's export stamp. */
export async function currentCopyCommit(): Promise<string> {
  const { repo, branch } = config();
  const commits = await gh(`/repos/${repo}/commits?sha=${branch}&path=${COPY_PATH}&per_page=1`);
  return (commits as any[])[0]?.sha ?? '';
}

/** The most recent publishes, so the admin page can show a history. */
export async function recentPublishes(limit = 5) {
  const { repo, branch } = config();
  const commits = await gh(
    `/repos/${repo}/commits?sha=${branch}&path=${COPY_PATH}&per_page=${limit}`
  );
  return (commits as any[]).map((c) => ({
    sha: c.sha.slice(0, 7),
    message: (c.commit.message as string).split('\n')[0],
    when: c.commit.author.date as string,
    url: c.html_url as string,
  }));
}
