import type { DiscogsRelease } from './types.js';
/**
 * Filter conditions for queryCollection(). Every field is optional and
 * conditions combine with AND — pass as many or as few as you need.
 * `artist`/`title` are case-insensitive substring matches; `genre`/`style`/
 * `format` accept a single value or an array of allowed values, matching if
 * the release has ANY of them.
 */
export interface DiscogsWhere {
    artist?: string;
    title?: string;
    genre?: string | string[];
    style?: string | string[];
    format?: string | string[];
    minYear?: number;
    maxYear?: number;
    minRating?: number;
}
export type SortField = 'artist' | 'title' | 'year' | 'dateAdded' | 'rating';
export type SortOrder = 'asc' | 'desc';
export interface QueryOptions {
    where?: DiscogsWhere;
    sortBy?: SortField;
    order?: SortOrder;
    limit?: number;
}
/**
 * Filters, sorts, and limits a list of releases in one call — usable
 * directly on the result of `loadCollection()`/`loadWantlist()` from a
 * page's frontmatter.
 */
export declare function queryCollection(releases: DiscogsRelease[], options?: QueryOptions): DiscogsRelease[];
