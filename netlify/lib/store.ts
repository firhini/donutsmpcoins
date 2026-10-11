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
 * Atomic read-modify-write with optimistic concurrency.
 * - Blobs: uses ETags (`onlyIfMatch` / `onlyIfNew`) and retries on conflict.
 * - File fallback: serialises through an exclusive lock file.
 * `mutate` may throw to abort (nothing is written then). Returns the stored value.
 */
export async function kvUpdate<T>(store: StoreName, key: string, mutate: (current: T | null) => T): Promise<T> {
  if (await useBlobs()) {
    const s = blobStore(store);
    for (let attempt = 0; attempt < 8; attempt++) {
      const entry = await s.getWithMetadata(key, { type: 'json' });
      const current = (entry?.data as T | undefined) ?? null;
      const etag = entry?.etag;
      const next = mutate(current);
      const res = etag ? await s.setJSON(key, next as unknown as object, { onlyIfMatch: etag }) : await s.setJSON(key, next as unknown as object, { onlyIfNew: true });
      if (res.modified) return next;
      await new Promise((r) => setTimeout(r, 15 + Math.floor(Math.random() * 60) * (attempt + 1)));
    }
    throw new Error(`[store] concurrent update conflict on ${store}/${key}`);
  }
  // local file fallback: exclusive lock file
  const p = await filePath(store, key);
  const lock = `${p}.lock`;
  let handle: fs.FileHandle | null = null;
  for (let attempt = 0; attempt < 200 && !handle; attempt++) {
    try {
      handle = await fs.open(lock, 'wx');
    } catch {
      await new Promise((r) => setTimeout(r, 5));
    }
  }
  try {
    const current = await kvGet<T>(store, key);
    const next = mutate(current);
    await kvSet(store, key, next);
    return next;
  } finally {
    if (handle) {
      await handle.close();
      await fs.unlink(lock).catch(() => undefined);
    }
  }
}
