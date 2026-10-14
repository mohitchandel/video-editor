"use client";

import { PanelHeader } from "@/components/common/panel-header";
import { AudioPanel } from "@/components/editor/audio";
import { BackgroundPicker } from "@/components/editor/backgrounds";
import { EffectsPanel } from "@/components/editor/effects";
import { LayersPanel } from "@/components/editor/layers-panel";
import { MediaPanel } from "@/components/editor/media";
import { TextPanel } from "@/components/editor/text-editor";
import { VisualizerPicker } from "@/components/editor/visualizers";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEditorStore } from "@/stores/editor-store";
import type { ToolId } from "@/types/editor";

const PANEL_TITLES: Record<ToolId, string> = {
  select: "Layers",
  audio: "Audio",
  media: "Media",
  text: "Text",
  visualizers: "Visualizers",
  backgrounds: "Backgrounds",
  effects: "Effects",
};

function PanelBody({ tool }: { tool: ToolId }) {
  switch (tool) {
    case "select":
      return <LayersPanel />;
    case "audio":
      return <AudioPanel />;
    case "media":
      return <MediaPanel />;
    case "text":
      return <TextPanel />;
    case "visualizers":
      return <VisualizerPicker />;
    case "backgrounds":
      return <BackgroundPicker />;
    case "effects":
      return <EffectsPanel />;
  }
}

export function AssetsPanel() {
  const tool = useEditorStore((s) => s.tool);
  const open = useEditorStore((s) => s.assetsPanelOpen);
  if (!open) return null;

  return (
    <aside
      aria-label={`${PANEL_TITLES[tool]} panel`}
      className="flex min-h-0 w-64 shrink-0 flex-col border-r bg-card max-lg:w-56"
    >
      <PanelHeader title={PANEL_TITLES[tool]} />
      <ScrollArea className="min-h-0 flex-1">
        <PanelBody tool={tool} />
      </ScrollArea>
    </aside>
  );
}
