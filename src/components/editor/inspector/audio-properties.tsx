"use client";

import { PropertySlider } from "@/components/common/property-slider";
import { formatTime } from "@/lib/audio/audio-utils";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { useProjectStore } from "@/stores/project-store";

export function AudioProperties() {
  const audio = useProjectStore((s) => s.project.audio);
  const update = useProjectStore((s) => s.update);

  if (!audio) {
    return (
      <p className="text-xs text-muted-foreground">
        No audio loaded. Add a song from the Audio tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border bg-elevated px-2.5 py-2">
        <p className="truncate text-xs font-medium">{audio.name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatTime(audio.duration)}
        </p>
      </div>
      <PropertySlider
        label="Track volume"
        value={Math.round(audio.volume * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => {
          update(
            (d) => {
              if (d.audio) d.audio.volume = v / 100;
            },
            { coalesceKey: "audio-volume" },
          );
          getAudioEngine().setVolume(v / 100);
        }}
      />
      <p className="text-[11px] text-muted-foreground">
        Track volume is baked into the exported video. Use the mute button
        under the preview to silence playback while editing.
      </p>
    </div>
  );
}
