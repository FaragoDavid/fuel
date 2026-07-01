import type { Fillup } from '../types/fillup';

const TOKEN = import.meta.env.VITE_GITHUB_TOKEN as string | undefined;
const REPO = import.meta.env.VITE_GITHUB_REPO as string | undefined;
const FILE_PATH = 'public/fillups.json';
const STORAGE_KEY = 'fuel_fillups';

export async function readFillups(): Promise<Fillup[]> {
  if (import.meta.env.DEV) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  }

  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}fillups.json`);
  if (!res.ok) throw new Error(`Failed to fetch fillups.json: ${res.status}`);
  return res.json();
}

export async function writeFillups(fillups: Fillup[]): Promise<void> {
  if (import.meta.env.DEV) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fillups));
    return;
  }

  if (!TOKEN) throw new Error('VITE_GITHUB_TOKEN must be set');
  if (!REPO) throw new Error('VITE_GITHUB_REPO must be set');

  const apiBase = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

  const current = await fetch(apiBase, { headers });
  if (!current.ok) throw new Error(`GitHub API error: ${current.status}`);
  const { sha } = await current.json();

  const content = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(fillups, null, 2) + '\n')));

  const update = await fetch(apiBase, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ message: 'update fillups', content, sha }),
  });

  if (!update.ok) {
    const body = await update.json().catch(() => ({}));
    throw new Error(`GitHub write failed: ${update.status} ${body.message ?? ''}`);
  }
}
