import type { DiscogsRelease } from './types.js';

export interface CollectionSummary {
  totalRecords: number;
  uniqueArtists: number;
  genres: string[];
  styles: string[];
}

export function summarize(releases: DiscogsRelease[]): CollectionSummary {
  const artists = new Set<string>();
  const genres = new Set<string>();
  const styles = new Set<string>();

  for (const release of releases) {
    for (const artist of release.artists) artists.add(artist);
    for (const genre of release.genres) genres.add(genre);
    for (const style of release.styles) styles.add(style);
  }

  return {
    totalRecords: releases.length,
    uniqueArtists: artists.size,
    genres: uniqueSorted(genres),
    styles: uniqueSorted(styles),
  };
}

/** Deduplicates and alphabetizes a list of strings — handy for building filter dropdowns. */
export function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}
