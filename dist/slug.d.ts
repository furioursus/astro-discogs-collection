/** Lowercase, ASCII, hyphen-separated. Strips accents rather than dropping the letters entirely. */
export declare function slugify(value: string): string;
/**
 * Cover image filename for a release: `{artist-slug}_{title-slug}-{id}.jpg`.
 *
 * The release id suffix isn't decorative — artist/title alone collide constantly in a real
 * collection (reissues, remasters, multiple pressings, "Various Artists" comps), and this
 * filename is the only place the id survives on disk, so `virtual-images.ts` depends on it to
 * map a cached file back to the release that owns it.
 */
export declare function coverImageFilename(release: {
    id: number;
    artist: string;
    title: string;
}): string;
/** Recovers the release id from a filename built by `coverImageFilename`, or null if it doesn't match. */
export declare function releaseIdFromCoverFilename(filename: string): string | null;
