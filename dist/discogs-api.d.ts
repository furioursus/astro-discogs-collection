import type { DiscogsRelease, PriceSuggestions } from './types.js';
/**
 * Fetches every release in a user's collection folder (default: folder 0,
 * Discogs's built-in "All" folder), normalized to `DiscogsRelease`.
 */
export declare function fetchCollection(username: string, folderId: number): Promise<DiscogsRelease[]>;
/** Fetches every release on a user's wantlist, normalized to `DiscogsRelease`. */
export declare function fetchWantlist(username: string): Promise<DiscogsRelease[]>;
/**
 * Fetches Discogs's suggested price per condition grade for one release.
 * There's no bulk version of this endpoint — it's one request per release,
 * which is why `includePrices` is opt-in and cached separately (see
 * collection-data.ts). Returns null if Discogs has no suggestions for this
 * release (e.g. not enough sales history) — a 404 here is an expected
 * outcome, not a failure; other errors (bad token, network) still throw.
 */
export declare function fetchPriceSuggestions(releaseId: number): Promise<PriceSuggestions | null>;
