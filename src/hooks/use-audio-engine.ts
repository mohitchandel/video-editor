"use client";

import { useEffect } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { useProjectStore } from "@/stores/project-store";

/** Stable accessor for the shared engine. */
export function useAudioEngine() {
  return getAudioEngine();
}

/**
 * Keeps the engine in sync with the project: silent-mode duration when there
 * is no audio, and the trim window when there is.
 */
export function useSyncEngineDuration() {
  const duration = useProjectStore((s) => s.project.duration);
  const hasAudio = useProjectStore((s) => s.project.audio !== null);
  const trimStart = useProjectStore((s) => s.project.audio?.trimStart ?? 0);
  const trimEnd = useProjectStore((s) => s.project.audio?.trimEnd ?? null);
  useEffect(() => {
    if (!hasAudio) getAudioEngine().setSilentDuration(duration);
  }, [duration, hasAudio]);
  useEffect(() => {
    if (hasAudio) getAudioEngine().setTrim(trimStart, trimEnd);
  }, [hasAudio, trimStart, trimEnd]);
}
