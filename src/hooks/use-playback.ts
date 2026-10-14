"use client";

import { useCallback, useEffect } from "react";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { usePlaybackStore } from "@/stores/playback-store";

/**
 * Wires the audio engine (the single playback clock) to the coarse playback
 * store. Mount once in the editor shell; controls can be used anywhere.
 */
export function usePlaybackSync() {
  const setPlaying = usePlaybackStore((s) => s.setPlaying);
  const setDisplayTime = usePlaybackStore((s) => s.setDisplayTime);

  useEffect(() => {
    const engine = getAudioEngine();
    const offs = [
      engine.on("play", () => setPlaying(true)),
      engine.on("pause", () => {
        setPlaying(false);
        setDisplayTime(engine.getCurrentTime());
      }),
      engine.on("ended", () => {
        setPlaying(false);
        setDisplayTime(engine.getCurrentTime());
      }),
      engine.on("seek", () => setDisplayTime(engine.getCurrentTime())),
    ];
    // Coarse readout refresh while playing; per-frame consumers use the engine.
    const interval = setInterval(() => {
      if (engine.isPlaying) setDisplayTime(engine.getCurrentTime());
    }, 200);
    return () => {
      offs.forEach((off) => off());
      clearInterval(interval);
    };
  }, [setPlaying, setDisplayTime]);
}

export function usePlaybackControls() {
  const volume = usePlaybackStore((s) => s.volume);
  const muted = usePlaybackStore((s) => s.muted);
  const setVolume = usePlaybackStore((s) => s.setVolume);
  const setMuted = usePlaybackStore((s) => s.setMuted);

  const toggle = useCallback(() => {
    const engine = getAudioEngine();
    if (engine.isPlaying) engine.pause();
    else void engine.play();
  }, []);

  const seek = useCallback((time: number) => {
    getAudioEngine().seek(time);
  }, []);

  const seekBy = useCallback((delta: number) => {
    const engine = getAudioEngine();
    engine.seek(engine.getCurrentTime() + delta);
  }, []);

  const changeVolume = useCallback(
    (value: number) => {
      setVolume(value);
      getAudioEngine().setMonitorVolume(value);
    },
    [setVolume],
  );

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    getAudioEngine().setMuted(next);
  }, [muted, setMuted]);

  return { toggle, seek, seekBy, changeVolume, toggleMute, volume, muted };
}
