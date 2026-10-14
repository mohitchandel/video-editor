"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clapperboard, Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASPECT_RATIOS, EXPORT_RESOLUTIONS } from "@/config/editor-config";
import { useVideoExport } from "@/hooks/use-video-export";
import { formatTime } from "@/lib/audio/audio-utils";
import { getSupportedExportFormats } from "@/lib/export/export-utils";
import { useProjectStore } from "@/stores/project-store";

export function ExportDialog() {
  const [open, setOpen] = useState(false);
  const [formatId, setFormatId] = useState<string | null>(null);
  const [resolutionId, setResolutionId] = useState<string>("1080");
  const { state, startExport, cancelExport, resetExport } = useVideoExport();

  const project = useProjectStore((s) => s.project);
  const formats = useMemo(() => getSupportedExportFormats(), []);
  const format =
    formats.find((f) => f.id === formatId) ?? formats[0] ?? null;
  const resolution =
    EXPORT_RESOLUTIONS.find((r) => r.id === resolutionId) ??
    EXPORT_RESOLUTIONS[1];

  const ratio = ASPECT_RATIOS[project.aspectRatio];
  const outW = Math.round((ratio.width * resolution.scale) / 2) * 2;
  const outH = Math.round((ratio.height * resolution.scale) / 2) * 2;
  const exporting = state.phase === "exporting";
  const audioCount = project.audioClips.length;
  const hasContent = audioCount > 0 || project.layers.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (exporting) return; // Cancel explicitly instead of closing away.
        setOpen(next);
        if (!next) resetExport();
      }}
    >
      <DialogTrigger
        render={
          <Button size="sm" className="ml-1">
            <Download aria-hidden /> Export Video
          </Button>
        }
      />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export video</DialogTitle>
          <DialogDescription>
            Rendered in your browser in real time ({formatTime(project.duration)}
            ) — your files never leave this device.
          </DialogDescription>
        </DialogHeader>

        {formats.length === 0 ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            This browser can&apos;t record video. Try a recent version of
            Chrome, Edge, Firefox, or Safari.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Format</span>
                <Select
                  value={format?.id ?? ""}
                  onValueChange={(v) => setFormatId(v as string)}
                  disabled={exporting}
                >
                  <SelectTrigger size="sm" className="w-full" aria-label="Format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formats.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-muted-foreground">Resolution</span>
                <Select
                  value={resolutionId}
                  onValueChange={(v) => setResolutionId(v as string)}
                  disabled={exporting}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-full"
                    aria-label="Resolution"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPORT_RESOLUTIONS.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Output: {outW} × {outH} · 30 fps
              {audioCount === 1
                ? ` · audio from “${project.audioClips[0].name}”`
                : audioCount > 1
                  ? ` · ${audioCount} audio clips mixed`
                  : " · no audio track"}
            </p>

            {!hasContent ? (
              <p className="rounded-md border bg-elevated px-3 py-2 text-xs text-muted-foreground">
                The project is empty — add audio, a visualizer, or some layers
                before exporting.
              </p>
            ) : null}

            {exporting ? (
              <div className="flex flex-col gap-1.5" role="status">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                    style={{ width: `${Math.round(state.progress * 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Recording {Math.round(state.progress * 100)}% — keep this tab
                  focused and audible; the export plays through in real time.
                </p>
              </div>
            ) : null}

            {state.phase === "done" ? (
              <p className="flex items-center gap-1.5 text-xs text-track-background">
                <CheckCircle2 className="size-4" aria-hidden /> Export complete —
                check your downloads.
              </p>
            ) : null}
            {state.phase === "error" && state.error ? (
              <p className="flex items-center gap-1.5 text-xs text-destructive" role="alert">
                <XCircle className="size-4 shrink-0" aria-hidden /> {state.error}
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter>
          {exporting ? (
            <Button variant="outline" onClick={cancelExport}>
              Cancel export
            </Button>
          ) : (
            <Button
              disabled={!format || !hasContent}
              onClick={() => format && void startExport(format, resolution.scale)}
            >
              <Clapperboard aria-hidden /> Start export
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
