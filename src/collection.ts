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

export function summarize(releases: DiscogsRelease[]): CollectionSummary {
  const artists = new Set<string>();
  const genres = new Set<string>();
  const styles = new Set<string>();
  let totalEstimatedValue = 0;
  let knownPriceCount = 0;

  for (const release of releases) {
    for (const artist of release.artists) artists.add(artist);
    for (const genre of release.genres) genres.add(genre);
    for (const style of release.styles) styles.add(style);
    if (release.averagePrice !== null) {
      totalEstimatedValue += release.averagePrice;
      knownPriceCount += 1;
    }
  }

  return {
    totalRecords: releases.length,
    uniqueArtists: artists.size,
    genres: uniqueSorted(genres),
    styles: uniqueSorted(styles),
    totalEstimatedValue,
    knownPriceCount,
  };
}

/** Deduplicates and alphabetizes a list of strings — handy for building filter dropdowns. */
export function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}
