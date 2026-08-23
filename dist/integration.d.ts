import type { AstroIntegration } from 'astro';
import { type DiscogsCollectionOptions } from './config.js';
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
export default function discogsCollection(options?: DiscogsCollectionOptions): AstroIntegration;
