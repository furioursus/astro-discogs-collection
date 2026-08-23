const COMBINING_DIACRITICS_RE = /[̀-ͯ]/g;

/** Lowercase, ASCII, hyphen-separated. Strips accents rather than dropping the letters entirely. */
export function slugify(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS_RE, '') // e.g. "e" + combining acute -> "e", not dropped entirely
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'untitled';
}

/**
 * Cover image filename for a release: `{artist-slug}_{title-slug}-{id}.jpg`.
 *
 * The release id suffix isn't decorative — artist/title alone collide constantly in a real
 * collection (reissues, remasters, multiple pressings, "Various Artists" comps), and this
 * filename is the only place the id survives on disk, so `virtual-images.ts` depends on it to
 * map a cached file back to the release that owns it.
 */
export function coverImageFilename(release: { id: number; artist: string; title: string }): string {
  return `${slugify(release.artist)}_${slugify(release.title)}-${release.id}.jpg`;
}

/** Recovers the release id from a filename built by `coverImageFilename`, or null if it doesn't match. */
export function releaseIdFromCoverFilename(filename: string): string | null {
  const match = filename.match(/-(\d+)\.jpg$/);
  return match ? match[1] : null;
}
