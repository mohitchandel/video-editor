/**
 * Runtime home for binary media. Project JSON stores only AssetMeta; the
 * actual Blobs, object URLs, and decoded images live here, keyed by asset id.
 */

interface RegisteredAsset {
  blob: Blob;
  objectUrl: string;
  image?: HTMLImageElement;
}

const assets = new Map<string, RegisteredAsset>();

export function registerAsset(id: string, blob: Blob): string {
  revokeAsset(id);
  const objectUrl = URL.createObjectURL(blob);
  assets.set(id, { blob, objectUrl });
  return objectUrl;
}

export function getAssetUrl(id: string): string | null {
  return assets.get(id)?.objectUrl ?? null;
}

export function getAssetBlob(id: string): Blob | null {
  return assets.get(id)?.blob ?? null;
}

/**
 * Decoded image element for canvas drawing. Loads lazily; returns null until
 * the image is ready (the render loop simply picks it up on a later frame).
 */
export function getAssetImage(id: string): HTMLImageElement | null {
  const asset = assets.get(id);
  if (!asset) return null;
  if (asset.image) {
    return asset.image.complete && asset.image.naturalWidth > 0
      ? asset.image
      : null;
  }
  const img = new Image();
  img.src = asset.objectUrl;
  asset.image = img;
  return null;
}

export function revokeAsset(id: string) {
  const existing = assets.get(id);
  if (existing) {
    URL.revokeObjectURL(existing.objectUrl);
    assets.delete(id);
  }
}

export function listAssetIds(): string[] {
  return [...assets.keys()];
}

export function clearAssets() {
  for (const id of [...assets.keys()]) revokeAsset(id);
}
