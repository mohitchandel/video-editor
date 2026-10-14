"use client";

import { useRef, useState } from "react";
import { TIMELINE } from "@/config/editor-config";
import { clamp, formatTime } from "@/lib/audio/audio-utils";
import type { ProjectAudio } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";
import { AudioWaveform } from "./audio-waveform";

type AudioClipProps = {
  audio: ProjectAudio;
  pxPerSecond: number;
  widthPx: number;
  selected: boolean;
  onSelect: () => void;
};

type TrimEdge = "start" | "end";

/**
 * The song on the timeline. Always spans the full file; dragging the in/out
 * handles trims what plays and exports, and the trimmed-off parts are dimmed.
 */
export function AudioClip({
  audio,
  pxPerSecond,
  widthPx,
  selected,
  onSelect,
}: AudioClipProps) {
  const dragRef = useRef<{
    edge: TrimEdge;
    pointerStartX: number;
    trimStart: number;
    trimEnd: number;
  } | null>(null);

  const [dragging, setDragging] = useState<TrimEdge | null>(null);

  const trimEnd = audio.trimEnd ?? audio.duration;
  const snap = (t: number, disable: boolean) =>
    disable ? t : Math.round(t / TIMELINE.snap) * TIMELINE.snap;

  const beginDrag = (edge: TrimEdge, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    dragRef.current = {
      edge,
      pointerStartX: e.clientX,
      trimStart: audio.trimStart,
      trimEnd,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(edge);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dt = (e.clientX - drag.pointerStartX) / pxPerSecond;
    const min = TIMELINE.minAudioLength;
    const next =
      drag.edge === "start"
        ? {
            trimStart: clamp(snap(drag.trimStart + dt, e.altKey), 0, drag.trimEnd - min),
            trimEnd: drag.trimEnd,
          }
        : {
            trimStart: drag.trimStart,
            trimEnd: clamp(
              snap(drag.trimEnd + dt, e.altKey),
              drag.trimStart + min,
              audio.duration,
            ),
          };
    useProjectStore.getState().update(
      (draft) => {
        if (!draft.audio) return;
        draft.audio.trimStart = next.trimStart;
        draft.audio.trimEnd =
          next.trimEnd >= audio.duration - 0.01 ? null : next.trimEnd;
      },
      { coalesceKey: "audio-trim" },
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(null);
  };

  // Bracket-style in/out handles, like the trim grips in desktop editors.
  const handleClass =
    "absolute inset-y-0 z-10 flex w-3.5 cursor-ew-resize touch-none items-center justify-center bg-track-audio text-background shadow-[0_0_0_1px_rgba(0,0,0,0.4)] transition-[filter] hover:brightness-125 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none";
  const gripClass = "flex flex-col gap-0.5 *:h-2.5 *:w-px *:bg-current";

  return (
    <div
      className={cn(
        "absolute inset-y-1 left-0 overflow-hidden rounded-md border border-track-audio/50 bg-track-audio/10",
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
      style={{ width: widthPx }}
    >
      <button
        type="button"
        aria-label={`Audio track: ${audio.name}`}
        onClick={onSelect}
        className="absolute inset-0 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
      >
        <AudioWaveform widthPx={widthPx} heightPx={TIMELINE.trackHeight - 8} />
      </button>

      {/* Trimmed-off regions, hatched so they read as "cut" */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-background/75 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(255,255,255,0.05)_6px_8px)]"
        style={{ width: audio.trimStart * pxPerSecond }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 bg-background/75 bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(255,255,255,0.05)_6px_8px)]"
        style={{ width: (audio.duration - trimEnd) * pxPerSecond }}
      />

      <span
        role="slider"
        aria-label="Trim start"
        aria-valuemin={0}
        aria-valuemax={Math.round(trimEnd)}
        aria-valuenow={Math.round(audio.trimStart)}
        tabIndex={0}
        onPointerDown={(e) => beginDrag("start", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title={`In point ${formatTime(audio.trimStart)}`}
        className={cn(handleClass, "flex-row gap-0.5 rounded-l-md")}
        style={{ left: audio.trimStart * pxPerSecond }}
      >
        <span className={gripClass}>
          <span />
          <span />
        </span>
      </span>
      {dragging ? (
        <span
          aria-live="polite"
          className="pointer-events-none absolute top-0.5 z-20 rounded bg-background/90 px-1 font-mono text-[10px] text-foreground"
          style={
            dragging === "start"
              ? { left: audio.trimStart * pxPerSecond + 16 }
              : { left: trimEnd * pxPerSecond - 16, transform: "translateX(-100%)" }
          }
        >
          {dragging === "start"
            ? `In ${formatTime(audio.trimStart)}`
            : `Out ${formatTime(trimEnd)} · ${formatTime(trimEnd - audio.trimStart)} long`}
        </span>
      ) : null}
      <span
        role="slider"
        aria-label="Trim end"
        aria-valuemin={Math.round(audio.trimStart)}
        aria-valuemax={Math.round(audio.duration)}
        aria-valuenow={Math.round(trimEnd)}
        tabIndex={0}
        onPointerDown={(e) => beginDrag("end", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title={`Out point ${formatTime(trimEnd)}`}
        className={cn(handleClass, "rounded-r-md")}
        style={{ left: trimEnd * pxPerSecond - 14 }}
      >
        <span className={gripClass}>
          <span />
          <span />
        </span>
      </span>
    </div>
  );
}
