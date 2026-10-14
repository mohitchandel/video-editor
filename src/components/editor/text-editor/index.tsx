"use client";

import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createTextLayer } from "@/lib/project/project-defaults";
import type { TextLayer } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

interface TextPreset {
  name: string;
  sample: string;
  patch: Partial<TextLayer>;
}

const TEXT_PRESETS: TextPreset[] = [
  {
    name: "Title",
    sample: "Song Title",
    patch: { fontSize: 120, fontWeight: 800, y: 0.42 },
  },
  {
    name: "Artist",
    sample: "Artist Name",
    patch: { fontSize: 56, fontWeight: 500, y: 0.56, color: "#c9c9d6" },
  },
  {
    name: "Neon",
    sample: "NEON",
    patch: {
      fontSize: 110,
      fontWeight: 800,
      color: "#b79cff",
      glow: 60,
      letterSpacing: 8,
    },
  },
  {
    name: "Outline",
    sample: "OUTLINE",
    patch: {
      fontSize: 110,
      fontWeight: 800,
      color: "#12121700",
      outlineColor: "#ffffff",
      outlineWidth: 3,
      letterSpacing: 6,
    },
  },
  {
    name: "Gradient",
    sample: "Gradient",
    patch: {
      fontSize: 110,
      fontWeight: 800,
      gradient: { from: "#7c5cff", to: "#4cc2ff" },
    },
  },
  {
    name: "Caption",
    sample: "visualized with wavecraft",
    patch: { fontSize: 36, fontWeight: 400, y: 0.92, color: "#9a9aad" },
  },
];

export function TextPanel() {
  const addLayer = useProjectStore((s) => s.addLayer);
  const select = useEditorStore((s) => s.select);

  const addText = (preset?: TextPreset) => {
    const layer = {
      ...createTextLayer(preset?.sample ?? "Your text"),
      ...(preset?.patch ?? {}),
    };
    if (preset) layer.name = preset.sample;
    addLayer(layer);
    select({ type: "layer", id: layer.id });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <Button onClick={() => addText()} className="w-full" size="sm">
        <Type aria-hidden /> Add text
      </Button>
      <p className="text-[11px] text-muted-foreground">Presets</p>
      <ul className="flex flex-col gap-2">
        {TEXT_PRESETS.map((preset) => (
          <li key={preset.name}>
            <button
              type="button"
              onClick={() => addText(preset)}
              className="flex w-full items-center justify-between rounded-lg border bg-elevated px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <span
                className="truncate"
                style={{
                  fontWeight: preset.patch.fontWeight ?? 700,
                  letterSpacing: preset.patch.letterSpacing
                    ? `${preset.patch.letterSpacing / 8}px`
                    : undefined,
                  color:
                    preset.patch.gradient || preset.name === "Outline"
                      ? undefined
                      : preset.patch.color,
                  fontSize: 13,
                  textShadow: preset.patch.glow
                    ? "0 0 10px #b79cff"
                    : undefined,
                  WebkitTextStroke:
                    preset.name === "Outline" ? "0.6px #fff" : undefined,
                  backgroundImage: preset.patch.gradient
                    ? `linear-gradient(90deg, ${preset.patch.gradient.from}, ${preset.patch.gradient.to})`
                    : undefined,
                  WebkitBackgroundClip: preset.patch.gradient
                    ? "text"
                    : undefined,
                  WebkitTextFillColor: preset.patch.gradient
                    ? "transparent"
                    : preset.name === "Outline"
                      ? "transparent"
                      : undefined,
                }}
              >
                {preset.sample}
              </span>
              <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">
                {preset.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { TextProperties } from "./text-properties";
