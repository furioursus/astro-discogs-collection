import { getConfig } from './config.js';
// Build-time only (imported from .astro frontmatter or the integration's
// own hooks, both of which run in Node — never shipped to the browser).
// Talks to the Discogs API v2: https://www.discogs.com/developers
const API_ROOT = 'https://api.discogs.com';
const PER_PAGE = 100; // Discogs's max
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Fetches a single Discogs API page, backing off whenever the response
 * says we're close to the per-minute cap rather than trying to race it.
 * Discogs allows 60 req/min authenticated, tracked as a sliding 60s window.
 */
async function discogsFetch(url) {
    const { token, userAgent } = getConfig();
    const response = await fetch(url, {
        headers: {
            Authorization: `Discogs token=${token}`,
            'User-Agent': userAgent,
        },
    });
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Discogs API error (${response.status}): ${response.statusText}${body ? `\n${body}` : ''} — ${url}`);
    }
    const remaining = Number(response.headers.get('X-Discogs-Ratelimit-Remaining'));
    if (Number.isFinite(remaining) && remaining <= 2) {
        await sleep(2000);
    }
    return (await response.json());
}
async function paginate(buildUrl, extractItems) {
    const items = [];
    let page = 1;
    let totalPages = 1;
    do {
        const response = await discogsFetch(buildUrl(page));
        items.push(...extractItems(response));
        totalPages = response.pagination.pages;
        page += 1;
    } while (page <= totalPages);
    return items;
}
/** Strips Discogs's "(2)"-style disambiguation suffix from an artist name. */
function cleanArtistName(name) {
    return name.replace(/\s\(\d+\)$/, '');
}
function normalizeBasicInformation(info) {
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
function normalizeCollectionRelease(raw) {
    return {
        id: raw.id,
        ...normalizeBasicInformation(raw.basic_information),
        dateAdded: raw.date_added,
        rating: raw.rating,
        notes: null,
        source: 'collection',
        priceSuggestions: null,
        averagePrice: null,
    };
}
function normalizeWantlistRelease(raw) {
    return {
        id: raw.id,
        ...normalizeBasicInformation(raw.basic_information),
        dateAdded: null,
        rating: raw.rating,
        notes: raw.notes ?? null,
        source: 'wantlist',
        priceSuggestions: null,
        averagePrice: null,
    };
}
/**
 * Fetches every release in a user's collection folder (default: folder 0,
 * Discogs's built-in "All" folder), normalized to `DiscogsRelease`.
 */
export async function fetchCollection(username, folderId) {
    const raw = await paginate((page) => `${API_ROOT}/users/${encodeURIComponent(username)}/collection/folders/${folderId}/releases` +
        `?page=${page}&per_page=${PER_PAGE}&sort=artist&sort_order=asc`, (response) => response.releases);
    return raw.map(normalizeCollectionRelease);
}
/** Fetches every release on a user's wantlist, normalized to `DiscogsRelease`. */
export async function fetchWantlist(username) {
    const raw = await paginate((page) => `${API_ROOT}/users/${encodeURIComponent(username)}/wants?page=${page}&per_page=${PER_PAGE}`, (response) => response.wants);
    return raw.map(normalizeWantlistRelease);
}
/**
 * Fetches Discogs's suggested price per condition grade for one release.
 * There's no bulk version of this endpoint — it's one request per release,
 * which is why `includePrices` is opt-in and cached separately (see
 * collection-data.ts). Returns null if Discogs has no suggestions for this
 * release (e.g. not enough sales history) — a 404 here is an expected
 * outcome, not a failure; other errors (bad token, network) still throw.
 */
export async function fetchPriceSuggestions(releaseId) {
    const { token, userAgent } = getConfig();
    const url = `${API_ROOT}/marketplace/price_suggestions/${releaseId}`;
    const response = await fetch(url, {
        headers: { Authorization: `Discogs token=${token}`, 'User-Agent': userAgent },
    });
    if (response.status === 404)
        return null;
    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Discogs API error (${response.status}): ${response.statusText}${body ? `\n${body}` : ''} — ${url}`);
    }
    const remaining = Number(response.headers.get('X-Discogs-Ratelimit-Remaining'));
    if (Number.isFinite(remaining) && remaining <= 2) {
        await sleep(2000);
    }
    const suggestions = (await response.json());
    return Object.keys(suggestions).length > 0 ? suggestions : null;
}
