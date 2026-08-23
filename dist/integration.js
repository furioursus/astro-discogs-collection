import { fileURLToPath } from 'node:url';
import { configure } from './config.js';
import { discogsCollectionImagesPlugin } from './virtual-images.js';
import { cacheCoverImages } from './cache-images.js';
/**
 * Astro integration that reads a Discogs collection/wantlist via the
 * Discogs API and caches cover art locally so it's usable with
 * astro:assets' <Image>/<Picture>. Register it in astro.config.mjs:
 *
 *   import discogsCollection from 'astro-discogs-collection';
 *   export default defineConfig({ integrations: [discogsCollection()] });
 *
 * Then use loadCollection()/loadWantlist()/queryCollection() from
 * 'astro-discogs-collection' in your own pages/components to render the
 * data however you like — this package has no UI components.
 */
export default function discogsCollection(options = {}) {
    return {
        name: 'astro-discogs-collection',
        hooks: {
            'astro:config:setup': ({ config, updateConfig, logger }) => {
                const root = fileURLToPath(config.root);
                const resolved = configure(root, options);
                if (resolved.missingConfig) {
                    logger.warn('DISCOGS_USERNAME/DISCOGS_TOKEN are not set (via integration options or environment variables) — ' +
                        'loadCollection()/loadWantlist() will return { releases: [], missingConfig: true } until configured.');
                }
                updateConfig({
                    vite: {
                        plugins: [discogsCollectionImagesPlugin()],
                    },
                });
            },
            'astro:build:start': async ({ logger }) => {
                await cacheCoverImages((message) => logger.info(message));
            },
            'astro:server:setup': async ({ logger }) => {
                await cacheCoverImages((message) => logger.info(message));
            },
        },
    };
}
