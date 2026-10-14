"use client";

import { useEffect, useRef } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";

type AudioWaveformProps = {
  assetId: string;
  widthPx: number;
  heightPx: number;
  /** Window of the file to draw, as fractions 0..1 of its length. */
  from?: number;
  to?: number;
};

/** Timeline waveform for one file, rendered from precomputed peaks. */
export function AudioWaveform({
  assetId,
  widthPx,
  heightPx,
  from = 0,
  to = 1,
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Cap backing-store width; the waveform is decorative at extreme zooms.
      const w = Math.min(8192, Math.max(1, Math.round(widthPx * dpr)));
      const h = Math.round(heightPx * dpr);
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      const peaks = getAudioEngine().getPeaks(assetId);
      if (!peaks) return;
      const first = Math.floor(from * peaks.length);
      const count = Math.max(1, Math.floor((to - from) * peaks.length));
      const mid = h / 2;
      ctx.fillStyle = getComputedStyle(canvas).color;
      const bars = Math.min(count, Math.floor(w / 2));
      const step = w / bars;
      for (let i = 0; i < bars; i++) {
        const peak = peaks[first + Math.floor((i / bars) * count)] ?? 0;
        const barH = Math.max(dpr, peak * (h * 0.85));
        ctx.fillRect(i * step, mid - barH / 2, Math.max(1, step * 0.6), barH);
      }
    };
    draw();
    return getAudioEngine().on("load", draw);
  }, [assetId, widthPx, heightPx, from, to]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none size-full text-track-audio/80"
      style={{ width: widthPx, height: heightPx }}
      aria-hidden
    />
  );
}
