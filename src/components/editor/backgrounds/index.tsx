"use client";

import { Wallpaper } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { getAssetUrl } from "@/lib/media/media-registry";
import { useEditorStore } from "@/stores/editor-store";
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
  const background = useProjectStore((s) => s.project.background);
  const assets = useProjectStore((s) => s.project.assets);
  const update = useProjectStore((s) => s.update);
  const select = useEditorStore((s) => s.select);

  const images = assets.filter((a) => a.kind === "image");

  const pickSolid = (color: string) => {
    update((d) => {
      d.background.type = "solid";
      d.background.color = color;
    });
    select({ type: "background" });
  };

  const pickGradient = (g: (typeof GRADIENTS)[number]) => {
    update((d) => {
      d.background.type = "gradient";
      d.background.gradientFrom = g.from;
      d.background.gradientTo = g.to;
      d.background.gradientAngle = g.angle;
    });
    select({ type: "background" });
  };

  const pickImage = (assetId: string) => {
    update((d) => {
      d.background.type = "image";
      d.background.assetId = assetId;
    });
    select({ type: "background" });
  };

  return (
    <div className="flex flex-col gap-4 p-3">
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
