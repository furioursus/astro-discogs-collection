import fs from 'node:fs';
import path from 'node:path';
import { fetchCollection, fetchWantlist, fetchPriceSuggestions } from './discogs-api.js';
import { getConfig, type ResolvedConfig } from './config.js';
import type { DiscogsRelease, PriceSuggestions } from './types.js';

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

interface ListCacheEntry {
  fetchedAt: number;
  releases: DiscogsRelease[];
}

interface PriceCacheEntry {
  fetchedAt: number;
  suggestions: PriceSuggestions | null;
}

interface CacheFile {
  lists?: Record<string, ListCacheEntry>;
  prices?: Record<string, PriceCacheEntry>;
}

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

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Fills in `priceSuggestions`/`averagePrice` for a list of releases, one
 * Discogs request per release not already cached within priceCacheTtlHours.
 * A release Discogs has no price data for caches as null so it isn't
 * re-requested every build either. A single release's fetch failing doesn't
 * fail the whole list — it's just left without price data.
 */
async function attachPriceSuggestions(
  releases: DiscogsRelease[],
  config: ResolvedConfig,
  cache: CacheFile
): Promise<DiscogsRelease[]> {
  const prices = (cache.prices ??= {});
  const ttlMs = config.priceCacheTtlHours * 60 * 60 * 1000;
  const now = Date.now();
  let dirty = false;

  const result: DiscogsRelease[] = [];
  for (const release of releases) {
    const key = String(release.id);
    const cached = prices[key];

    let suggestions: PriceSuggestions | null;
    if (cached && now - cached.fetchedAt < ttlMs) {
      suggestions = cached.suggestions;
    } else {
      try {
        suggestions = await fetchPriceSuggestions(release.id);
      } catch {
        suggestions = null;
      }
      prices[key] = { fetchedAt: now, suggestions };
      dirty = true;
    }

    result.push({
      ...release,
      priceSuggestions: suggestions,
      averagePrice: suggestions ? average(Object.values(suggestions).map((s) => s.value)) : null,
    });
  }

  if (dirty) saveJson(config.cachePath, cache);
  return result;
}

async function loadUncached(kind: 'collection' | 'wantlist'): Promise<LoadedCollection> {
  const config = getConfig();

  if (config.missingConfig) {
    return { releases: [], missingConfig: true, error: null };
  }

  const cacheKey =
    kind === 'collection' ? `collection:${config.username}:${config.folderId}` : `wantlist:${config.username}`;
  const cacheTtlMs = config.cacheTtlHours * 60 * 60 * 1000;
  const cache = loadJson<CacheFile>(config.cachePath) ?? {};
  const lists = (cache.lists ??= {});
  const now = Date.now();

  try {
    const cached = lists[cacheKey];
    let releases: DiscogsRelease[];

    if (cached && now - cached.fetchedAt < cacheTtlMs) {
      releases = cached.releases;
    } else {
      releases =
        kind === 'collection'
          ? await fetchCollection(config.username, config.folderId)
          : await fetchWantlist(config.username);

      lists[cacheKey] = { fetchedAt: now, releases };
      saveJson(config.cachePath, cache);
    }

    if (config.includePrices) {
      releases = await attachPriceSuggestions(releases, config, cache);
    }

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
