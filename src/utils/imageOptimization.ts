/**
 * Image Optimization Pipeline
 * Client-side compression, WebP conversion, and lazy loading injection.
 */

/** Compress an image data URL to a target max dimension and quality */
export async function compressImage(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // Only downscale, never upscale
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }

      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format: preserve PNG transparency, otherwise use JPEG
      const isPng = dataUrl.startsWith('data:image/png');
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const compressed = canvas.toDataURL(mimeType, quality);

      // Only use compressed if it's actually smaller
      resolve(compressed.length < dataUrl.length ? compressed : dataUrl);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = dataUrl;
  });
}

/** Convert a data URL to WebP format if the browser supports it */
export async function convertToWebP(dataUrl: string, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(dataUrl); return; }

      ctx.drawImage(img, 0, 0);

      const webp = canvas.toDataURL('image/webp', quality);
      // Check if browser actually produced WebP (some older ones silently fall back to PNG)
      if (webp.startsWith('data:image/webp')) {
        resolve(webp.length < dataUrl.length ? webp : dataUrl);
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/** Inject loading="lazy" into all <img> tags in HTML that don't already have it */
export function injectLazyLoading(html: string): string {
  return html.replace(
    /<img(?![^>]*loading\s*=)([^>]*?)(\s*\/?>)/gi,
    '<img loading="lazy"$1$2',
  );
}

/** Get estimated file size in KB from a data URL */
export function getDataUrlSizeKB(dataUrl: string): number {
  // base64 is ~4/3 of the raw bytes, and the prefix is metadata
  const base64Part = dataUrl.split(',')[1];
  if (!base64Part) return 0;
  const bytes = Math.ceil((base64Part.length * 3) / 4);
  return Math.round((bytes / 1024) * 10) / 10;
}

/** Full optimization pipeline: compress → WebP → return optimized data URL + metadata */
export async function optimizeImage(
  dataUrl: string,
  options?: { maxWidth?: number; quality?: number; tryWebP?: boolean },
): Promise<{ dataUrl: string; sizeKB: number; format: string }> {
  const maxWidth = options?.maxWidth ?? 1200;
  const quality = options?.quality ?? 0.8;
  const tryWebP = options?.tryWebP ?? true;

  let optimized = await compressImage(dataUrl, maxWidth, quality);

  if (tryWebP) {
    optimized = await convertToWebP(optimized, quality);
  }

  const format = optimized.startsWith('data:image/webp') ? 'webp'
    : optimized.startsWith('data:image/png') ? 'png'
    : 'jpeg';

  return {
    dataUrl: optimized,
    sizeKB: getDataUrlSizeKB(optimized),
    format,
  };
}
