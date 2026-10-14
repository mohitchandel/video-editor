"use client";

import { useEffect } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { useProjectStore } from "@/stores/project-store";

/** Stable accessor for the shared engine. */
export function useAudioEngine() {
  return getAudioEngine();
}

/**
 * Keeps the engine in sync with the project: its length, and which clips
 * play where. Mount once in the editor shell.
 */
export function useSyncEngineDuration() {
  const duration = useProjectStore((s) => s.project.duration);
  const clips = useProjectStore((s) => s.project.audioClips);
  useEffect(() => {
    getAudioEngine().setDuration(duration);
  }, [duration]);
  useEffect(() => {
    getAudioEngine().setClips(
      clips.map((c) => ({
        id: c.id,
        assetId: c.assetId,
        start: c.start,
        trimStart: c.trimStart,
        trimEnd: c.trimEnd ?? c.duration,
        volume: c.volume,
        muted: c.muted,
      })),
    );
  }, [clips]);
}
