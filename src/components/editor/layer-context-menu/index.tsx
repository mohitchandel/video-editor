"use client";

import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Wallpaper,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

type LayerContextMenuProps = {
  /** Layer the menu acts on; null shows background actions instead. */
  layerId: string | null;
  children: ReactNode;
  triggerClassName?: string;
};

/**
 * Right-click actions for a layer. Shared by the preview canvas (where the
 * target is hit-tested on right-click) and timeline clips.
 */
export function LayerContextMenu({
  layerId,
  children,
  triggerClassName,
}: LayerContextMenuProps) {
  const layers = useProjectStore((s) => s.project.layers);
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);
  const duplicateLayer = useProjectStore((s) => s.duplicateLayer);
  const moveLayer = useProjectStore((s) => s.moveLayer);
  const select = useEditorStore((s) => s.select);

  const index = layers.findIndex((l) => l.id === layerId);
  const layer = index >= 0 ? layers[index] : null;

  return (
    <ContextMenu>
      <ContextMenuTrigger className={triggerClassName}>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {layer ? (
          <>
            <ContextMenuItem
              disabled={index >= layers.length - 1}
              onClick={() => moveLayer(layer.id, 1)}
            >
              <ArrowUp aria-hidden /> Bring forward
            </ContextMenuItem>
            <ContextMenuItem
              disabled={index <= 0}
              onClick={() => moveLayer(layer.id, -1)}
            >
              <ArrowDown aria-hidden /> Send backward
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                const id = duplicateLayer(layer.id);
                if (id) select({ type: "layer", id });
              }}
            >
              <Copy aria-hidden /> Duplicate
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => updateLayer(layer.id, { visible: !layer.visible })}
            >
              {layer.visible ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {layer.visible ? "Hide" : "Show"}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => {
                removeLayer(layer.id);
                select(null);
              }}
            >
              <Trash2 aria-hidden /> Delete
              <ContextMenuShortcut>⌫</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        ) : (
          <ContextMenuItem
            onClick={() => {
              // Open both places the background can be edited from.
              const editor = useEditorStore.getState();
              editor.select({ type: "background" });
              editor.setTool("backgrounds");
              if (!editor.inspectorOpen) editor.toggleInspector();
            }}
          >
            <Wallpaper aria-hidden /> Edit background
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
