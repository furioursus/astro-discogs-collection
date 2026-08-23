// Page/component-facing data API, deliberately kept out of the root `index.ts` barrel.
//
// `index.ts` re-exports the integration's `default` (for astro.config.mjs), which pulls in
// `virtual-images.ts` and its `import { normalizePath } from 'vite'` — real Vite runtime meant
// for Node/config context. Astro bundles a page's frontmatter imports into its SSR chunk, so a
// page importing data helpers from the same barrel as the integration was dragging that Vite
// plugin-authoring code into the page's SSR bundle too. During `astro build`'s static prerender
// that inlined Vite code hit a case-sensitivity probe (`testCaseInsensitiveFS`) that assumes a
// `dist/client/client.mjs` exists — which it never does on a site with no client-side JS — and
// crashed every page that imported data helpers from the main entry, with an error that pointed
// nowhere near the actual cause.
//
// Keeping this on its own subpath (`astro-discogs-collection/collection`) means importing
// loadCollection()/queryCollection()/etc. from a page never touches integration.ts or vite.
export { loadCollection, loadWantlist } from './collection-data.js';
export { queryCollection } from './query.js';
export { summarize, uniqueSorted } from './collection.js';
