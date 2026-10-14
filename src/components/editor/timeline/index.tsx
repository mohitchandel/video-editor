"use client";

import { useEffect, useRef, useState } from "react";
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Music2,
  Type,
  Wallpaper,
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { TIMELINE } from "@/config/editor-config";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { clamp, formatTime } from "@/lib/audio/audio-utils";
import type { Layer } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";
import { AudioClip } from "./audio-clip";
import { BackgroundTrack } from "./background-track";
import { TimelineClip } from "./timeline-clip";
import { TimelinePlayhead } from "./timeline-playhead";

const LABEL_WIDTH = 128;
/** Candidate ruler label intervals in seconds; the first that fits wins. */
const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300];
/** Minimum pixels between ruler labels. */
const MIN_LABEL_GAP = 72;

const isMultiple = (t: number, step: number) =>
  Math.abs(t / step - Math.round(t / step)) < 1e-6;

const KIND_ICON = {
  image: ImageIcon,
  text: Type,
  visualizer: Waves,
} as const;

function TrackLabel({
  icon: Icon,
  name,
  colorClass,
  visible,
  onToggleVisible,
}: {
  icon: typeof Music2;
  name: string;
  colorClass: string;
  visible?: boolean;
  onToggleVisible?: () => void;
}) {
  return (
    <div
      className="sticky left-0 z-30 flex shrink-0 items-center gap-1.5 border-r border-b bg-card px-2"
      style={{ width: LABEL_WIDTH, height: TIMELINE.trackHeight }}
    >
      <Icon className={cn("size-3.5 shrink-0", colorClass)} aria-hidden />
      <span className="min-w-0 flex-1 truncate text-[11px]">{name}</span>
      {onToggleVisible ? (
        <IconButton
          label={visible ? "Hide track" : "Show track"}
          className="size-5"
          onClick={onToggleVisible}
        >
          {visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
        </IconButton>
      ) : null}
    </div>
  );
}

export function Timeline() {
  const project = useProjectStore((s) => s.project);
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const zoom = useEditorStore((s) => s.timelineZoom);
  const setZoom = useEditorStore((s) => s.setTimelineZoom);
  const scrubbing = useRef(false);

  // Zoom 1 = the whole project fits the visible track area.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(800);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setTrackWidth(Math.max(100, entry.contentRect.width - LABEL_WIDTH - 12));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const pxPerSecond = (trackWidth / Math.max(1, project.duration)) * zoom;
  const width = Math.max(1, project.duration) * pxPerSecond;
  const zoomLevels = TIMELINE.zoomLevels;
  const zoomIndex = zoomLevels.findIndex((z) => z >= zoom - 0.001);

  const seekFromPointer = (e: React.PointerEvent, el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const t = clamp((e.clientX - rect.left) / pxPerSecond, 0, project.duration);
    getAudioEngine().seek(t);
  };

  // Topmost layer first, matching the layers panel.
  const rows = [...project.layers].reverse();

  const labelEvery =
    TICK_STEPS.find((step) => step * pxPerSecond >= MIN_LABEL_GAP) ?? 600;
  const tickEvery = labelEvery >= 5 ? labelEvery / 5 : labelEvery / 2;
  const ticks: number[] = [];
  for (let t = 0; t <= project.duration + 1e-6; t += tickEvery) {
    ticks.push(Number(t.toFixed(3)));
  }

  const trimStart = project.audio?.trimStart ?? 0;
  const trimEnd = project.audio
    ? (project.audio.trimEnd ?? project.audio.duration)
    : project.duration;
  const trimmed = trimStart > 0 || trimEnd < project.duration - 0.01;

  return (
    <section
      aria-label="Timeline"
      className="flex h-56 shrink-0 flex-col border-t bg-card"
    >
      <div className="flex h-9 shrink-0 items-center gap-1 border-b px-2">
        <span className="text-[11px] font-semibold tracking-wide">Timeline</span>
        <span className="ml-2 text-[11px] text-muted-foreground">
          Drag clips to move · drag edges to trim · drag the [ ] handles on the
          audio to set in/out · hold ⌥ for free positioning
        </span>
        <div className="flex-1" />
        <span className="mr-1 font-mono text-[11px] text-muted-foreground">
          {formatTime(trimEnd - trimStart)}
        </span>
        <IconButton
          label="Zoom out timeline"
          disabled={zoomIndex <= 0}
          onClick={() => setZoom(zoomLevels[Math.max(0, zoomIndex - 1)])}
        >
          <ZoomOut aria-hidden />
        </IconButton>
        <IconButton
          label="Zoom in timeline"
          disabled={zoomIndex >= zoomLevels.length - 1}
          onClick={() =>
            setZoom(zoomLevels[Math.min(zoomLevels.length - 1, zoomIndex + 1)])
          }
        >
          <ZoomIn aria-hidden />
        </IconButton>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <div className="relative w-max min-w-full">
          {/* Ruler */}
          <div className="sticky top-0 z-40 flex" style={{ height: TIMELINE.rulerHeight }}>
            <div
              className="sticky left-0 z-50 shrink-0 border-r border-b bg-card"
              style={{ width: LABEL_WIDTH }}
            />
            <div
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(project.duration)}
              aria-valuenow={Math.round(currentTimeForA11y())}
              tabIndex={0}
              onKeyDown={(e) => {
                const engine = getAudioEngine();
                if (e.key === "ArrowRight") engine.seek(engine.getCurrentTime() + 1);
                if (e.key === "ArrowLeft") engine.seek(engine.getCurrentTime() - 1);
              }}
              onPointerDown={(e) => {
                scrubbing.current = true;
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                seekFromPointer(e, e.currentTarget as HTMLElement);
              }}
              onPointerMove={(e) => {
                if (scrubbing.current)
                  seekFromPointer(e, e.currentTarget as HTMLElement);
              }}
              onPointerUp={() => (scrubbing.current = false)}
              className="relative cursor-pointer touch-none border-b bg-background/60"
              style={{ width }}
            >
              {/* Work-area bar: the in/out range that plays and exports */}
              {trimmed ? (
                <span
                  aria-hidden
                  className="absolute top-0 h-1 rounded-full bg-track-audio"
                  style={{
                    left: trimStart * pxPerSecond,
                    width: (trimEnd - trimStart) * pxPerSecond,
                  }}
                />
              ) : null}
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute bottom-0 flex h-full flex-col justify-end"
                  style={{ left: t * pxPerSecond }}
                >
                  <span
                    className={cn(
                      "w-px bg-border",
                      isMultiple(t, labelEvery) ? "h-2.5" : "h-1.5",
                    )}
                  />
                  {isMultiple(t, labelEvery) ? (
                    <span className="absolute bottom-3 left-1 font-mono text-[10px] text-muted-foreground">
                      {formatTime(t)}
                    </span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>

          {/* Layer tracks */}
          {rows.map((layer: Layer) => {
            const Icon = KIND_ICON[layer.kind];
            const colorClass = {
              image: "text-track-image",
              text: "text-track-text",
              visualizer: "text-track-visualizer",
            }[layer.kind];
            return (
              <div key={layer.id} className="flex">
                <TrackLabel
                  icon={Icon}
                  name={layer.name}
                  colorClass={colorClass}
                  visible={layer.visible}
                  onToggleVisible={() =>
                    updateLayer(layer.id, { visible: !layer.visible })
                  }
                />
                <div
                  className="relative shrink-0 border-b"
                  style={{ width, height: TIMELINE.trackHeight }}
                >
                  <TimelineClip
                    layer={layer}
                    pxPerSecond={pxPerSecond}
                    duration={trimEnd}
                    selected={
                      selection?.type === "layer" && selection.id === layer.id
                    }
                    onSelect={() => select({ type: "layer", id: layer.id })}
                  />
                </div>
              </div>
            );
          })}

          {/* Audio track */}
          <div className="flex">
            <TrackLabel
              icon={Music2}
              name={project.audio ? project.audio.name : "Audio"}
              colorClass="text-track-audio"
            />
            <div
              className="relative shrink-0 border-b"
              style={{ width, height: TIMELINE.trackHeight }}
            >
              {project.audio ? (
                <AudioClip
                  audio={project.audio}
                  pxPerSecond={pxPerSecond}
                  widthPx={width}
                  selected={selection?.type === "audio"}
                  onSelect={() => select({ type: "audio" })}
                />
              ) : (
                <p className="flex h-full items-center px-3 text-[11px] text-muted-foreground">
                  No audio — add a song in the Audio tab.
                </p>
              )}
            </div>
          </div>

          {/* Background track */}
          <div className="flex">
            <TrackLabel
              icon={Wallpaper}
              name="Background"
              colorClass="text-track-background"
            />
            <div
              className="relative shrink-0"
              style={{ width, height: TIMELINE.trackHeight }}
            >
              <BackgroundTrack
                pxPerSecond={pxPerSecond}
                duration={project.duration}
              />
            </div>
          </div>

          <TimelinePlayhead pxPerSecond={pxPerSecond} offsetPx={LABEL_WIDTH} />

          {/* Trimmed-off time, dimmed across every track */}
          {project.audio ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 bottom-0 z-10 bg-background/50"
                style={{ left: LABEL_WIDTH, width: trimStart * pxPerSecond }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 bottom-0 z-10 bg-background/50"
                style={{
                  left: LABEL_WIDTH + trimEnd * pxPerSecond,
                  width: Math.max(0, project.duration - trimEnd) * pxPerSecond,
                }}
              />
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** Coarse time for the a11y value without per-frame re-renders. */
function currentTimeForA11y(): number {
  return getAudioEngine().getCurrentTime();
}
