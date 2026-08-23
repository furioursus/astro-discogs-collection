# astro-discogs-crate

An Astro site that renders your [Discogs](https://www.discogs.com) record
collection (and wantlist) as a static, zero-JS-by-default site. Data is
pulled from the Discogs API **at build time** — the deployed site is plain
static HTML, and your API token never reaches the browser.

## How it works

- `src/lib/discogs.ts` — a small Discogs API v2 client. Paginates through
  `/users/{username}/collection/folders/0/releases` and `/users/{username}/wants`,
  authenticating with a personal access token, and backing off automatically
  as it approaches Discogs's rate limit.
- `src/pages/index.astro` — the collection page. Calls the client once in
  its frontmatter (server-only, build-time) and renders the result as
  static markup.
- `src/pages/wantlist.astro` — same idea, for your wantlist.
- `src/components/CrateFilter.astro` — a tiny vanilla-JS search box
  (progressive enhancement only — no framework needed for this).

Because the fetch happens at build time, the site itself never calls
Discogs at request time, so there's no per-visitor rate-limit risk and no
token to protect at runtime. The tradeoff is that the site needs a rebuild
to reflect new additions — see **Keeping it fresh** below.

## Setup

1. Generate a Discogs personal access token: **discogs.com → Settings →
   Developers → Generate new token**. This is enough to read your own
   collection/wantlist — no OAuth app registration required.
2. Copy `.env.example` to `.env` and fill in `DISCOGS_USERNAME` and
   `DISCOGS_TOKEN`.
3. Install dependencies and run the dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Build for production:

   ```bash
   npm run build
   npm run preview
   ```

## Deploying

`.github/workflows/deploy.yml` builds the site and deploys it to **GitHub
Pages** on every push to `main`, plus a daily scheduled rebuild (`06:17
UTC`, adjust the cron as you like) so the site picks up new records
without a code change.

To use it:

1. In the repo's **Settings → Pages**, set the source to "GitHub Actions".
2. In **Settings → Secrets and variables → Actions**, add repo secrets:
   - `DISCOGS_USERNAME`
   - `DISCOGS_TOKEN`
   - Optionally a repo **variable** `DISCOGS_USER_AGENT` (a descriptive
     string like `YourSite/1.0 +https://your-domain.example`).
3. Update `site` (and add `base` if this isn't served from a custom
   domain) in `astro.config.mjs` to match where the site will actually
   live — e.g. `https://<user>.github.io/astro-discogs-crate` needs
   `base: '/astro-discogs-crate'`.

Prefer Netlify/Vercel/Cloudflare Pages instead? Skip the GitHub Actions
workflow and just set the same environment variables in that platform's
build settings, with `npm run build` as the build command and `dist` as
the output directory — no code changes needed.

## Notes on the Discogs API

- Rate limit: 60 requests/min authenticated, tracked as a sliding 60s
  window. The client here pauses briefly when the remaining budget gets
  low, which is only likely to matter for very large collections.
- Every request is required to send a descriptive `User-Agent` header —
  set via `DISCOGS_USER_AGENT`.
- Folder `0` in the collection endpoint is Discogs's built-in "All"
  folder; pass a different folder ID to `fetchCollection()` to scope to a
  custom folder instead.
