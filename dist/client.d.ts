declare module 'virtual:discogs-collection/images' {
  import type { ImageMetadata } from 'astro';
  const images: Record<string, ImageMetadata>;
  export default images;
}
