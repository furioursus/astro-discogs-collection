function matchesAny(values, filter) {
    if (filter === undefined)
        return true;
    const allowed = Array.isArray(filter) ? filter : [filter];
    const lowerValues = values.map((v) => v.toLowerCase());
    return allowed.some((f) => lowerValues.includes(f.toLowerCase()));
}
function matchesWhere(release, where) {
    if (where.artist && !release.artist.toLowerCase().includes(where.artist.toLowerCase()))
        return false;
    if (where.title && !release.title.toLowerCase().includes(where.title.toLowerCase()))
        return false;
    if (!matchesAny(release.genres, where.genre))
        return false;
    if (!matchesAny(release.styles, where.style))
        return false;
    if (!matchesAny(release.formats, where.format))
        return false;
    if (where.minYear !== undefined && release.year < where.minYear)
        return false;
    if (where.maxYear !== undefined && release.year > where.maxYear)
        return false;
    if (where.minRating !== undefined && release.rating < where.minRating)
        return false;
    if (where.minPrice !== undefined && (release.averagePrice ?? -Infinity) < where.minPrice)
        return false;
    if (where.maxPrice !== undefined && (release.averagePrice ?? Infinity) > where.maxPrice)
        return false;
    return true;
}
function compareBy(a, b, field) {
    switch (field) {
        case 'artist':
            return a.artist.localeCompare(b.artist);
        case 'title':
            return a.title.localeCompare(b.title);
        case 'year':
            return a.year - b.year;
        case 'dateAdded':
            return (a.dateAdded ?? '').localeCompare(b.dateAdded ?? '');
        case 'rating':
            return a.rating - b.rating;
        case 'price':
            // Releases with no price data sort first ascending (last descending,
            // since the whole result is reversed for 'desc') rather than being dropped.
            return (a.averagePrice ?? -Infinity) - (b.averagePrice ?? -Infinity);
    }
}
/**
 * Filters, sorts, and limits a list of releases in one call — usable
 * directly on the result of `loadCollection()`/`loadWantlist()` from a
 * page's frontmatter.
 */
export function queryCollection(releases, options = {}) {
    const { where, sortBy, order = 'asc', limit } = options;
    let results = where ? releases.filter((r) => matchesWhere(r, where)) : releases.slice();
    if (sortBy) {
        results.sort((a, b) => compareBy(a, b, sortBy));
        if (order === 'desc')
            results.reverse();
    }
    if (limit !== undefined) {
        results = results.slice(0, limit);
    }
    return results;
}
