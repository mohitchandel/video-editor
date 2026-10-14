"use client";

import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Scissors,
  Trash2,
  Volume2,
  VolumeX,
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
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { audioClipLength } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

export type MenuTarget =
  | { type: "layer"; id: string }
  | { type: "audio"; id: string }
  | { type: "background" };

type LayerContextMenuProps = {
  target: MenuTarget;
  children: ReactNode;
  triggerClassName?: string;
};

function LayerItems({ id }: { id: string }) {
  const layers = useProjectStore((s) => s.project.layers);
  const updateLayer = useProjectStore((s) => s.updateLayer);
  const removeLayer = useProjectStore((s) => s.removeLayer);
  const duplicateLayer = useProjectStore((s) => s.duplicateLayer);
  const moveLayer = useProjectStore((s) => s.moveLayer);
  const select = useEditorStore((s) => s.select);
  const index = layers.findIndex((l) => l.id === id);
  const layer = index >= 0 ? layers[index] : null;
  if (!layer) return null;
  return (
    <>
      <ContextMenuItem
        disabled={index >= layers.length - 1}
        onClick={() => moveLayer(layer.id, 1)}
      >
        <ArrowUp aria-hidden /> Bring forward
      </ContextMenuItem>
      <ContextMenuItem disabled={index <= 0} onClick={() => moveLayer(layer.id, -1)}>
        <ArrowDown aria-hidden /> Send backward
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        onClick={() => {
          const copyId = duplicateLayer(layer.id);
          if (copyId) select({ type: "layer", id: copyId });
        }}
      >
        <Copy aria-hidden /> Duplicate
      </ContextMenuItem>
      <ContextMenuItem onClick={() => updateLayer(layer.id, { visible: !layer.visible })}>
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
  );
}

function AudioItems({ id }: { id: string }) {
  const clip = useProjectStore((s) => s.project.audioClips.find((c) => c.id === id));
  const updateAudioClip = useProjectStore((s) => s.updateAudioClip);
  const removeAudioClip = useProjectStore((s) => s.removeAudioClip);
  const splitAudioClip = useProjectStore((s) => s.splitAudioClip);
  const duplicateAudioClip = useProjectStore((s) => s.duplicateAudioClip);
  const select = useEditorStore((s) => s.select);
  if (!clip) return null;
  const playhead = getAudioEngine().getCurrentTime();
  const canSplit =
    playhead > clip.start + 0.25 && playhead < clip.start + audioClipLength(clip) - 0.25;
  return (
    <>
      <ContextMenuItem
        disabled={!canSplit}
        onClick={() => {
          const rightId = splitAudioClip(clip.id, getAudioEngine().getCurrentTime());
          if (rightId) select({ type: "audio", id: rightId });
        }}
      >
        <Scissors aria-hidden /> Split at playhead
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => {
          const copyId = duplicateAudioClip(clip.id);
          if (copyId) select({ type: "audio", id: copyId });
        }}
      >
        <Copy aria-hidden /> Duplicate after
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => updateAudioClip(clip.id, { muted: !clip.muted }, { coalesceKey: `mute:${clip.id}` })}
      >
        {clip.muted ? <Volume2 aria-hidden /> : <VolumeX aria-hidden />}
        {clip.muted ? "Unmute" : "Mute"}
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        variant="destructive"
        onClick={() => {
          removeAudioClip(clip.id);
          select(null);
        }}
      >
        <Trash2 aria-hidden /> Delete
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </>
  );
}

function BackgroundItems() {
  return (
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
  );
}

/**
 * Right-click actions for a layer, an audio clip, or the background. Shared
 * by the preview canvas (target hit-tested on right-click) and timeline clips.
 */
export function LayerContextMenu({ target, children, triggerClassName }: LayerContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className={triggerClassName}>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {target.type === "layer" ? (
          <LayerItems id={target.id} />
        ) : target.type === "audio" ? (
          <AudioItems id={target.id} />
        ) : (
          <BackgroundItems />
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
