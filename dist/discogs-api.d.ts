import type { DiscogsRelease } from './types.js';
/**
 * Fetches every release in a user's collection folder (default: folder 0,
 * Discogs's built-in "All" folder), normalized to `DiscogsRelease`.
 */
export declare function fetchCollection(username: string, folderId: number): Promise<DiscogsRelease[]>;
/** Fetches every release on a user's wantlist, normalized to `DiscogsRelease`. */
export declare function fetchWantlist(username: string): Promise<DiscogsRelease[]>;
