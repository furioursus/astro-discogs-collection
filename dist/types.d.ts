/** Which Discogs list a release came from. */
export type DiscogsSource = 'collection' | 'wantlist';
/** A single condition grade's suggested price, from Discogs's marketplace price_suggestions endpoint. */
export interface PriceSuggestion {
    currency: string;
    value: number;
}
/** Keyed by condition grade, e.g. "Mint (M)", "Near Mint (NM or M-)", "Very Good Plus (VG+)". */
export type PriceSuggestions = Record<string, PriceSuggestion>;
/**
 * A release, normalized to the same flat shape whether it came from the
 * user's collection or wantlist — so query/collection code (and your own
 * rendering) doesn't need to branch on source for the common fields.
 */
export interface DiscogsRelease {
    id: number;
    title: string;
    /** Display string, e.g. "Miles Davis, John Coltrane". Discogs's "(2)"-style disambiguation suffixes are stripped. */
    artist: string;
    /** Individual artist names, same cleanup as `artist`. */
    artists: string[];
    year: number;
    /** Full-size cover art URL from Discogs, or null if the release has none. */
    coverImageUrl: string | null;
    /** Small thumbnail URL, or null. */
    thumbUrl: string | null;
    /** e.g. ["Vinyl", "LP", "Album"] — format name plus its descriptions, flattened. */
    formats: string[];
    labels: string[];
    genres: string[];
    styles: string[];
    /** Link to this release's page on discogs.com. */
    releaseUrl: string;
    /** ISO date the record was added to the collection. Null for wantlist entries. */
    dateAdded: string | null;
    /** 0-5 personal rating, if set. */
    rating: number;
    /** Personal note text. Only ever set on wantlist entries. */
    notes: string | null;
    source: DiscogsSource;
    /**
     * Discogs's suggested price per condition grade, if fetched — only
     * populated when the integration's `includePrices` option is on; null
     * otherwise (or if Discogs has no suggestions for this release, e.g. not
     * enough sales history).
     */
    priceSuggestions: PriceSuggestions | null;
    /** Mean of `priceSuggestions`' per-condition values, or null if price data wasn't fetched/available. Discogs doesn't expose a single "average sale price" itself — this just averages across whatever condition grades it did return. */
    averagePrice: number | null;
}
