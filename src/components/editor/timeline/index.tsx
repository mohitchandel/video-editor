"use client";

import { useRef } from "react";
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
import { AudioWaveform } from "./audio-waveform";
import { TimelineClip } from "./timeline-clip";
import { TimelinePlayhead } from "./timeline-playhead";

const LABEL_WIDTH = 128;

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

  const pxPerSecond = TIMELINE.basePxPerSecond * zoom;
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

  const second = Math.max(1, Math.round(project.duration / 60));
  const tickEvery = zoom < 0.5 ? 10 : zoom < 1 ? 5 : 1;
  const labelEvery = zoom < 0.5 ? 30 : zoom < 1 ? 10 : 5;
  const ticks: number[] = [];
  for (let t = 0; t <= project.duration; t += tickEvery * second) ticks.push(t);

  return (
    <section
      aria-label="Timeline"
      className="flex h-56 shrink-0 flex-col border-t bg-card"
    >
      <div className="flex h-9 shrink-0 items-center gap-1 border-b px-2">
        <span className="text-[11px] font-semibold tracking-wide">Timeline</span>
        <span className="ml-2 text-[11px] text-muted-foreground">
          Drag clips to move · drag edges to trim · hold ⌥ for free positioning
        </span>
        <div className="flex-1" />
        <span className="mr-1 font-mono text-[11px] text-muted-foreground">
          {formatTime(project.duration)}
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

      <div className="min-h-0 flex-1 overflow-auto">
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
              {ticks.map((t) => (
                <span
                  key={t}
                  className="absolute bottom-0 flex h-full flex-col justify-end"
                  style={{ left: t * pxPerSecond }}
                >
                  <span
                    className={cn(
                      "w-px bg-border",
                      t % (labelEvery * second) === 0 ? "h-2.5" : "h-1.5",
                    )}
                  />
                  {t % (labelEvery * second) === 0 ? (
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
                    duration={project.duration}
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
                <button
                  type="button"
                  aria-label={`Audio track: ${project.audio.name}`}
                  onClick={() => select({ type: "audio" })}
                  className={cn(
                    "absolute inset-y-1 left-0 overflow-hidden rounded-md border border-track-audio/50 bg-track-audio/10 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                    selection?.type === "audio" &&
                      "ring-2 ring-primary ring-offset-1 ring-offset-background",
                  )}
                  style={{ width }}
                >
                  <AudioWaveform
                    widthPx={width}
                    heightPx={TIMELINE.trackHeight - 8}
                  />
                </button>
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
              <button
                type="button"
                aria-label="Background"
                onClick={() => select({ type: "background" })}
                className={cn(
                  "absolute inset-y-1 left-0 flex items-center rounded-md border border-track-background/40 bg-track-background/10 px-2 text-[11px] text-track-background focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                  selection?.type === "background" &&
                    "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
                style={{ width }}
              >
                {project.background.type === "solid"
                  ? "Solid color"
                  : project.background.type === "gradient"
                    ? "Gradient"
                    : "Image"}
              </button>
            </div>
          </div>

          <TimelinePlayhead pxPerSecond={pxPerSecond} offsetPx={LABEL_WIDTH} />
        </div>
      </div>
    </section>
  );
}

/** Coarse time for the a11y value without per-frame re-renders. */
function currentTimeForA11y(): number {
  return getAudioEngine().getCurrentTime();
}
