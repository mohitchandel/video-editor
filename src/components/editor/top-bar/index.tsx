"use client";

import { useState } from "react";
import {
  FilePlus2,
  MonitorPlay,
  Redo2,
  Settings2,
  Trash2,
  Undo2,
} from "lucide-react";
import { AppLogo } from "@/components/common/app-logo";
import { IconButton } from "@/components/common/icon-button";
import { ExportDialog } from "@/components/editor/export";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASPECT_RATIOS, PREVIEW_ZOOM_LEVELS } from "@/config/editor-config";
import { useEditorHistory } from "@/hooks/use-editor-history";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { clearAssets } from "@/lib/media/media-registry";
import { createDefaultProject } from "@/lib/project/project-defaults";
import type { AspectRatio } from "@/lib/project/project-schema";
import { clearSavedProjects } from "@/lib/project/project-storage";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

export function TopBar() {
  const projectName = useProjectStore((s) => s.project.name);
  const aspectRatio = useProjectStore((s) => s.project.aspectRatio);
  const update = useProjectStore((s) => s.update);
  const replaceProject = useProjectStore((s) => s.replaceProject);
  const previewZoom = useEditorStore((s) => s.previewZoom);
  const setPreviewZoom = useEditorStore((s) => s.setPreviewZoom);
  const select = useEditorStore((s) => s.select);
  const { undo, redo, canUndo, canRedo } = useEditorHistory();
  const [confirmNew, setConfirmNew] = useState(false);

  const startNewProject = () => {
    getAudioEngine().unload();
    clearAssets();
    replaceProject(createDefaultProject());
    select(null);
    setConfirmNew(false);
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-card px-3">
      <AppLogo />
      <div className="mx-2 h-5 w-px bg-border" aria-hidden />

      <input
        value={projectName}
        onChange={(e) =>
          update((d) => {
            d.name = e.target.value || "Untitled project";
          }, { coalesceKey: "project-name" })
        }
        aria-label="Project name"
        spellCheck={false}
        className="h-7 w-44 rounded-md border border-transparent bg-transparent px-2 text-sm outline-none transition-colors hover:border-input focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      />

      <IconButton label="New project" onClick={() => setConfirmNew(true)}>
        <FilePlus2 aria-hidden />
      </IconButton>

      <div className="mx-1 h-5 w-px bg-border" aria-hidden />
      <IconButton label="Undo (⌘Z)" disabled={!canUndo} onClick={undo}>
        <Undo2 aria-hidden />
      </IconButton>
      <IconButton label="Redo (⇧⌘Z)" disabled={!canRedo} onClick={redo}>
        <Redo2 aria-hidden />
      </IconButton>

      <div className="flex-1" />

      <Select
        value={aspectRatio}
        onValueChange={(value) =>
          update((d) => {
            d.aspectRatio = value as AspectRatio;
          })
        }
      >
        <SelectTrigger size="sm" aria-label="Aspect ratio" className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ratio) => (
            <SelectItem key={ratio} value={ratio}>
              {ASPECT_RATIOS[ratio].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={previewZoom === null ? "fit" : String(previewZoom)}
        onValueChange={(value) =>
          setPreviewZoom(value === "fit" ? null : Number(value))
        }
      >
        <SelectTrigger size="sm" aria-label="Preview zoom" className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fit">Fit</SelectItem>
          {PREVIEW_ZOOM_LEVELS.map((zoom) => (
            <SelectItem key={zoom} value={String(zoom)}>
              {Math.round(zoom * 100)}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Settings"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings2 aria-hidden />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Local data</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              void clearSavedProjects();
            }}
          >
            <Trash2 aria-hidden /> Clear saved projects
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="font-normal text-muted-foreground">
            Your media never leaves this device.
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog />

      <Dialog open={confirmNew} onOpenChange={setConfirmNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Start a new project?</DialogTitle>
            <DialogDescription>
              The current project, its media, and its undo history will be
              discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmNew(false)}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={startNewProject}>
              <MonitorPlay aria-hidden /> New project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
