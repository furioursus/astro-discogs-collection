import path from 'node:path';
const DEFAULT_USER_AGENT = 'astro-discogs-collection (build script)';
const DEFAULTS = {
    folderId: 0,
    imageCacheDir: 'src/assets/discogs-collection/cover-images',
    cachePath: '.cache/discogs-collection/cache.json',
    cacheTtlHours: 6,
};
function resolve(root, options) {
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
        missingConfig: !username || !token,
    };
}
let current = null;
/**
 * Called by the Astro integration during astro:config:setup with the
 * project root and the user's integration options, resolving everything
 * once for the rest of the package to read.
 */
export function configure(root, options = {}) {
    current = resolve(root, options);
    return current;
}
/**
 * Resolved config, falling back to defaults against process.cwd() if the
 * integration hasn't run yet (or isn't used at all — e.g. calling
 * loadCollection() directly from a plain Node script).
 */
export function getConfig() {
    if (!current) {
        current = resolve(process.cwd(), {});
    }
    return current;
}
