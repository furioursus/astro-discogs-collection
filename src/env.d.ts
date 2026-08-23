/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly DISCOGS_USERNAME: string;
  readonly DISCOGS_TOKEN: string;
  readonly DISCOGS_USER_AGENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
