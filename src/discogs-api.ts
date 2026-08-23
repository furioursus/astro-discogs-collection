import { getConfig } from './config.js';
import type { DiscogsRelease, DiscogsSource } from './types.js';

// Build-time only (imported from .astro frontmatter or the integration's
// own hooks, both of which run in Node — never shipped to the browser).
// Talks to the Discogs API v2: https://www.discogs.com/developers

const API_ROOT = 'https://api.discogs.com';
const PER_PAGE = 100; // Discogs's max

interface RawImage {
  type: 'primary' | 'secondary';
  uri: string;
  uri150: string;
}

interface RawBasicInformation {
  id: number;
  title: string;
  year: number;
  cover_image: string;
  thumb: string;
  formats: { name: string; qty: string; descriptions?: string[] }[];
  artists: { name: string }[];
  labels: { name: string }[];
  genres: string[];
  styles: string[];
  images?: RawImage[];
}

interface RawCollectionRelease {
  id: number;
  date_added: string;
  rating: number;
  basic_information: RawBasicInformation;
}

interface RawWantlistRelease {
  id: number;
  rating: number;
  notes?: string;
  basic_information: RawBasicInformation;
}

interface RawPage {
  pagination: { page: number; pages: number };
}

type RawCollectionResponse = RawPage & { releases: RawCollectionRelease[] };
type RawWantlistResponse = RawPage & { wants: RawWantlistRelease[] };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches a single Discogs API page, backing off whenever the response
 * says we're close to the per-minute cap rather than trying to race it.
 * Discogs allows 60 req/min authenticated, tracked as a sliding 60s window.
 */
async function discogsFetch<T>(url: string): Promise<T> {
  const { token, userAgent } = getConfig();

  const response = await fetch(url, {
    headers: {
      Authorization: `Discogs token=${token}`,
      'User-Agent': userAgent,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Discogs API error (${response.status}): ${response.statusText}${body ? `\n${body}` : ''} — ${url}`
    );
  }

  const remaining = Number(response.headers.get('X-Discogs-Ratelimit-Remaining'));
  if (Number.isFinite(remaining) && remaining <= 2) {
    await sleep(2000);
  }

  return (await response.json()) as T;
}

async function paginate<Item, Response extends RawPage>(
  buildUrl: (page: number) => string,
  extractItems: (response: Response) => Item[]
): Promise<Item[]> {
  const items: Item[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await discogsFetch<Response>(buildUrl(page));
    items.push(...extractItems(response));
    totalPages = response.pagination.pages;
    page += 1;
  } while (page <= totalPages);

  return items;
}

/** Strips Discogs's "(2)"-style disambiguation suffix from an artist name. */
function cleanArtistName(name: string): string {
  return name.replace(/\s\(\d+\)$/, '');
}

function normalizeBasicInformation(info: RawBasicInformation) {
  const artists = info.artists.map((a) => cleanArtistName(a.name));
  return {
    title: info.title,
    artist: artists.join(', '),
    artists,
    year: info.year,
    coverImageUrl: info.cover_image || null,
    thumbUrl: info.thumb || null,
    formats: info.formats.flatMap((f) => [f.name, ...(f.descriptions ?? [])]),
    labels: info.labels.map((l) => l.name),
    genres: info.genres,
    styles: info.styles,
    releaseUrl: `https://www.discogs.com/release/${info.id}`,
  };
}

function normalizeCollectionRelease(raw: RawCollectionRelease): DiscogsRelease {
  return {
    id: raw.id,
    ...normalizeBasicInformation(raw.basic_information),
    dateAdded: raw.date_added,
    rating: raw.rating,
    notes: null,
    source: 'collection' as DiscogsSource,
  };
}

function normalizeWantlistRelease(raw: RawWantlistRelease): DiscogsRelease {
  return {
    id: raw.id,
    ...normalizeBasicInformation(raw.basic_information),
    dateAdded: null,
    rating: raw.rating,
    notes: raw.notes ?? null,
    source: 'wantlist' as DiscogsSource,
  };
}

/**
 * Fetches every release in a user's collection folder (default: folder 0,
 * Discogs's built-in "All" folder), normalized to `DiscogsRelease`.
 */
export async function fetchCollection(username: string, folderId: number): Promise<DiscogsRelease[]> {
  const raw = await paginate<RawCollectionRelease, RawCollectionResponse>(
    (page) =>
      `${API_ROOT}/users/${encodeURIComponent(username)}/collection/folders/${folderId}/releases` +
      `?page=${page}&per_page=${PER_PAGE}&sort=artist&sort_order=asc`,
    (response) => response.releases
  );
  return raw.map(normalizeCollectionRelease);
}

/** Fetches every release on a user's wantlist, normalized to `DiscogsRelease`. */
export async function fetchWantlist(username: string): Promise<DiscogsRelease[]> {
  const raw = await paginate<RawWantlistRelease, RawWantlistResponse>(
    (page) => `${API_ROOT}/users/${encodeURIComponent(username)}/wants?page=${page}&per_page=${PER_PAGE}`,
    (response) => response.wants
  );
  return raw.map(normalizeWantlistRelease);
}
