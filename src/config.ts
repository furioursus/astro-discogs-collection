import path from 'node:path';

export interface DiscogsCollectionOptions {
  /** Discogs username whose collection/wantlist to read. Default: `process.env.DISCOGS_USERNAME`. */
  username?: string;
  /**
   * A Discogs personal access token — generate one at
   * discogs.com/settings/developers. Enough to read your own
   * collection/wantlist; no OAuth app registration needed.
   * Default: `process.env.DISCOGS_TOKEN`.
   */
  token?: string;
  /** Sent as the User-Agent header on every request, as Discogs's API terms require. Default: `process.env.DISCOGS_USER_AGENT`, falling back to a generic string. */
  userAgent?: string;
  /** Collection folder to read. `0` is Discogs's built-in "All" folder, covering every custom folder. Default: 0. */
  folderId?: number;
  /** Directory to cache downloaded cover images in, relative to the consuming project's root. Default: 'src/assets/discogs-collection/cover-images'. */
  imageCacheDir?: string;
  /** Path to the Discogs API response cache file, relative to the project root. Default: '.cache/discogs-collection/cache.json'. */
  cachePath?: string;
  /** How long cached API responses stay valid, in hours. Default: 6. */
  cacheTtlHours?: number;
  /**
   * Fetch Discogs's price suggestions for every release, populating
   * `priceSuggestions`/`averagePrice`. Default: false. This costs one extra
   * API request per release (there's no bulk endpoint for it), so it's
   * opt-in — for a large collection this can take a while and eat into the
   * rate limit even with caching. Off by default.
   */
  includePrices?: boolean;
  /** How long cached price suggestions stay valid, in hours. Kept separate from `cacheTtlHours` since prices are worth caching longer — they change less often and cost more to re-fetch. Default: 24. */
  priceCacheTtlHours?: number;
}

export interface ResolvedConfig {
  root: string;
  username: string;
  token: string;
  userAgent: string;
  folderId: number;
  imageCacheDir: string;
  cachePath: string;
  cacheTtlHours: number;
  includePrices: boolean;
  priceCacheTtlHours: number;
  /**
   * True when neither options nor the environment supplied a username/token.
   * loadCollection()/loadWantlist() report this instead of throwing, so a
   * site still builds (rendering a setup message, say) before secrets are
   * configured.
   */
  missingConfig: boolean;
}

const DEFAULT_USER_AGENT = 'astro-discogs-collection (build script)';

const DEFAULTS = {
  folderId: 0,
  imageCacheDir: 'src/assets/discogs-collection/cover-images',
  cachePath: '.cache/discogs-collection/cache.json',
  cacheTtlHours: 6,
  includePrices: false,
  priceCacheTtlHours: 24,
};

function resolve(root: string, options: DiscogsCollectionOptions): ResolvedConfig {
  const username = options.username ?? process.env.DISCOGS_USERNAME ?? '';
  const token = options.token ?? process.env.DISCOGS_TOKEN ?? '';

  return {
    root,
    username,
    token,
    userAgent: options.userAgent ?? process.env.DISCOGS_USER_AGENT ?? DEFAULT_USER_AGENT,
    folderId: options.folderId ?? DEFAULTS.folderId,
    imageCacheDir: path.resolve(root, options.imageCacheDir ?? DEFAULTS.imageCacheDir),
    cachePath: path.resolve(root, options.cachePath ?? DEFAULTS.cachePath),
    cacheTtlHours: options.cacheTtlHours ?? DEFAULTS.cacheTtlHours,
    includePrices: options.includePrices ?? DEFAULTS.includePrices,
    priceCacheTtlHours: options.priceCacheTtlHours ?? DEFAULTS.priceCacheTtlHours,
    missingConfig: !username || !token,
  };
}

let current: ResolvedConfig | null = null;

/**
 * Called by the Astro integration during astro:config:setup with the
 * project root and the user's integration options, resolving everything
 * once for the rest of the package to read.
 */
export function configure(root: string, options: DiscogsCollectionOptions = {}): ResolvedConfig {
  current = resolve(root, options);
  return current;
}

/**
 * Resolved config, falling back to defaults against process.cwd() if the
 * integration hasn't run yet (or isn't used at all — e.g. calling
 * loadCollection() directly from a plain Node script).
 */
export function getConfig(): ResolvedConfig {
  if (!current) {
    current = resolve(process.cwd(), {});
  }
  return current;
}
