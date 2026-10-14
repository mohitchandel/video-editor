"use client";

import { PropertySlider } from "@/components/common/property-slider";
import type { ImageLayer } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";
import { LayerCommonSection, PositionSection } from "./layer-common";

export function ImageProperties({ layer }: { layer: ImageLayer }) {
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const set = <K extends keyof ImageLayer>(key: K, value: ImageLayer[K]) =>
    updateLayer(layer.id, { [key]: value }, {
      coalesceKey: `${String(key)}:${layer.id}`,
    });

  return (
    <div className="flex flex-col gap-4">
      <LayerCommonSection layer={layer} />
      <PositionSection layer={layer} />
      <PropertySlider
        label="Scale"
        value={Math.round(layer.scale * 100)}
        min={5}
        max={400}
        unit="%"
        onChange={(v) => set("scale", v / 100)}
      />
      <PropertySlider
        label="Rotation"
        value={layer.rotation}
        min={-180}
        max={180}
        unit="°"
        onChange={(v) => set("rotation", v)}
      />
      <PropertySlider
        label="Corner radius"
        value={Math.round(layer.cornerRadius * 200)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => set("cornerRadius", v / 200)}
      />
      <PropertySlider
        label="Brightness"
        value={Math.round(layer.brightness * 100)}
        min={0}
        max={200}
        unit="%"
        onChange={(v) => set("brightness", v / 100)}
      />
      <PropertySlider
        label="Contrast"
        value={Math.round(layer.contrast * 100)}
        min={0}
        max={200}
        unit="%"
        onChange={(v) => set("contrast", v / 100)}
      />
      <PropertySlider
        label="Blur"
        value={layer.blur}
        min={0}
        max={100}
        onChange={(v) => set("blur", v)}
      />
    </div>
  );
}
