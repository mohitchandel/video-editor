"use client";

import { useRef } from "react";
import { ArrowRightLeft } from "lucide-react";
import { TIMELINE } from "@/config/editor-config";
import { clamp } from "@/lib/audio/audio-utils";
import { getAssetUrl } from "@/lib/media/media-registry";
import type {
  BackgroundChange,
  ProjectBackground,
} from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";

type BackgroundTrackProps = {
  pxPerSecond: number;
  duration: number;
};

/** Minimum gap between consecutive background changes, seconds. */
const MIN_GAP = 0.5;

function swatchStyle(bg: ProjectBackground): React.CSSProperties {
  if (bg.type === "gradient") {
    return {
      backgroundImage: `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`,
    };
  }
  if (bg.type === "image" && bg.assetId) {
    const url = getAssetUrl(bg.assetId);
    if (url) {
      return { backgroundImage: `url(${url})`, backgroundSize: "cover" };
    }
  }
  return { backgroundColor: bg.color };
}

function describe(bg: ProjectBackground): string {
  if (bg.type === "gradient") return "Gradient";
  if (bg.type === "image") return "Image";
  return "Solid color";
}

/**
 * Background segments on the timeline: the base background from 0, then one
 * clip per timed change. Change clips drag to move their start time.
 */
export function BackgroundTrack({ pxPerSecond, duration }: BackgroundTrackProps) {
  const base = useProjectStore((s) => s.project.background);
  const changes = useProjectStore((s) => s.project.backgroundChanges);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const dragRef = useRef<{
    id: string;
    pointerStartX: number;
    at: number;
    min: number;
    max: number;
  } | null>(null);

  const sorted = [...changes].sort((a, b) => a.at - b.at);
  const segments: Array<{
    change: BackgroundChange | null;
    bg: ProjectBackground;
    start: number;
    end: number;
  }> = [];
  segments.push({
    change: null,
    bg: base,
    start: 0,
    end: sorted[0]?.at ?? duration,
  });
  sorted.forEach((change, i) => {
    segments.push({
      change,
      bg: change.background,
      start: change.at,
      end: sorted[i + 1]?.at ?? duration,
    });
  });

  const selectedId =
    selection?.type === "background" ? (selection.changeId ?? null) : null;

  const beginDrag = (index: number, e: React.PointerEvent) => {
    const change = sorted[index];
    e.stopPropagation();
    select({ type: "background", changeId: change.id });
    dragRef.current = {
      id: change.id,
      pointerStartX: e.clientX,
      at: change.at,
      min: (sorted[index - 1]?.at ?? 0) + MIN_GAP,
      max: (sorted[index + 1]?.at ?? duration) - MIN_GAP,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dt = (e.clientX - drag.pointerStartX) / pxPerSecond;
    const raw = drag.at + dt;
    const snapped = e.altKey ? raw : Math.round(raw / TIMELINE.snap) * TIMELINE.snap;
    const at = clamp(snapped, drag.min, drag.max);
    useProjectStore.getState().update(
      (d) => {
        const c = d.backgroundChanges.find((x) => x.id === drag.id);
        if (c) c.at = at;
      },
      { coalesceKey: `bgc:${drag.id}` },
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  return (
    <>
      {segments.map((segment, i) => {
        const id = segment.change?.id ?? null;
        const selected = selection?.type === "background" && selectedId === id;
        const width = Math.max(8, (segment.end - segment.start) * pxPerSecond);
        return (
          <div
            key={id ?? "base"}
            role="button"
            tabIndex={0}
            aria-label={
              segment.change
                ? `Background change at ${segment.start.toFixed(1)}s: ${describe(segment.bg)}`
                : `Background: ${describe(segment.bg)}`
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                select({ type: "background", ...(id ? { changeId: id } : {}) });
              }
            }}
            onClick={() =>
              select({ type: "background", ...(id ? { changeId: id } : {}) })
            }
            onPointerDown={segment.change ? (e) => beginDrag(i - 1, e) : undefined}
            onPointerMove={segment.change ? onPointerMove : undefined}
            onPointerUp={segment.change ? onPointerUp : undefined}
            onPointerCancel={segment.change ? onPointerUp : undefined}
            className={cn(
              "absolute inset-y-1 flex items-center gap-1.5 overflow-hidden rounded-md border border-track-background/40 bg-track-background/10 px-1.5 text-[11px] text-track-background select-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
              segment.change && "cursor-grab touch-none active:cursor-grabbing",
              selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
            )}
            style={{ left: segment.start * pxPerSecond, width }}
          >
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-sm border border-white/15"
              style={swatchStyle(segment.bg)}
            />
            {segment.change && segment.change.transition !== "cut" ? (
              <ArrowRightLeft className="size-3 shrink-0 opacity-70" aria-hidden />
            ) : null}
            <span className="truncate">{describe(segment.bg)}</span>
          </div>
        );
      })}
    </>
  );
}
