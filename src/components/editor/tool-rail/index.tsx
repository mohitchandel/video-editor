"use client";

import {
  AudioLines,
  Image as ImageIcon,
  MousePointer2,
  Paintbrush,
  Sparkles,
  Type,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { useEditorStore } from "@/stores/editor-store";
import type { ToolId } from "@/types/editor";

const TOOLS: Array<{ id: ToolId; label: string; icon: LucideIcon }> = [
  { id: "select", label: "Layers", icon: MousePointer2 },
  { id: "audio", label: "Audio", icon: AudioLines },
  { id: "media", label: "Media", icon: ImageIcon },
  { id: "text", label: "Text", icon: Type },
  { id: "visualizers", label: "Visualizers", icon: Waves },
  { id: "backgrounds", label: "Backgrounds", icon: Paintbrush },
  { id: "effects", label: "Effects", icon: Sparkles },
];

export function ToolRail() {
  const tool = useEditorStore((s) => s.tool);
  const panelOpen = useEditorStore((s) => s.assetsPanelOpen);
  const setTool = useEditorStore((s) => s.setTool);
  const togglePanel = useEditorStore((s) => s.toggleAssetsPanel);

  return (
    <nav
      aria-label="Editor tools"
      className="flex w-12 shrink-0 flex-col items-center gap-1 border-r bg-card py-2"
    >
      {TOOLS.map(({ id, label, icon: Icon }) => (
        <IconButton
          key={id}
          label={label}
          tooltipSide="right"
          active={tool === id && panelOpen}
          onClick={() => {
            // Clicking the active tool collapses/expands its panel.
            if (tool === id) togglePanel();
            else setTool(id);
          }}
        >
          <Icon aria-hidden />
        </IconButton>
      ))}
    </nav>
  );
}
