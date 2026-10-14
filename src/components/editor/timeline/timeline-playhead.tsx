"use client";

import { useEffect, useRef } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";

type TimelinePlayheadProps = {
  pxPerSecond: number;
  /** Horizontal offset of the track area (label column width). */
  offsetPx?: number;
};

/**
 * The playhead line. Position is driven by a rAF loop reading the engine
 * clock directly — no React re-renders while playing.
 */
export function TimelinePlayhead({
  pxPerSecond,
  offsetPx = 0,
}: TimelinePlayheadProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const engine = getAudioEngine();
    let raf = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        el.style.transform = `translateX(${offsetPx + engine.getCurrentTime() * pxPerSecond}px)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [pxPerSecond, offsetPx]);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute top-0 bottom-0 left-0 z-20 w-px"
      aria-hidden
    >
      <div className="absolute inset-y-0 w-px bg-primary" />
      <div className="absolute -top-0.5 left-1/2 size-2.5 -translate-x-1/2 rotate-45 rounded-[2px] bg-primary" />
    </div>
  );
}
