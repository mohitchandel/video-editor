"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Layers,
  Trash2,
  Type,
  Waves,
} from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { IconButton } from "@/components/common/icon-button";
import type { Layer } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";

const KIND_ICON = {
  image: ImageIcon,
  text: Type,
  visualizer: Waves,
} as const;

const KIND_COLOR = {
  image: "text-track-image",
  text: "text-track-text",
  visualizer: "text-track-visualizer",
} as const;

export function LayersPanel() {
  const layers = useProjectStore((s) => s.project.layers);
  const moveLayer = useProjectStore((s) => s.moveLayer);
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);

  if (layers.length === 0) {
    return (
      <div className="p-3">
        <EmptyState
          icon={Layers}
          title="No layers yet"
          hint="Add a visualizer, text, or image from the tools on the left."
        />
      </div>
    );
  }

  const move = moveLayer;

  // Topmost layer renders last — list shows it first, like typical editors.
  const ordered = [...layers].reverse();

  return (
    <ul className="flex flex-col gap-1 p-2">
      {ordered.map((layer: Layer) => {
        const Icon = KIND_ICON[layer.kind];
        const isSelected =
          selection?.type === "layer" && selection.id === layer.id;
        return (
          <li
            key={layer.id}
            className={cn(
              "group flex items-center gap-1 rounded-md border border-transparent pr-1",
              isSelected && "border-primary/50 bg-primary/10",
            )}
          >
            <button
              type="button"
              onClick={() => select({ type: "layer", id: layer.id })}
              className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <Icon
                className={cn("size-3.5 shrink-0", KIND_COLOR[layer.kind])}
                aria-hidden
              />
              <span
                className={cn(
                  "truncate text-xs",
                  !layer.visible && "text-muted-foreground line-through",
                )}
              >
                {layer.name}
              </span>
            </button>
            <span className="flex shrink-0 items-center opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
              <IconButton
                label="Move up"
                className="size-6"
                onClick={() => move(layer.id, 1)}
              >
                <ArrowUp aria-hidden />
              </IconButton>
              <IconButton
                label="Move down"
                className="size-6"
                onClick={() => move(layer.id, -1)}
              >
                <ArrowDown aria-hidden />
              </IconButton>
              <IconButton
                label={layer.visible ? "Hide layer" : "Show layer"}
                className="size-6"
                onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
              >
                {layer.visible ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
              </IconButton>
              <IconButton
                label="Delete layer"
                className="size-6"
                onClick={() => {
                  removeLayer(layer.id);
                  if (isSelected) select(null);
                }}
              >
                <Trash2 aria-hidden />
              </IconButton>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
