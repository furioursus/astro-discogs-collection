import type { DiscogsRelease } from './types.js';
export interface LoadedCollection {
    releases: DiscogsRelease[];
    /** Set when username/token aren't configured — the page can render a setup message instead of failing the build. */
    missingConfig: boolean;
    /** Set when the Discogs request itself failed (bad token, network error, etc.). */
    error: string | null;
}
/**
 * Loads the user's collection once per build, no matter how many pages or
 * components ask for it — later callers just await the same in-flight/
 * resolved promise instead of re-hitting Discogs.
 */
export declare function loadCollection(): Promise<LoadedCollection>;
/** Same idea as `loadCollection()`, for the wantlist. */
export declare function loadWantlist(): Promise<LoadedCollection>;
