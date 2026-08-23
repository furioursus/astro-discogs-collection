// Node/config-context entry — this is what astro.config.mjs imports as the default integration.
// Data helpers (loadCollection, queryCollection, etc.) live under
// `astro-discogs-collection/collection` instead of here; see collection-api.ts for why.
export { default } from './integration.js';
export type { DiscogsCollectionOptions } from './config.js';
