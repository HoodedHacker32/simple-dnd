import type { ContentPack } from '../content';

export const REPO_OWNER = 'HoodedHacker32';
export const REPO_NAME = 'simple-dnd';
export const PACK_PATH = 'src/content/pack.json';
const BASE_BRANCH = 'main';

const API = 'https://api.github.com';

/*
 * The token is held in sessionStorage only: it survives a page refresh but dies
 * with the tab. It is never written to the repo, never logged, and never sent
 * anywhere except api.github.com over HTTPS.
 */
const TOKEN_KEY = 'chroniclers-table.gh-token';

export function getToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string): void {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  else sessionStorage.removeItem(TOKEN_KEY);
}

export class GitHubError extends Error {}

async function api<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new GitHubError(explain(res.status, body.message));
  }
  return res.json() as Promise<T>;
}

function explain(status: number, message?: string): string {
  if (status === 401) return 'GitHub rejected that token. Check it was copied in full and has not expired.';
  if (status === 403) {
    return 'That token lacks permission. It needs Contents: read and write, and Pull requests: read and write, on this repository.';
  }
  if (status === 404) {
    return `Could not find ${REPO_OWNER}/${REPO_NAME}. If the token is fine-grained, confirm this repository is in its list.`;
  }
  if (status === 422) return `GitHub refused the change: ${message ?? 'it may already exist.'}`;
  return message ? `GitHub said: ${message}` : `GitHub returned an unexpected ${status}.`;
}

/** Browser-safe UTF-8 → base64, which btoa alone cannot do. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function branchName(): string {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return `content/update-${stamp}`;
}

export interface ProposeResult {
  prUrl: string;
  prNumber: number;
  branch: string;
}

/**
 * Commits the pack to a new branch and opens a pull request against main.
 * Nothing reaches the live site until that PR is merged.
 */
export async function proposeContentChange(
  token: string,
  pack: ContentPack,
  summary: string,
): Promise<ProposeResult> {
  const repo = `/repos/${REPO_OWNER}/${REPO_NAME}`;

  const base = await api<{ object: { sha: string } }>(token, `${repo}/git/ref/heads/${BASE_BRANCH}`);
  const baseSha = base.object.sha;

  const branch = branchName();
  await api(token, `${repo}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: baseSha }),
  });

  // The update endpoint needs the blob sha of the file as it exists on main.
  const existing = await api<{ sha: string }>(token, `${repo}/contents/${PACK_PATH}?ref=${BASE_BRANCH}`);

  const body = JSON.stringify({ ...pack, updatedAt: new Date().toISOString() }, null, 2) + '\n';

  await api(token, `${repo}/contents/${PACK_PATH}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Update game content: ${summary}`,
      content: toBase64(body),
      sha: existing.sha,
      branch,
    }),
  });

  const pr = await api<{ html_url: string; number: number }>(token, `${repo}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title: `Content update: ${summary}`,
      head: branch,
      base: BASE_BRANCH,
      body: [
        `Proposed from the Loremaster editor.`,
        '',
        `**${summary}**`,
        '',
        `- ${pack.races.length} races`,
        `- ${pack.classes.length} classes`,
        `- ${pack.codex.length} Codex sections`,
        '',
        'Merging this deploys the change to the live site.',
      ].join('\n'),
    }),
  });

  return { prUrl: pr.html_url, prNumber: pr.number, branch };
}
