"use client";

import { Trash2 } from "lucide-react";
import { ColorField } from "@/components/common/color-field";
import { PropertySlider } from "@/components/common/property-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAssetUrl } from "@/lib/media/media-registry";
import type {
  BackgroundTransition,
  ProjectBackground,
} from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

export const TRANSITION_LABELS: Record<BackgroundTransition, string> = {
  cut: "Cut (instant)",
  fade: "Cross-fade",
  "slide-left": "Slide from right",
  "slide-right": "Slide from left",
  "slide-up": "Slide up",
  zoom: "Zoom in",
};

/**
 * Edits either the base background or, when a timed change is selected, that
 * change's background plus when and how it transitions in.
 */
export function BackgroundProperties() {
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const changeId =
    selection?.type === "background" ? (selection.changeId ?? null) : null;
  const baseBackground = useProjectStore((s) => s.project.background);
  const change = useProjectStore((s) =>
    s.project.backgroundChanges.find((c) => c.id === changeId),
  );
  const assets = useProjectStore((s) => s.project.assets);
  const update = useProjectStore((s) => s.update);
  const removeBackgroundChange = useProjectStore((s) => s.removeBackgroundChange);

  const background = change ? change.background : baseBackground;

  const set = <K extends keyof ProjectBackground>(
    key: K,
    value: ProjectBackground[K],
  ) =>
    update(
      (d) => {
        const target = changeId
          ? d.backgroundChanges.find((c) => c.id === changeId)?.background
          : d.background;
        if (target) target[key] = value;
      },
      { coalesceKey: `bg:${changeId ?? "base"}:${String(key)}` },
    );

  const images = assets.filter((a) => a.kind === "image");

  return (
    <div className="flex flex-col gap-4">
      {change ? (
        <div className="flex flex-col gap-3 rounded-md border bg-elevated p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Background change</p>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Delete background change"
              onClick={() => {
                removeBackgroundChange(change.id);
                select({ type: "background" });
              }}
            >
              <Trash2 aria-hidden />
            </Button>
          </div>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Starts at (s)</span>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={Number(change.at.toFixed(2))}
              onChange={(e) => {
                const at = Math.max(0, Number(e.target.value) || 0);
                update((d) => {
                  const c = d.backgroundChanges.find((x) => x.id === change.id);
                  if (c) c.at = at;
                });
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">Transition</span>
            <Select
              value={change.transition}
              onValueChange={(v) =>
                update((d) => {
                  const c = d.backgroundChanges.find((x) => x.id === change.id);
                  if (c) c.transition = v as BackgroundTransition;
                })
              }
            >
              <SelectTrigger size="sm" className="w-full" aria-label="Transition">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TRANSITION_LABELS) as BackgroundTransition[]).map(
                  (t) => (
                    <SelectItem key={t} value={t}>
                      {TRANSITION_LABELS[t]}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </label>
          {change.transition !== "cut" ? (
            <PropertySlider
              label="Transition length"
              value={change.transitionDuration}
              min={0.1}
              max={5}
              step={0.1}
              unit="s"
              onChange={(v) =>
                update(
                  (d) => {
                    const c = d.backgroundChanges.find((x) => x.id === change.id);
                    if (c) c.transitionDuration = v;
                  },
                  { coalesceKey: `bg:${change.id}:transitionDuration` },
                )
              }
            />
          ) : null}
        </div>
      ) : null}

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
