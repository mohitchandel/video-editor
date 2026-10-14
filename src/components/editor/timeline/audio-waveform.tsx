"use client";

import { useEffect, useRef } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";

type AudioWaveformProps = {
  widthPx: number;
  heightPx: number;
};

/** Timeline waveform rendered from precomputed peaks. */
export function AudioWaveform({ widthPx, heightPx }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Cap backing-store width; the waveform is decorative at extreme zooms.
      const w = Math.min(8192, Math.round(widthPx * dpr));
      const h = Math.round(heightPx * dpr);
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      const peaks = getAudioEngine().getPeaks();
      if (!peaks) return;
      const mid = h / 2;
      const color = getComputedStyle(canvas).color;
      ctx.fillStyle = color;
      const bars = Math.min(peaks.length, Math.floor(w / 2));
      const step = w / bars;
      for (let i = 0; i < bars; i++) {
        const peak = peaks[Math.floor((i / bars) * peaks.length)];
        const barH = Math.max(dpr, peak * (h * 0.85));
        ctx.fillRect(i * step, mid - barH / 2, Math.max(1, step * 0.6), barH);
      }
    };
    draw();
    return getAudioEngine().on("load", draw);
  }, [widthPx, heightPx]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none size-full text-track-audio/80"
      style={{ width: widthPx, height: heightPx }}
      aria-hidden
    />
  );
}
