"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import { ColorField } from "@/components/common/color-field";
import { IconButton } from "@/components/common/icon-button";
import { PropertySlider } from "@/components/common/property-slider";
import {
  LayerCommonSection,
  PositionSection,
} from "@/components/editor/inspector/layer-common";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FONT_FAMILIES } from "@/config/editor-config";
import type { TextLayer } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";

export function TextProperties({ layer }: { layer: TextLayer }) {
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const set = <K extends keyof TextLayer>(key: K, value: TextLayer[K]) =>
    updateLayer(layer.id, { [key]: value }, {
      coalesceKey: `${String(key)}:${layer.id}`,
    });

  return (
    <div className="flex flex-col gap-4">
      <LayerCommonSection layer={layer} />

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Text</span>
        <textarea
          value={layer.text}
          onChange={(e) => set("text", e.target.value)}
          rows={2}
          className="resize-none rounded-md border border-input bg-transparent px-2 py-1.5 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Font</span>
          <Select
            value={layer.fontFamily}
            onValueChange={(v) => set("fontFamily", v as string)}
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Font family">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">Weight</span>
          <Select
            value={String(layer.fontWeight)}
            onValueChange={(v) => set("fontWeight", Number(v))}
          >
            <SelectTrigger size="sm" className="w-full" aria-label="Font weight">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[300, 400, 500, 600, 700, 800, 900].map((w) => (
                <SelectItem key={w} value={String(w)}>
                  {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <PropertySlider
        label="Size"
        value={layer.fontSize}
        min={12}
        max={400}
        onChange={(v) => set("fontSize", v)}
      />
      <PropertySlider
        label="Letter spacing"
        value={layer.letterSpacing}
        min={-10}
        max={60}
        onChange={(v) => set("letterSpacing", v)}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Alignment</span>
        <span className="flex gap-0.5">
          {(
            [
              ["left", AlignLeft],
              ["center", AlignCenter],
              ["right", AlignRight],
            ] as const
          ).map(([align, Icon]) => (
            <IconButton
              key={align}
              label={`Align ${align}`}
              active={layer.align === align}
              onClick={() => set("align", align)}
            >
              <Icon aria-hidden />
            </IconButton>
          ))}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Gradient fill</span>
        <Switch
          checked={layer.gradient !== null}
          onCheckedChange={(checked) =>
            set(
              "gradient",
              checked ? { from: "#7c5cff", to: "#4cc2ff" } : null,
            )
          }
          aria-label="Gradient fill"
        />
      </div>

      {layer.gradient ? (
        <>
          <ColorField
            label="Gradient from"
            value={layer.gradient.from}
            onChange={(v) => set("gradient", { ...layer.gradient!, from: v })}
          />
          <ColorField
            label="Gradient to"
            value={layer.gradient.to}
            onChange={(v) => set("gradient", { ...layer.gradient!, to: v })}
          />
        </>
      ) : (
        <ColorField
          label="Color"
          value={layer.color}
          onChange={(v) => set("color", v)}
        />
      )}

      <PropertySlider
        label="Outline"
        value={layer.outlineWidth}
        min={0}
        max={20}
        onChange={(v) => set("outlineWidth", v)}
      />
      {layer.outlineWidth > 0 ? (
        <ColorField
          label="Outline color"
          value={layer.outlineColor}
          onChange={(v) => set("outlineColor", v)}
        />
      ) : null}

      <PropertySlider
        label="Shadow"
        value={layer.shadowBlur}
        min={0}
        max={100}
        onChange={(v) => set("shadowBlur", v)}
      />
      <PropertySlider
        label="Glow"
        value={layer.glow}
        min={0}
        max={100}
        onChange={(v) => set("glow", v)}
      />

      <PositionSection layer={layer} />
    </div>
  );
}
