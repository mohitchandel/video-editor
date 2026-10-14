"use client";

import { useCallback, useRef, useState } from "react";
import { ExportEngine } from "@/lib/export/export-engine";
import {
  downloadBlob,
  sanitizeFilename,
  type ExportFormat,
} from "@/lib/export/export-utils";
import { getAssetImage } from "@/lib/media/media-registry";
import { useProjectStore } from "@/stores/project-store";
import { ASPECT_RATIOS, EXPORT_FPS } from "@/config/editor-config";

export type ExportPhase = "idle" | "exporting" | "done" | "error";

export interface ExportState {
  phase: ExportPhase;
  progress: number;
  error: string | null;
}

export function useVideoExport() {
  const [state, setState] = useState<ExportState>({
    phase: "idle",
    progress: 0,
    error: null,
  });
  const engineRef = useRef<ExportEngine | null>(null);

  const startExport = useCallback(
    async (format: ExportFormat, resolutionScale: number) => {
      const project = useProjectStore.getState().project;
      const base = ASPECT_RATIOS[project.aspectRatio];
      // Encoders want even dimensions.
      const width = Math.round((base.width * resolutionScale) / 2) * 2;
      const height = Math.round((base.height * resolutionScale) / 2) * 2;

      const exporter = new ExportEngine();
      engineRef.current = exporter;
      setState({ phase: "exporting", progress: 0, error: null });
      try {
        const { blob } = await exporter.export(
          project,
          { getImage: getAssetImage },
          {
            width,
            height,
            fps: EXPORT_FPS,
            mimeType: format.mimeType,
            videoBitsPerSecond: height >= 1080 ? 12_000_000 : 8_000_000,
          },
          (progress) => setState((s) => ({ ...s, progress })),
        );
        downloadBlob(
          blob,
          `${sanitizeFilename(project.name)}.${format.extension}`,
        );
        setState({ phase: "done", progress: 1, error: null });
      } catch (err) {
        setState({
          phase: "error",
          progress: 0,
          error: err instanceof Error ? err.message : "Export failed.",
        });
      } finally {
        engineRef.current = null;
      }
    },
    [],
  );

  const cancelExport = useCallback(() => {
    engineRef.current?.abort();
  }, []);

  const resetExport = useCallback(() => {
    setState({ phase: "idle", progress: 0, error: null });
  }, []);

  return { state, startExport, cancelExport, resetExport };
}
