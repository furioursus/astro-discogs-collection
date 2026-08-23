/**
 * Minimal Discogs API v2 client, built for build-time use in Astro.
 *
 * Docs: https://www.discogs.com/developers
 *
 * Auth uses a Personal Access Token (Settings → Developers on discogs.com),
 * which is enough to read your OWN collection/wantlist. No OAuth dance
 * required.
 *
 * This is deliberately NOT called from the browser: it reads DISCOGS_TOKEN
 * from the server-side environment, and running it at build time keeps the
 * token out of any client-shipped code.
 */

const API_ROOT = 'https://api.discogs.com';

export interface DiscogsImage {
  type: 'primary' | 'secondary';
  uri: string;
  resource_url: string;
  uri150: string;
  width: number;
  height: number;
}

export interface DiscogsBasicInformation {
  id: number;
  title: string;
  year: number;
  resource_url: string;
  cover_image: string;
  thumb: string;
  formats: { name: string; qty: string; descriptions?: string[] }[];
  artists: { name: string; id: number }[];
  labels: { name: string; catno: string; id: number }[];
  genres: string[];
  styles: string[];
}

export interface DiscogsCollectionRelease {
  id: number;
  instance_id: number;
  folder_id: number;
  rating: number;
  date_added: string;
  basic_information: DiscogsBasicInformation;
}

export interface DiscogsWantlistRelease {
  id: number;
  resource_url: string;
  rating: number;
  notes?: string;
  basic_information: DiscogsBasicInformation;
}

interface DiscogsPage {
  pagination: {
    page: number;
    pages: number;
    per_page: number;
    items: number;
  };
}

type CollectionResponse = DiscogsPage & {
  releases: DiscogsCollectionRelease[];
};

type WantlistResponse = DiscogsPage & {
  wants: DiscogsWantlistRelease[];
};

export interface DiscogsClientOptions {
  username: string;
  token: string;
  userAgent?: string;
  /** Max releases per page (Discogs allows up to 100). */
  perPage?: number;
}

function assertConfigured(options: DiscogsClientOptions) {
  if (!options.username || !options.token) {
    throw new Error(
      'Discogs client is missing credentials. Set DISCOGS_USERNAME and ' +
        'DISCOGS_TOKEN (see .env.example) before building the site.'
    );
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a single Discogs API page, respecting the server's rate-limit
 * headers by backing off when we're close to the per-minute cap.
 *
 * Discogs allows 60 req/min authenticated, tracked as a sliding 60s window.
 * We stay well under that by waiting whenever the remaining budget gets low
 * rather than trying to race it.
 */
async function discogsFetch<T>(url: string, options: DiscogsClientOptions): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${options.token}`,
      'User-Agent': options.userAgent ?? 'AstroDiscogsCrate/0.1',
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Discogs API request failed: ${response.status} ${response.statusText} ` +
        `for ${url}${body ? `\n${body}` : ''}`
    );
  }

  const remaining = Number(response.headers.get('X-Discogs-Ratelimit-Remaining'));
  if (Number.isFinite(remaining) && remaining <= 2) {
    // Close to the per-minute cap — pause so the next request doesn't 429.
    await sleep(2000);
  }

  return (await response.json()) as T;
}

async function paginate<Item, ResponseShape extends DiscogsPage>(
  buildUrl: (page: number, perPage: number) => string,
  extractItems: (response: ResponseShape) => Item[],
  options: DiscogsClientOptions
): Promise<Item[]> {
  const perPage = options.perPage ?? 100;
  const items: Item[] = [];

  let page = 1;
  let totalPages = 1;

  do {
    const response = await discogsFetch<ResponseShape>(buildUrl(page, perPage), options);
    items.push(...extractItems(response));
    totalPages = response.pagination.pages;
    page += 1;
  } while (page <= totalPages);

  return items;
}

/**
 * Fetches every release in a user's collection.
 *
 * `folderId` defaults to `0`, Discogs's built-in "All" folder, which covers
 * every custom folder the user has. Pass a specific folder id to scope to
 * just that folder instead.
 */
export async function fetchCollection(
  options: DiscogsClientOptions,
  folderId = 0
): Promise<DiscogsCollectionRelease[]> {
  assertConfigured(options);

  return paginate<DiscogsCollectionRelease, CollectionResponse>(
    (page, perPage) =>
      `${API_ROOT}/users/${encodeURIComponent(options.username)}/collection/folders/${folderId}/releases` +
      `?page=${page}&per_page=${perPage}&sort=artist&sort_order=asc`,
    (response) => response.releases,
    options
  );
}

/** Fetches every release on a user's wantlist. */
export async function fetchWantlist(options: DiscogsClientOptions): Promise<DiscogsWantlistRelease[]> {
  assertConfigured(options);

  return paginate<DiscogsWantlistRelease, WantlistResponse>(
    (page, perPage) =>
      `${API_ROOT}/users/${encodeURIComponent(options.username)}/wants?page=${page}&per_page=${perPage}`,
    (response) => response.wants,
    options
  );
}

/** Builds client options from environment variables, throwing a clear error if unset. */
export function discogsOptionsFromEnv(): DiscogsClientOptions {
  return {
    username: import.meta.env.DISCOGS_USERNAME,
    token: import.meta.env.DISCOGS_TOKEN,
    userAgent: import.meta.env.DISCOGS_USER_AGENT,
  };
}

/** Convenience formatter: "Artist One, Artist Two" from a release's artist list. */
export function formatArtists(release: { basic_information: DiscogsBasicInformation }): string {
  return release.basic_information.artists.map((artist) => artist.name.replace(/\s\(\d+\)$/, '')).join(', ');
}

/** Convenience formatter: "Vinyl, LP, Album" from a release's format list. */
export function formatFormats(release: { basic_information: DiscogsBasicInformation }): string {
  return release.basic_information.formats
    .map((format) => [format.name, ...(format.descriptions ?? [])].join(', '))
    .join(' / ');
}
