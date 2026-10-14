"use client";

import { useEffect } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { useProjectStore } from "@/stores/project-store";

/** Stable accessor for the shared engine. */
export function useAudioEngine() {
  return getAudioEngine();
}

/** Keeps the engine's silent-mode duration in sync with the project. */
export function useSyncEngineDuration() {
  const duration = useProjectStore((s) => s.project.duration);
  const hasAudio = useProjectStore((s) => s.project.audio !== null);
  useEffect(() => {
    if (!hasAudio) getAudioEngine().setSilentDuration(duration);
  }, [duration, hasAudio]);
}
