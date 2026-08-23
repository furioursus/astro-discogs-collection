import type { DiscogsRelease } from './types.js';
export interface CollectionSummary {
    totalRecords: number;
    uniqueArtists: number;
    genres: string[];
    styles: string[];
    /** Sum of `averagePrice` across releases that have one. 0 if `includePrices` wasn't used. */
    totalEstimatedValue: number;
    /** How many releases contributed to `totalEstimatedValue` — i.e. had price data at all. */
    knownPriceCount: number;
}
export declare function summarize(releases: DiscogsRelease[]): CollectionSummary;
/** Deduplicates and alphabetizes a list of strings — handy for building filter dropdowns. */
export declare function uniqueSorted(values: Iterable<string>): string[];
