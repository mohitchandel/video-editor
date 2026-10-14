export function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Cover-fit a source inside a destination rect (like CSS object-fit: cover). */
export function coverRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const srcRatio = srcW / srcH;
  const dstRatio = dstW / dstH;
  if (srcRatio > dstRatio) {
    const sw = srcH * dstRatio;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / dstRatio;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

export function imageSourceSize(source: CanvasImageSource): {
  width: number;
  height: number;
} {
  if (source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  if (typeof ImageBitmap !== "undefined" && source instanceof ImageBitmap) {
    return { width: source.width, height: source.height };
  }
  const anySource = source as { width?: number; height?: number };
  return { width: anySource.width ?? 0, height: anySource.height ?? 0 };
}

/**
 * Resample byte frequency bins (0..255) into `count` normalized values with a
 * logarithmic-ish emphasis on the musical range (drops the top ~25% of bins,
 * which are mostly empty for music).
 */
export function resampleFrequencyBins(
  freq: Uint8Array,
  count: number,
  out: Float32Array,
) {
  const usable = Math.floor(freq.length * 0.75);
  for (let i = 0; i < count; i++) {
    const start = Math.floor((i / count) * usable);
    const end = Math.max(start + 1, Math.floor(((i + 1) / count) * usable));
    let sum = 0;
    for (let j = start; j < end; j++) sum += freq[j];
    out[i] = sum / ((end - start) * 255);
  }
}
