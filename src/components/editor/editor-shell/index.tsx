"use client";

import { useEffect } from "react";
import { PanelRightOpen } from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { AssetsPanel } from "@/components/editor/assets-panel";
import { Inspector } from "@/components/editor/inspector";
import { Preview } from "@/components/editor/preview";
import { Timeline } from "@/components/editor/timeline";
import { ToolRail } from "@/components/editor/tool-rail";
import { TopBar } from "@/components/editor/top-bar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHistoryShortcuts } from "@/hooks/use-editor-history";
import { usePlaybackSync } from "@/hooks/use-playback";
import { useProjectPersistence } from "@/hooks/use-project-persistence";
import { useSyncEngineDuration } from "@/hooks/use-audio-engine";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

function useEditorShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (typing) return;

      if (e.key === " ") {
        e.preventDefault();
        const engine = getAudioEngine();
        if (engine.isPlaying) engine.pause();
        else void engine.play();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        const { selection, select } = useEditorStore.getState();
        if (selection?.type === "layer") {
          useProjectStore.getState().removeLayer(selection.id);
          select(null);
        } else if (selection?.type === "background" && selection.changeId) {
          useProjectStore.getState().removeBackgroundChange(selection.changeId);
          select({ type: "background" });
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export function EditorShell() {
  usePlaybackSync();
  useHistoryShortcuts();
  useEditorShortcuts();
  useSyncEngineDuration();
  useProjectPersistence();

  const inspectorOpen = useEditorStore((s) => s.inspectorOpen);
  const toggleInspector = useEditorStore((s) => s.toggleInspector);

  return (
    <TooltipProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <TopBar />
        <div className="relative flex min-h-0 flex-1">
          <ToolRail />
          {/* `flex min-h-0` bounds the panel height so its ScrollArea scrolls
              instead of the panel growing through the timeline. */}
          <div className="flex min-h-0 max-md:absolute max-md:inset-y-0 max-md:left-12 max-md:z-40 max-md:shadow-2xl">
            <AssetsPanel />
          </div>
          <Preview />
          <div className="flex min-h-0 max-md:absolute max-md:inset-y-0 max-md:right-0 max-md:z-40 max-md:shadow-2xl">
            <Inspector />
          </div>
          {!inspectorOpen ? (
            <div className="absolute top-2 right-2 z-30">
              <IconButton
                label="Show properties"
                onClick={toggleInspector}
                className="border bg-card"
              >
                <PanelRightOpen aria-hidden />
              </IconButton>
            </div>
          ) : null}
        </div>
        <Timeline />
      </div>
    </TooltipProvider>
  );
}
