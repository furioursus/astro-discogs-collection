import fs from 'node:fs';
import path from 'node:path';
import { fetchCollection, fetchWantlist } from './discogs-api.js';
import { getConfig } from './config.js';
function loadJson(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    catch {
        return null;
    }
}
function saveJson(filePath, data) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data));
}
async function loadUncached(kind) {
    const config = getConfig();
    if (config.missingConfig) {
        return { releases: [], missingConfig: true, error: null };
    }
    const cacheKey = kind === 'collection' ? `collection:${config.username}:${config.folderId}` : `wantlist:${config.username}`;
    const cacheTtlMs = config.cacheTtlHours * 60 * 60 * 1000;
    const cache = loadJson(config.cachePath) ?? {};
    const now = Date.now();
    const cached = cache[cacheKey];
    if (cached && now - cached.fetchedAt < cacheTtlMs) {
        return { releases: cached.releases, missingConfig: false, error: null };
    }
    try {
        const releases = kind === 'collection'
            ? await fetchCollection(config.username, config.folderId)
            : await fetchWantlist(config.username);
        cache[cacheKey] = { fetchedAt: now, releases };
        saveJson(config.cachePath, cache);
        return { releases, missingConfig: false, error: null };
    }
    catch (err) {
        return {
            releases: [],
            missingConfig: false,
            error: err instanceof Error ? err.message : 'Failed to load from the Discogs API.',
        };
    }
}
let collectionPromise = null;
let wantlistPromise = null;
/**
 * Loads the user's collection once per build, no matter how many pages or
 * components ask for it — later callers just await the same in-flight/
 * resolved promise instead of re-hitting Discogs.
 */
export function loadCollection() {
    if (!collectionPromise) {
        collectionPromise = loadUncached('collection');
    }
    return collectionPromise;
}
/** Same idea as `loadCollection()`, for the wantlist. */
export function loadWantlist() {
    if (!wantlistPromise) {
        wantlistPromise = loadUncached('wantlist');
    }
    return wantlistPromise;
}
