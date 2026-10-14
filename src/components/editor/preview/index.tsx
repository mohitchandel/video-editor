"use client";

import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { IconButton } from "@/components/common/icon-button";
import { Slider } from "@/components/ui/slider";
import { usePlaybackControls } from "@/hooks/use-playback";
import { formatTime } from "@/lib/audio/audio-utils";
import { usePlaybackStore } from "@/stores/playback-store";
import { useProjectStore } from "@/stores/project-store";
import { PreviewCanvas } from "./preview-canvas";

function PlaybackControls() {
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const displayTime = usePlaybackStore((s) => s.displayTime);
  // The readout counts within the trimmed range, so it matches the video.
  const trimStart = useProjectStore((s) => s.project.audio?.trimStart ?? 0);
  const trimEnd = useProjectStore((s) =>
    s.project.audio
      ? (s.project.audio.trimEnd ?? s.project.audio.duration)
      : s.project.duration,
  );
  const { toggle, seek, seekBy, changeVolume, toggleMute, volume, muted } =
    usePlaybackControls();

  return (
    <div className="flex h-11 shrink-0 items-center gap-1.5 border-t bg-card px-3">
      <IconButton label="Back to start" onClick={() => seek(0)}>
        <RotateCcw aria-hidden />
      </IconButton>
      <IconButton label="Back 5 seconds" onClick={() => seekBy(-5)}>
        <SkipBack aria-hidden />
      </IconButton>
      <IconButton
        label={isPlaying ? "Pause (Space)" : "Play (Space)"}
        onClick={toggle}
        className="bg-primary/15 text-primary hover:bg-primary/25 hover:text-primary"
      >
        {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
      </IconButton>
      <IconButton label="Forward 5 seconds" onClick={() => seekBy(5)}>
        <SkipForward aria-hidden />
      </IconButton>

      <span className="ml-2 font-mono text-[11px] text-muted-foreground tabular-nums">
        <span className="text-foreground">
          {formatTime(Math.max(0, displayTime - trimStart))}
        </span>
        {" / "}
        {formatTime(trimEnd - trimStart)}
      </span>

      <div className="flex-1" />

      <IconButton
        label={muted ? "Unmute preview" : "Mute preview"}
        onClick={toggleMute}
      >
        {muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
      </IconButton>
      <div className="w-24">
        <Slider
          aria-label="Preview volume"
          value={Math.round(volume * 100)}
          min={0}
          max={100}
          onValueChange={(v) => {
            const value = Array.isArray(v) ? v[0] : v;
            changeVolume(value / 100);
          }}
        />
      </div>
    </div>
  );
}

export function Preview() {
  return (
    <section
      aria-label="Preview"
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <PreviewCanvas />
      <PlaybackControls />
    </section>
  );
}
