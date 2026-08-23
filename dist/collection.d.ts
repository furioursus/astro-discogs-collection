import type { DiscogsRelease } from './types.js';
export interface CollectionSummary {
    totalRecords: number;
    uniqueArtists: number;
    genres: string[];
    styles: string[];
}
export declare function summarize(releases: DiscogsRelease[]): CollectionSummary;
/** Deduplicates and alphabetizes a list of strings — handy for building filter dropdowns. */
export declare function uniqueSorted(values: Iterable<string>): string[];
