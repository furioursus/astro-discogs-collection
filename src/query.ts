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

function matchesAny(values: string[], filter: string | string[] | undefined): boolean {
  if (filter === undefined) return true;
  const allowed = Array.isArray(filter) ? filter : [filter];
  const lowerValues = values.map((v) => v.toLowerCase());
  return allowed.some((f) => lowerValues.includes(f.toLowerCase()));
}

function matchesWhere(release: DiscogsRelease, where: DiscogsWhere): boolean {
  if (where.artist && !release.artist.toLowerCase().includes(where.artist.toLowerCase())) return false;
  if (where.title && !release.title.toLowerCase().includes(where.title.toLowerCase())) return false;
  if (!matchesAny(release.genres, where.genre)) return false;
  if (!matchesAny(release.styles, where.style)) return false;
  if (!matchesAny(release.formats, where.format)) return false;
  if (where.minYear !== undefined && release.year < where.minYear) return false;
  if (where.maxYear !== undefined && release.year > where.maxYear) return false;
  if (where.minRating !== undefined && release.rating < where.minRating) return false;
  return true;
}

function compareBy(a: DiscogsRelease, b: DiscogsRelease, field: SortField): number {
  switch (field) {
    case 'artist':
      return a.artist.localeCompare(b.artist);
    case 'title':
      return a.title.localeCompare(b.title);
    case 'year':
      return a.year - b.year;
    case 'dateAdded':
      return (a.dateAdded ?? '').localeCompare(b.dateAdded ?? '');
    case 'rating':
      return a.rating - b.rating;
  }
}

/**
 * Filters, sorts, and limits a list of releases in one call — usable
 * directly on the result of `loadCollection()`/`loadWantlist()` from a
 * page's frontmatter.
 */
export function queryCollection(releases: DiscogsRelease[], options: QueryOptions = {}): DiscogsRelease[] {
  const { where, sortBy, order = 'asc', limit } = options;

  let results = where ? releases.filter((r) => matchesWhere(r, where)) : releases.slice();

  if (sortBy) {
    results.sort((a, b) => compareBy(a, b, sortBy));
    if (order === 'desc') results.reverse();
  }

  if (limit !== undefined) {
    results = results.slice(0, limit);
  }

  return results;
}
