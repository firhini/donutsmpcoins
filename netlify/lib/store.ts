/**
 * Key/value storage abstraction.
 * - On Netlify (deploys + `netlify dev`): Netlify Blobs.
 * - Local fallback (plain `vite` dev / tests): JSON files under .data/<store>/ .
 */
import { getStore as getBlobStore } from '@netlify/blobs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type StoreName =
  | 'orders'
  | 'coupons'
  | 'reviews'
  | 'giveaways'
  | 'giveaway-entries'
  | 'spins'
  | 'credit'
  | 'settings'
  | 'catalog'
  | 'ratelimit'
  | 'misc';

const DATA_DIR = path.resolve(process.cwd(), '.data');
let blobsAvailable: boolean | null = null;

function safeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9:_\-.@]/g, '_');
}

function blobStore(name: StoreName) {
  return getBlobStore({ name, consistency: 'strong' });
}

async function useBlobs(): Promise<boolean> {
  if (blobsAvailable !== null) return blobsAvailable;
  try {
    const s = blobStore('misc');
    await s.get('__ping__');
    blobsAvailable = true;
  } catch (err) {
    const msg = String((err as Error)?.message ?? err);
    if (/MissingBlobsEnvironment|environment has not been configured|Netlify Blobs/i.test(msg)) {
      blobsAvailable = false;
    } else {
      // network or other transient error – assume blobs exist (we are on Netlify)
      blobsAvailable = !!process.env.NETLIFY || !!process.env.NETLIFY_BLOBS_CONTEXT;
    }
  }
  if (!blobsAvailable) {
    console.warn('[store] Netlify Blobs not available – using local file fallback in .data/');
  }
  return blobsAvailable;
}

async function filePath(store: StoreName, key: string): Promise<string> {
  const dir = path.join(DATA_DIR, store);
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, `${safeKey(key)}.json`);
}

export async function kvGet<T>(store: StoreName, key: string): Promise<T | null> {
  if (await useBlobs()) {
    const v = await blobStore(store).get(key, { type: 'json' });
    return (v as T) ?? null;
  }
  try {
    const raw = await fs.readFile(await filePath(store, key), 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function kvSet<T>(store: StoreName, key: string, value: T): Promise<void> {
  if (await useBlobs()) {
    await blobStore(store).setJSON(key, value as unknown as object);
    return;
  }
  const p = await filePath(store, key);
  const tmp = `${p}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(tmp, p);
}

export async function kvDelete(store: StoreName, key: string): Promise<void> {
  if (await useBlobs()) {
    await blobStore(store).delete(key);
    return;
  }
  try {
    await fs.unlink(await filePath(store, key));
  } catch {
    /* ignore */
  }
}

/** List keys (optionally by prefix). */
export async function kvList(store: StoreName, prefix?: string): Promise<string[]> {
  if (await useBlobs()) {
    const { blobs } = await blobStore(store).list(prefix ? { prefix } : undefined);
    return blobs.map((b) => b.key);
  }
  try {
    const dir = path.join(DATA_DIR, store);
    const files = await fs.readdir(dir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.slice(0, -5))
      .filter((k) => !prefix || k.startsWith(safeKey(prefix)));
  } catch {
    return [];
  }
}

/**
 * Read-modify-write helper. Blobs have no transactions; this is best-effort
 * (fine for a small shop). `mutate` receives the current value (or null).
 */
export async function kvUpdate<T>(store: StoreName, key: string, mutate: (current: T | null) => T): Promise<T> {
  const current = await kvGet<T>(store, key);
  const next = mutate(current);
  await kvSet(store, key, next);
  return next;
}
