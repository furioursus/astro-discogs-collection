import fs from 'node:fs';
import path from 'node:path';
import { fetchCollection, fetchWantlist } from './discogs-api.js';
import { getConfig } from './config.js';
import type { DiscogsRelease } from './types.js';

// Build-time only: reads the user's collection/wantlist from Discogs once
// per build (or dev-session), caching the result on disk so repeated local
// builds don't re-hit the API at all within cacheTtlHours.

export interface LoadedCollection {
  releases: DiscogsRelease[];
  /** Set when username/token aren't configured — the page can render a setup message instead of failing the build. */
  missingConfig: boolean;
  /** Set when the Discogs request itself failed (bad token, network error, etc.). */
  error: string | null;
}

interface CacheEntry {
  fetchedAt: number;
  releases: DiscogsRelease[];
}

type Cache = Record<string, CacheEntry>;

function loadJson<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

function saveJson(filePath: string, data: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data));
}

async function loadUncached(kind: 'collection' | 'wantlist'): Promise<LoadedCollection> {
  const config = getConfig();

  if (config.missingConfig) {
    return { releases: [], missingConfig: true, error: null };
  }

  const cacheKey = kind === 'collection' ? `collection:${config.username}:${config.folderId}` : `wantlist:${config.username}`;
  const cacheTtlMs = config.cacheTtlHours * 60 * 60 * 1000;
  const cache = loadJson<Cache>(config.cachePath) ?? {};
  const now = Date.now();

  const cached = cache[cacheKey];
  if (cached && now - cached.fetchedAt < cacheTtlMs) {
    return { releases: cached.releases, missingConfig: false, error: null };
  }

  try {
    const releases =
      kind === 'collection'
        ? await fetchCollection(config.username, config.folderId)
        : await fetchWantlist(config.username);

    cache[cacheKey] = { fetchedAt: now, releases };
    saveJson(config.cachePath, cache);

    return { releases, missingConfig: false, error: null };
  } catch (err) {
    return {
      releases: [],
      missingConfig: false,
      error: err instanceof Error ? err.message : 'Failed to load from the Discogs API.',
    };
  }
}

let collectionPromise: Promise<LoadedCollection> | null = null;
let wantlistPromise: Promise<LoadedCollection> | null = null;

/**
 * Loads the user's collection once per build, no matter how many pages or
 * components ask for it — later callers just await the same in-flight/
 * resolved promise instead of re-hitting Discogs.
 */
export function loadCollection(): Promise<LoadedCollection> {
  if (!collectionPromise) {
    collectionPromise = loadUncached('collection');
  }
  return collectionPromise;
}

/** Same idea as `loadCollection()`, for the wantlist. */
export function loadWantlist(): Promise<LoadedCollection> {
  if (!wantlistPromise) {
    wantlistPromise = loadUncached('wantlist');
  }
  return wantlistPromise;
}
