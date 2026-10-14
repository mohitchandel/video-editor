"use client";

import { PanelLeftClose, SlidersHorizontal } from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { PanelHeader } from "@/components/common/panel-header";
import { TextProperties } from "@/components/editor/text-editor/text-properties";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { AudioProperties } from "./audio-properties";
import { BackgroundProperties } from "./background-properties";
import { ImageProperties } from "./image-properties";
import { VisualizerProperties } from "./visualizer-properties";

function InspectorBody() {
  const selection = useEditorStore((s) => s.selection);
  const layers = useProjectStore((s) => s.project.layers);

  if (selection?.type === "audio") return <AudioProperties />;
  if (selection?.type === "background") return <BackgroundProperties />;
  if (selection?.type === "layer") {
    const layer = layers.find((l) => l.id === selection.id);
    if (!layer) return <NothingSelected />;
    if (layer.kind === "image") return <ImageProperties layer={layer} />;
    if (layer.kind === "text") return <TextProperties layer={layer} />;
    return <VisualizerProperties layer={layer} />;
  }
  return <NothingSelected />;
}

function NothingSelected() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <SlidersHorizontal className="size-5 text-muted-foreground" aria-hidden />
      <p className="text-xs font-medium">Nothing selected</p>
      <p className="text-xs text-muted-foreground">
        Select a layer on the timeline or canvas to edit its properties.
      </p>
    </div>
  );
}

function inspectorTitle(
  selection: ReturnType<typeof useEditorStore.getState>["selection"],
): string {
  if (selection?.type === "audio") return "Audio";
  if (selection?.type === "background") return "Background";
  if (selection?.type === "layer") return "Layer";
  return "Properties";
}

export function Inspector() {
  const selection = useEditorStore((s) => s.selection);
  const open = useEditorStore((s) => s.inspectorOpen);
  const toggle = useEditorStore((s) => s.toggleInspector);

  if (!open) return null;

  return (
    <aside
      aria-label="Properties"
      className="flex w-66 shrink-0 flex-col border-l bg-card max-lg:w-60"
    >
      <PanelHeader
        title={inspectorTitle(selection)}
        actions={
          <IconButton label="Collapse panel" onClick={toggle}>
            <PanelLeftClose className="rotate-180" aria-hidden />
          </IconButton>
        }
      />
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          <InspectorBody />
        </div>
      </ScrollArea>
    </aside>
  );
}
