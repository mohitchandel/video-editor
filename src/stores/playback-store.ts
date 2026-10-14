import { create } from "zustand";

/**
 * Coarse playback state for UI chrome (buttons, time readout). The engine is
 * the source of truth for time; `displayTime` is refreshed a few times per
 * second while playing — per-frame consumers (canvas, playhead) read the
 * engine clock directly instead of subscribing here.
 */
interface PlaybackStore {
  isPlaying: boolean;
  displayTime: number;
  volume: number;
  muted: boolean;

  setPlaying: (isPlaying: boolean) => void;
  setDisplayTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
}

export const usePlaybackStore = create<PlaybackStore>((set) => ({
  isPlaying: false,
  displayTime: 0,
  volume: 1,
  muted: false,

  setPlaying: (isPlaying) => set({ isPlaying }),
  setDisplayTime: (displayTime) => set({ displayTime }),
  setVolume: (volume) => set({ volume }),
  setMuted: (muted) => set({ muted }),
}));
