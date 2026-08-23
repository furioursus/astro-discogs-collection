export function summarize(releases) {
    const artists = new Set();
    const genres = new Set();
    const styles = new Set();
    for (const release of releases) {
        for (const artist of release.artists)
            artists.add(artist);
        for (const genre of release.genres)
            genres.add(genre);
        for (const style of release.styles)
            styles.add(style);
    }
    return {
        totalRecords: releases.length,
        uniqueArtists: artists.size,
        genres: uniqueSorted(genres),
        styles: uniqueSorted(styles),
    };
}
/** Deduplicates and alphabetizes a list of strings — handy for building filter dropdowns. */
export function uniqueSorted(values) {
    return Array.from(new Set(values)).filter(Boolean).sort((a, b) => a.localeCompare(b));
}
