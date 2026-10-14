"use client";

import { useRef, useState } from "react";
import { VolumeX } from "lucide-react";
import { LayerContextMenu } from "@/components/editor/layer-context-menu";
import { TIMELINE } from "@/config/editor-config";
import { clamp, formatTime } from "@/lib/audio/audio-utils";
import { audioClipLength, type AudioClip } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";
import { AudioWaveform } from "./audio-waveform";

type AudioClipProps = {
  clip: AudioClip;
  pxPerSecond: number;
  selected: boolean;
  onSelect: () => void;
};

type DragMode = "move" | "trim-start" | "trim-end";

/**
 * One audio clip on its timeline row. Drag the body to move it, drag an edge
 * to trim the file's in/out point (the left edge keeps the end in place, like
 * desktop editors). Overlapping clips simply mix.
 */
export function AudioClipView({ clip, pxPerSecond, selected, onSelect }: AudioClipProps) {
  const dragRef = useRef<{
    mode: DragMode;
    pointerStartX: number;
    start: number;
    trimStart: number;
    trimEnd: number;
  } | null>(null);
  const [dragging, setDragging] = useState<DragMode | null>(null);

  const trimEnd = clip.trimEnd ?? clip.duration;
  const length = audioClipLength(clip);
  const snap = (t: number, disable: boolean) =>
    disable ? t : Math.round(t / TIMELINE.snap) * TIMELINE.snap;

  const beginDrag = (mode: DragMode, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect();
    dragRef.current = {
      mode,
      pointerStartX: e.clientX,
      start: clip.start,
      trimStart: clip.trimStart,
      trimEnd,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(mode);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dt = (e.clientX - drag.pointerStartX) / pxPerSecond;
    const free = e.altKey;
    const min = TIMELINE.minAudioLength;
    const { updateAudioClip } = useProjectStore.getState();
    const options = { coalesceKey: `audio-drag:${clip.id}` };

    if (drag.mode === "move") {
      updateAudioClip(clip.id, { start: Math.max(0, snap(drag.start + dt, free)) }, options);
    } else if (drag.mode === "trim-start") {
      // Shift the in point and the timeline start together so the clip's
      // end stays where it is.
      const delta = clamp(
        snap(drag.trimStart + dt, free) - drag.trimStart,
        -Math.min(drag.trimStart, drag.start),
        drag.trimEnd - drag.trimStart - min,
      );
      updateAudioClip(
        clip.id,
        { trimStart: drag.trimStart + delta, start: drag.start + delta },
        options,
      );
    } else {
      const next = clamp(snap(drag.trimEnd + dt, free), drag.trimStart + min, clip.duration);
      updateAudioClip(
        clip.id,
        { trimEnd: next >= clip.duration - 0.01 ? null : next },
        options,
      );
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(null);
  };

  const edgeClass =
    "absolute inset-y-0 z-10 flex w-2.5 cursor-ew-resize touch-none items-center justify-center bg-track-audio/80 text-background opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none";

  return (
    <LayerContextMenu target={{ type: "audio", id: clip.id }} triggerClassName="contents">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${clip.name} clip, ${formatTime(clip.start)} to ${formatTime(clip.start + length)}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        onPointerDown={(e) => beginDrag("move", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "group absolute inset-y-1 cursor-grab touch-none overflow-hidden rounded-md border border-track-audio/50 bg-track-audio/10 select-none active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
          clip.muted && "opacity-50",
          selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        )}
        style={{
          left: clip.start * pxPerSecond,
          width: Math.max(8, length * pxPerSecond),
        }}
      >
        <AudioWaveform
          assetId={clip.assetId}
          widthPx={Math.max(8, length * pxPerSecond)}
          heightPx={TIMELINE.trackHeight - 8}
          from={clip.trimStart / clip.duration}
          to={trimEnd / clip.duration}
        />
        <span className="pointer-events-none absolute top-0.5 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded bg-background/70 px-1 text-[10px] text-track-audio">
          {clip.muted ? <VolumeX className="size-3" aria-hidden /> : null}
          <span className="truncate">
            {dragging === "move"
              ? `${clip.name} · ${formatTime(clip.start)}`
              : dragging === "trim-start"
                ? `In ${formatTime(clip.trimStart)}`
                : dragging === "trim-end"
                  ? `Out ${formatTime(trimEnd)} · ${formatTime(length)} long`
                  : clip.name}
          </span>
        </span>
        <span
          role="slider"
          aria-label="Trim in point"
          aria-valuenow={Math.round(clip.trimStart)}
          tabIndex={0}
          onPointerDown={(e) => beginDrag("trim-start", e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(edgeClass, "left-0 rounded-l-md")}
        >
          <span className="h-3 w-px bg-current" />
        </span>
        <span
          role="slider"
          aria-label="Trim out point"
          aria-valuenow={Math.round(trimEnd)}
          tabIndex={0}
          onPointerDown={(e) => beginDrag("trim-end", e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className={cn(edgeClass, "right-0 rounded-r-md")}
        >
          <span className="h-3 w-px bg-current" />
        </span>
      </div>
    </LayerContextMenu>
  );
}
