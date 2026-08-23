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
    /**
     * True when neither options nor the environment supplied a username/token.
     * loadCollection()/loadWantlist() report this instead of throwing, so a
     * site still builds (rendering a setup message, say) before secrets are
     * configured.
     */
    missingConfig: boolean;
}
/**
 * Called by the Astro integration during astro:config:setup with the
 * project root and the user's integration options, resolving everything
 * once for the rest of the package to read.
 */
export declare function configure(root: string, options?: DiscogsCollectionOptions): ResolvedConfig;
/**
 * Resolved config, falling back to defaults against process.cwd() if the
 * integration hasn't run yet (or isn't used at all — e.g. calling
 * loadCollection() directly from a plain Node script).
 */
export declare function getConfig(): ResolvedConfig;
