"use client";

import { useRef } from "react";
import { TIMELINE } from "@/config/editor-config";
import { clamp } from "@/lib/audio/audio-utils";
import type { Layer } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";

const KIND_CLASSES: Record<Layer["kind"], string> = {
  image: "bg-track-image/20 border-track-image/50 text-track-image",
  text: "bg-track-text/20 border-track-text/50 text-track-text",
  visualizer:
    "bg-track-visualizer/20 border-track-visualizer/50 text-track-visualizer",
};

type DragMode = "move" | "resize-start" | "resize-end";

type TimelineClipProps = {
  layer: Layer;
  pxPerSecond: number;
  duration: number;
  selected: boolean;
  onSelect: () => void;
};

/** One clip on a layer track: drag to move, grab an edge to resize. */
export function TimelineClip({
  layer,
  pxPerSecond,
  duration,
  selected,
  onSelect,
}: TimelineClipProps) {
  const dragRef = useRef<{
    mode: DragMode;
    pointerStartX: number;
    start: number;
    end: number;
  } | null>(null);

  const end = layer.end ?? duration;
  const snap = (t: number, disable: boolean) =>
    disable ? t : Math.round(t / TIMELINE.snap) * TIMELINE.snap;

  const beginDrag = (mode: DragMode, e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    dragRef.current = {
      mode,
      pointerStartX: e.clientX,
      start: layer.start,
      end,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dt = (e.clientX - drag.pointerStartX) / pxPerSecond;
    const free = e.altKey;
    const length = drag.end - drag.start;
    const { updateLayer } = useProjectStore.getState();
    const min = TIMELINE.minClipLength;

    if (drag.mode === "move") {
      const start = clamp(snap(drag.start + dt, free), 0, duration - length);
      updateLayer(
        layer.id,
        {
          start,
          end: start + length >= duration - 0.05 ? null : start + length,
        },
        { coalesceKey: `clip:${layer.id}` },
      );
    } else if (drag.mode === "resize-start") {
      const start = clamp(snap(drag.start + dt, free), 0, drag.end - min);
      updateLayer(layer.id, { start }, { coalesceKey: `clip:${layer.id}` });
    } else {
      const newEnd = clamp(snap(drag.end + dt, free), drag.start + min, duration);
      updateLayer(
        layer.id,
        { end: newEnd >= duration - 0.05 ? null : newEnd },
        { coalesceKey: `clip:${layer.id}` },
      );
    }
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${layer.name} clip, ${layer.start.toFixed(1)}s to ${end.toFixed(1)}s`}
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
        "group absolute top-1 bottom-1 flex cursor-grab touch-none items-center overflow-hidden rounded-md border px-2 text-[11px] font-medium select-none active:cursor-grabbing",
        KIND_CLASSES[layer.kind],
        !layer.visible && "opacity-40",
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
      )}
      style={{
        left: layer.start * pxPerSecond,
        width: Math.max(8, (end - layer.start) * pxPerSecond),
      }}
    >
      <span className="truncate">{layer.name}</span>
      <span
        onPointerDown={(e) => beginDrag("resize-start", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize bg-current opacity-0 transition-opacity group-hover:opacity-60"
        aria-hidden
      />
      <span
        onPointerDown={(e) => beginDrag("resize-end", e)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize bg-current opacity-0 transition-opacity group-hover:opacity-60"
        aria-hidden
      />
    </div>
  );
}
