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
import { Switch } from "@/components/ui/switch";
import { COLOR_PALETTES, VISUALIZER_PRESETS } from "@/config/visualizer-presets";
import type {
  VisualizerLayer,
  VisualizerStyle,
} from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";
import { LayerCommonSection, PositionSection } from "./layer-common";

export function VisualizerProperties({ layer }: { layer: VisualizerLayer }) {
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const set = <K extends keyof VisualizerLayer>(
    key: K,
    value: VisualizerLayer[K],
  ) =>
    updateLayer(layer.id, { [key]: value }, {
      coalesceKey: `${String(key)}:${layer.id}`,
    });

  return (
    <div className="flex flex-col gap-4">
      <LayerCommonSection layer={layer} />

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Style</span>
        <Select
          value={layer.style}
          onValueChange={(v) => set("style", v as VisualizerStyle)}
        >
          <SelectTrigger size="sm" className="w-full" aria-label="Visualizer style">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISUALIZER_PRESETS.map((preset) => (
              <SelectItem key={preset.style} value={preset.style}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">Palette</span>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PALETTES.map((palette) => {
            const isActive =
              layer.primaryColor === palette.primary &&
              layer.secondaryColor === palette.secondary;
            return (
              <button
                key={palette.name}
                type="button"
                aria-label={`${palette.name} palette`}
                onClick={() =>
                  updateLayer(layer.id, {
                    primaryColor: palette.primary,
                    secondaryColor: palette.secondary,
                  })
                }
                className={cn(
                  "h-6 w-10 rounded-md border focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none",
                  isActive ? "border-primary ring-1 ring-primary" : "border-border",
                )}
                style={{
                  backgroundImage: `linear-gradient(90deg, ${palette.primary}, ${palette.secondary})`,
                }}
              />
            );
          })}
        </div>
      </div>

      <ColorField
        label="Primary"
        value={layer.primaryColor}
        onChange={(v) => set("primaryColor", v)}
      />
      <ColorField
        label="Secondary"
        value={layer.secondaryColor}
        onChange={(v) => set("secondaryColor", v)}
      />
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Blend colors</span>
        <Switch
          checked={layer.useGradient}
          onCheckedChange={(checked) => set("useGradient", checked)}
          aria-label="Blend colors"
        />
      </div>

      <PositionSection layer={layer} />
      <PropertySlider
        label="Size"
        value={Math.round(layer.size * 100)}
        min={10}
        max={150}
        unit="%"
        onChange={(v) => set("size", v / 100)}
      />
      <PropertySlider
        label="Sensitivity"
        value={Math.round(layer.sensitivity * 100)}
        min={10}
        max={300}
        unit="%"
        onChange={(v) => set("sensitivity", v / 100)}
      />
      <PropertySlider
        label="Smoothing"
        value={Math.round(layer.smoothing * 100)}
        min={0}
        max={95}
        unit="%"
        onChange={(v) => set("smoothing", v / 100)}
      />
      <PropertySlider
        label="Bars"
        value={layer.barCount}
        min={8}
        max={128}
        onChange={(v) => set("barCount", Math.round(v))}
      />
      <PropertySlider
        label="Glow"
        value={layer.glow}
        min={0}
        max={100}
        onChange={(v) => set("glow", v)}
      />
      <PropertySlider
        label="Rotation"
        value={layer.rotation}
        min={-180}
        max={180}
        unit="°"
        onChange={(v) => set("rotation", v)}
      />
    </div>
  );
}
