# astro-discogs-collection

An Astro integration for browsing a [Discogs](https://www.discogs.com)
record collection/wantlist, fetched from the
[Discogs API](https://www.discogs.com/developers) at build/dev time and
enriched with locally cached cover art.

It handles the data side — authenticating, paginating, fetching your
collection and wantlist, caching responses so repeated builds don't re-hit
the API, and caching cover images locally so they're usable with Astro's
`<Image>`/`<Picture>`. Rendering is up to you: this package has no UI
components, so you build cards/grids/pages however fits your existing
site.

## Install

Not published to npm — install directly from GitHub:

```bash
npm install github:furioursus/astro-discogs-collection
```

## Setup

1. Generate a Discogs personal access token: **discogs.com → Settings →
   Developers → Generate new token**. This is enough to read your own
   collection/wantlist — no OAuth app registration required.
2. Set `DISCOGS_USERNAME` and `DISCOGS_TOKEN` as environment variables for
   your site (a `.env` file for local dev; your host's secrets/env config
   for deploys) — or pass them directly as integration options instead.
3. Register the integration:

   ```js
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   import discogsCollection from 'astro-discogs-collection';

   export default defineConfig({
     integrations: [discogsCollection()],
   });
   ```

The integration fetches your collection/wantlist and caches cover art
automatically before every `astro build` and at the start of `astro dev` —
no separate script to run. Not configured yet? The site still builds;
`loadCollection()`/`loadWantlist()` just report `missingConfig: true` so
you can render a setup message instead of failing.

### Options

```js
discogsCollection({
  username: undefined, // defaults to process.env.DISCOGS_USERNAME
  token: undefined, // defaults to process.env.DISCOGS_TOKEN
  userAgent: undefined, // defaults to process.env.DISCOGS_USER_AGENT, then a generic string
  folderId: 0, // Discogs's built-in "All" folder; pass a custom folder ID to scope to just that folder
  imageCacheDir: 'src/assets/discogs-collection/cover-images', // must stay under src/ for astro:assets to optimize it
  cachePath: '.cache/discogs-collection/cache.json',
  cacheTtlHours: 6, // how long a cached API response stays valid before the next build re-fetches
  includePrices: false, // fetch Discogs's price suggestions per release — see Pricing below
  priceCacheTtlHours: 24, // how long cached price suggestions stay valid
});
```

All are optional. `imageCacheDir` and `cachePath` are derived caches,
regenerable from Discogs — gitignore them in your site.

### Rate limits

Discogs allows 60 requests/min authenticated, tracked as a sliding 60s
window. The client here pauses briefly whenever the response says the
remaining budget is low, which only matters for very large collections —
combined with the response cache (`cacheTtlHours`), a typical local dev
loop touches the API once per TTL window, not once per rebuild.

### Pricing

Discogs doesn't return price data with the collection/wantlist itself, and
has no bulk pricing endpoint — the only way to get a price is one
`marketplace/price_suggestions` request per release. So it's opt-in via
`includePrices: true`, and cached separately from (and longer than) the
rest of the response cache via `priceCacheTtlHours`, since it's the more
expensive part to re-fetch.

When enabled, each `DiscogsRelease` gets:

- `priceSuggestions` — Discogs's suggested price per condition grade (e.g.
  `"Mint (M)"`, `"Very Good Plus (VG+)"`), or `null` if Discogs has no
  suggestion for that release (not enough sales history) or the request
  failed.
- `averagePrice` — the mean of `priceSuggestions`' values, or `null`. This
  is **not** an average *sold* price — Discogs doesn't expose sale history
  through the API — just a convenience average across whatever condition
  grades it did suggest a price for.

For a large collection, the first build/dev run with `includePrices: true`
takes noticeably longer (one request per release, rate-limited the same
way as everything else) — subsequent runs are fast again until
`priceCacheTtlHours` expires.

## Using the data

```astro
---
import { loadCollection, queryCollection } from 'astro-discogs-collection';

const { releases, missingConfig, error } = await loadCollection();

const psychRock = queryCollection(releases, {
  where: { style: 'Psychedelic Rock' },
  sortBy: 'artist',
});

const recentlyAdded = queryCollection(releases, {
  sortBy: 'dateAdded',
  order: 'desc',
  limit: 12,
});
---
```

`loadCollection()`/`loadWantlist()` are memoized per build/dev-session —
call them from as many pages/components as you like; Discogs is only
fetched once per TTL window.

### `queryCollection(releases, options)`

- `where` — combined with AND logic. Fields: `artist`/`title` (substring
  match), `genre`/`style`/`format` (a single value or array of allowed
  values — matches if the release has any of them), `minYear`/`maxYear`,
  `minRating`, `minPrice`/`maxPrice` (against `averagePrice` — see
  Pricing; a release with no price data is excluded by either bound).
- `sortBy` — `'artist' | 'title' | 'year' | 'dateAdded' | 'rating' | 'price'`.
- `order` — `'asc' | 'desc'` (default `'asc'`).
- `limit` — cap the result count.

Other exports: `summarize(releases)` (total records, unique artists, all
genres/styles present, plus `totalEstimatedValue`/`knownPriceCount` when
prices were fetched), `uniqueSorted(values)` (for building filter
dropdowns), and the `DiscogsRelease`/`DiscogsWhere` types.

Every release, whether from the collection or the wantlist, is normalized
to the same flat `DiscogsRelease` shape — `artist`, `title`, `year`,
`genres`, `styles`, `formats`, `coverImageUrl`, etc. — so the same
query/rendering code works on either list. `dateAdded` is only ever set on
collection entries; `notes` only ever set on wantlist entries.

## Using cached images with `<Image>`/`<Picture>`

Cover art is downloaded locally (see Options above) specifically so
Astro's asset pipeline can optimize it — `<Image>`/`<Picture>` only
process local/imported images, not arbitrary remote URLs.

`getLocalCoverImage` lives under a separate `astro-discogs-collection/images`
subpath, not the main package export — it transitively resolves a Vite
virtual module, which only works from `.astro`/component code (processed
by Vite), not from `astro.config.mjs` (loaded directly by Node).

```astro
---
import { Image } from 'astro:assets';
import { getLocalCoverImage } from 'astro-discogs-collection/images';

const localImage = release ? getLocalCoverImage(release.id) : undefined;
---

{localImage
  ? <Image src={localImage} alt={release.title} width={300} />
  : release.coverImageUrl
    ? <img src={release.coverImageUrl} alt={release.title} loading="lazy" />
    : <div>{release.title}</div>}
```

Falling back to the remote URL when a release isn't cached yet keeps this
safe to adopt incrementally.

For TypeScript to know about the underlying
`virtual:discogs-collection/images` module (only needed if you use it
directly instead of through `getLocalCoverImage`), add this to your
`src/env.d.ts`:

```ts
/// <reference types="astro-discogs-collection/client" />
```

## How it fits together

- `loadCollection()` / `loadWantlist()` / `queryCollection()` /
  `summarize()` / `uniqueSorted()` are plain functions — no Astro-specific
  machinery, safe to call from any page or component's frontmatter.
- The integration's job is timing and Vite wiring: it downloads cover
  images during `astro:build:start` / `astro:server:setup` (before Vite
  processes any page, so images exist by the time components ask for
  them), and registers a Vite plugin that exposes cached images as real
  ESM imports (`virtual:discogs-collection/images`) so `astro:assets` can
  optimize them — this works even though the images are cached at a
  location only known at runtime, which a static `import.meta.glob()`
  pattern can't express.

## Development

```bash
npm install   # installs deps
npm run build # tsc -> dist/, plus copying client.d.ts
```

`dist/` is committed to the repo (not gitignored) since this package is
installed straight from GitHub, not built on install — run `npm run build`
and commit the result after any change under `src/`.
