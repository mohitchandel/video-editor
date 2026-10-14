"use client";

import { Plus, Wallpaper } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { formatTime } from "@/lib/audio/audio-utils";
import { getAssetUrl } from "@/lib/media/media-registry";
import type { ProjectBackground } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";

const SOLID_COLORS = [
  "#0c0c10",
  "#000000",
  "#141e30",
  "#1a0b2e",
  "#2d132c",
  "#0f2d25",
  "#232526",
  "#3d1308",
];

const GRADIENTS: Array<{ from: string; to: string; angle: number }> = [
  { from: "#17103a", to: "#0c0c10", angle: 135 },
  { from: "#2b1055", to: "#7597de", angle: 160 },
  { from: "#0f0c29", to: "#302b63", angle: 120 },
  { from: "#42275a", to: "#734b6d", angle: 135 },
  { from: "#141e30", to: "#243b55", angle: 135 },
  { from: "#232526", to: "#414345", angle: 180 },
  { from: "#200122", to: "#6f0000", angle: 150 },
  { from: "#061700", to: "#2c5e1a", angle: 135 },
];

export function BackgroundPicker() {
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  // Presets apply to the selected background segment: a timed change if one
  // is selected, otherwise the base background.
  const changeId =
    selection?.type === "background" ? (selection.changeId ?? null) : null;
  const baseBackground = useProjectStore((s) => s.project.background);
  const change = useProjectStore((s) =>
    s.project.backgroundChanges.find((c) => c.id === changeId),
  );
  const changeCount = useProjectStore((s) => s.project.backgroundChanges.length);
  const assets = useProjectStore((s) => s.project.assets);
  const update = useProjectStore((s) => s.update);
  const addBackgroundChange = useProjectStore((s) => s.addBackgroundChange);
  const displayTime = usePlaybackStore((s) => s.displayTime);
  const shown = formatTime;

  const background = change ? change.background : baseBackground;
  const targetSelection = { type: "background" as const, ...(change ? { changeId: change.id } : {}) };

  const images = assets.filter((a) => a.kind === "image");

  const apply = (mutate: (bg: ProjectBackground) => void) => {
    update((d) => {
      const target = changeId
        ? d.backgroundChanges.find((c) => c.id === changeId)?.background
        : d.background;
      if (target) mutate(target);
    });
    select(targetSelection);
  };

  const pickSolid = (color: string) =>
    apply((bg) => {
      bg.type = "solid";
      bg.color = color;
    });

  const pickGradient = (g: (typeof GRADIENTS)[number]) =>
    apply((bg) => {
      bg.type = "gradient";
      bg.gradientFrom = g.from;
      bg.gradientTo = g.to;
      bg.gradientAngle = g.angle;
    });

  const pickImage = (assetId: string) =>
    apply((bg) => {
      bg.type = "image";
      bg.assetId = assetId;
    });

  const addChangeAtPlayhead = () => {
    const at = Math.round(getAudioEngine().getCurrentTime() * 2) / 2;
    const id = addBackgroundChange(at);
    select({ type: "background", changeId: id });
  };

  return (
    <div className="flex flex-col gap-4 p-3">
      <section className="flex flex-col gap-2 rounded-md border bg-elevated p-2.5">
        <p className="text-xs font-medium">
          {change
            ? `Editing change at ${shown(change.at)}`
            : "Editing the opening background"}
        </p>
        <p className="text-[11px] text-muted-foreground">
          Move the playhead, then add a change to switch backgrounds mid-song.
          Pick the transition in the inspector.
          {changeCount > 0 ? ` ${changeCount} change${changeCount > 1 ? "s" : ""} on the timeline.` : ""}
        </p>
        <Button size="sm" variant="outline" onClick={addChangeAtPlayhead}>
          <Plus aria-hidden /> Add change at {shown(displayTime)}
        </Button>
      </section>
      <section className="flex flex-col gap-2">
        <p className="text-[11px] text-muted-foreground">Solid colors</p>
        <div className="grid grid-cols-4 gap-2">
          {SOLID_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Solid background ${color}`}
              onClick={() => pickSolid(color)}
              className={cn(
                "aspect-square rounded-md border transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                background.type === "solid" && background.color === color
                  ? "border-primary ring-1 ring-primary"
                  : "border-border",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[11px] text-muted-foreground">Gradients</p>
        <div className="grid grid-cols-4 gap-2">
          {GRADIENTS.map((g) => (
            <button
              key={`${g.from}-${g.to}`}
              type="button"
              aria-label={`Gradient background ${g.from} to ${g.to}`}
              onClick={() => pickGradient(g)}
              className={cn(
                "aspect-square rounded-md border transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                background.type === "gradient" &&
                  background.gradientFrom === g.from &&
                  background.gradientTo === g.to
                  ? "border-primary ring-1 ring-primary"
                  : "border-border",
              )}
              style={{
                backgroundImage: `linear-gradient(${g.angle}deg, ${g.from}, ${g.to})`,
              }}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[11px] text-muted-foreground">Your images</p>
        {images.length === 0 ? (
          <EmptyState
            icon={Wallpaper}
            title="No images uploaded"
            hint="Upload album art in the Media tab to use it as a backdrop."
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((asset) => {
              const url = getAssetUrl(asset.id);
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => pickImage(asset.id)}
                  aria-label={`Use ${asset.name} as background`}
                  className={cn(
                    "aspect-video overflow-hidden rounded-md border bg-canvas focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                    background.type === "image" &&
                      background.assetId === asset.id
                      ? "border-primary ring-1 ring-primary"
                      : "border-border",
                  )}
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL
                    <img
                      src={url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
