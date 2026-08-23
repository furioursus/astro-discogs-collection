export interface CacheImagesResult {
    total: number;
    downloaded: number;
    alreadyCached: number;
    failed: number;
}
export declare function cacheCoverImages(log?: (message: string) => void): Promise<CacheImagesResult>;
