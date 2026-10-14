"use client";

import { useRef } from "react";
import { TIMELINE } from "@/config/editor-config";
import { clamp } from "@/lib/audio/audio-utils";
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
  };

  const handleClass =
    "absolute inset-y-0 z-10 flex w-2.5 cursor-ew-resize touch-none items-center justify-center bg-track-audio text-background opacity-70 transition-opacity hover:opacity-100";

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

      {/* Trimmed-off regions */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 bg-background/70"
        style={{ width: audio.trimStart * pxPerSecond }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 bg-background/70"
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
        className={cn(handleClass, "rounded-l-md")}
        style={{ left: audio.trimStart * pxPerSecond }}
      >
        <span className="h-3 w-px bg-current" />
      </span>
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
        className={cn(handleClass, "rounded-r-md")}
        style={{ left: trimEnd * pxPerSecond - 10 }}
      >
        <span className="h-3 w-px bg-current" />
      </span>
    </div>
  );
}
