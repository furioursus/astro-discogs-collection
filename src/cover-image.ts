import type { ImageMetadata } from 'astro';
import images from 'virtual:discogs-collection/images';

/**
 * Returns the optimizable local image for a release's cover art, if it's
 * been cached (via the integration's automatic build/dev-time image
 * caching). Falls back to `undefined` — use the release's remote
 * `coverImageUrl` instead — for releases that haven't been downloaded yet,
 * e.g. before the first cache run, or if a specific download failed.
 *
 * Usage:
 *   import { Image } from 'astro:assets';
 *   import { getLocalCoverImage } from 'astro-discogs-collection/images';
 *
 *   const localImage = getLocalCoverImage(release.id);
 *   ...
 *   {localImage
 *     ? <Image src={localImage} alt={release.title} width={300} />
 *     : <img src={release.coverImageUrl} alt={release.title} />}
 */
export function getLocalCoverImage(releaseId: number): ImageMetadata | undefined {
  return images[String(releaseId)];
}
