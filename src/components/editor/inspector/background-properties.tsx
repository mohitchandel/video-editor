"use client";

import { ColorField } from "@/components/common/color-field";
import { PropertySlider } from "@/components/common/property-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAssetUrl } from "@/lib/media/media-registry";
import type { ProjectBackground } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";

export function BackgroundProperties() {
  const background = useProjectStore((s) => s.project.background);
  const assets = useProjectStore((s) => s.project.assets);
  const update = useProjectStore((s) => s.update);

  const set = <K extends keyof ProjectBackground>(
    key: K,
    value: ProjectBackground[K],
  ) =>
    update(
      (d) => {
        d.background[key] = value;
      },
      { coalesceKey: `bg:${String(key)}` },
    );

  const images = assets.filter((a) => a.kind === "image");

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Type</span>
        <Select
          value={background.type}
          onValueChange={(v) => set("type", v as ProjectBackground["type"])}
        >
          <SelectTrigger size="sm" className="w-full" aria-label="Background type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid color</SelectItem>
            <SelectItem value="gradient">Gradient</SelectItem>
            <SelectItem value="image" disabled={images.length === 0}>
              Image
            </SelectItem>
          </SelectContent>
        </Select>
      </label>

      {background.type === "solid" ? (
        <ColorField
          label="Color"
          value={background.color}
          onChange={(v) => set("color", v)}
        />
      ) : null}

      {background.type === "gradient" ? (
        <>
          <ColorField
            label="From"
            value={background.gradientFrom}
            onChange={(v) => set("gradientFrom", v)}
          />
          <ColorField
            label="To"
            value={background.gradientTo}
            onChange={(v) => set("gradientTo", v)}
          />
          <PropertySlider
            label="Angle"
            value={background.gradientAngle}
            min={0}
            max={360}
            unit="°"
            onChange={(v) => set("gradientAngle", v)}
          />
        </>
      ) : null}

      {background.type === "image" ? (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Image</span>
          <Select
            value={background.assetId ?? ""}
            onValueChange={(v) => set("assetId", (v as string) || null)}
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Background image">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {images.map((asset) => (
                <SelectItem key={asset.id} value={asset.id}>
                  <span className="flex items-center gap-2">
                    {getAssetUrl(asset.id) ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local object URL
                      <img
                        src={getAssetUrl(asset.id)!}
                        alt=""
                        className="size-4 rounded-sm object-cover"
                      />
                    ) : null}
                    <span className="truncate">{asset.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      <PropertySlider
        label="Dim"
        value={Math.round(background.dim * 100)}
        min={0}
        max={90}
        unit="%"
        onChange={(v) => set("dim", v / 100)}
      />
      {background.type === "image" ? (
        <PropertySlider
          label="Blur"
          value={background.blur}
          min={0}
          max={100}
          onChange={(v) => set("blur", v)}
        />
      ) : null}
    </div>
  );
}
