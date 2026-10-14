"use client";

import { Eye, EyeOff, Trash2 } from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { PropertySlider } from "@/components/common/property-slider";
import { Input } from "@/components/ui/input";
import { clamp } from "@/lib/audio/audio-utils";
import type { Layer } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

/** Name, visibility, opacity, and clip timing — shared by every layer type. */
export function LayerCommonSection({ layer }: { layer: Layer }) {
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);
  const duration = useProjectStore((s) => s.project.duration);
  const select = useEditorStore((s) => s.select);

  const end = layer.end ?? duration;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <Input
          value={layer.name}
          onChange={(e) =>
            updateLayer(layer.id, { name: e.target.value }, {
              coalesceKey: `name:${layer.id}`,
            })
          }
          aria-label="Layer name"
          className="h-7 flex-1 text-xs"
        />
        <IconButton
          label={layer.visible ? "Hide layer" : "Show layer"}
          onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
        >
          {layer.visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
        </IconButton>
        <IconButton
          label="Delete layer"
          onClick={() => {
            removeLayer(layer.id);
            select(null);
          }}
        >
          <Trash2 aria-hidden />
        </IconButton>
      </div>

      <PropertySlider
        label="Opacity"
        value={Math.round(layer.opacity * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) =>
          updateLayer(layer.id, { opacity: v / 100 }, {
            coalesceKey: `opacity:${layer.id}`,
          })
        }
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Start (s)</span>
          <Input
            type="number"
            min={0}
            max={duration}
            step={0.1}
            value={Math.round(layer.start * 10) / 10}
            onChange={(e) => {
              const v = clamp(Number(e.target.value) || 0, 0, end - 0.1);
              updateLayer(layer.id, { start: v }, {
                coalesceKey: `start:${layer.id}`,
              });
            }}
            className="h-7 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">End (s)</span>
          <Input
            type="number"
            min={0}
            max={duration}
            step={0.1}
            value={Math.round(end * 10) / 10}
            onChange={(e) => {
              const v = clamp(
                Number(e.target.value) || 0,
                layer.start + 0.1,
                duration,
              );
              updateLayer(
                layer.id,
                { end: Math.abs(v - duration) < 0.05 ? null : v },
                { coalesceKey: `end:${layer.id}` },
              );
            }}
            className="h-7 text-xs"
          />
        </label>
      </div>
    </div>
  );
}

/** Position controls shared by layers that sit on the canvas. */
export function PositionSection({
  layer,
}: {
  layer: Extract<Layer, { x: number; y: number }>;
}) {
  const updateLayer = useProjectStore((s) => s.updateLayer);
  return (
    <div className="grid grid-cols-2 gap-2">
      <PropertySlider
        label="X"
        value={Math.round(layer.x * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) =>
          updateLayer(layer.id, { x: v / 100 }, { coalesceKey: `x:${layer.id}` })
        }
      />
      <PropertySlider
        label="Y"
        value={Math.round(layer.y * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) =>
          updateLayer(layer.id, { y: v / 100 }, { coalesceKey: `y:${layer.id}` })
        }
      />
    </div>
  );
}
