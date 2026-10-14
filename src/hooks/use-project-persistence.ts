"use client";

import { useEffect, useRef, useState } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { getAssetBlob, registerAsset } from "@/lib/media/media-registry";
import {
  loadLastProject,
  saveProjectLocally,
} from "@/lib/project/project-storage";
import { useProjectStore } from "@/stores/project-store";

const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Restores the last session on mount, then autosaves project + media to
 * IndexedDB (debounced). Everything stays on-device.
 */
export function useProjectPersistence() {
  const [restored, setRestored] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await loadLastProject();
        if (cancelled) return;
        if (saved) {
          for (const [id, blob] of saved.blobs) registerAsset(id, blob);
          // Decode every audio file the clips reference; drop clips whose
          // file didn't survive.
          const engine = getAudioEngine();
          const decoded = new Set<string>();
          const audioAssetIds = new Set(saved.project.audioClips.map((c) => c.assetId));
          for (const assetId of audioAssetIds) {
            const blob = saved.blobs.get(assetId);
            if (!blob) continue;
            try {
              await engine.load(assetId, await blob.arrayBuffer());
              decoded.add(assetId);
            } catch {
              // Undecodable now — treat like a missing file.
            }
          }
          saved.project.audioClips = saved.project.audioClips.filter((c) =>
            decoded.has(c.assetId),
          );
          if (!cancelled) useProjectStore.getState().replaceProject(saved.project);
        }
      } catch {
        // Restore is best-effort; a fresh project is already in place.
      } finally {
        if (!cancelled) setRestored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!restored) return;
    const unsubscribe = useProjectStore.subscribe((state, prev) => {
      if (state.project === prev.project) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        saveProjectLocally(state.project, getAssetBlob).catch(() => {
          // Storage may be full or blocked; the editor keeps working.
        });
      }, AUTOSAVE_DEBOUNCE_MS);
    });
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [restored]);

  return { restored };
}
