"use client";

import { PropertySlider } from "@/components/common/property-slider";
import { Button } from "@/components/ui/button";
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

  const trimEnd = audio.trimEnd ?? audio.duration;
  const trimmed = audio.trimStart > 0 || audio.trimEnd !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border bg-elevated px-2.5 py-2">
        <p className="truncate text-xs font-medium">{audio.name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatTime(audio.duration)}
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Trim</span>
          <span className="font-mono text-[11px]">
            {formatTime(audio.trimStart)} – {formatTime(trimEnd)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Drag the handles on the audio track to set in and out points. The
          video will be {formatTime(trimEnd - audio.trimStart)} long.
        </p>
        {trimmed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              update((d) => {
                if (!d.audio) return;
                d.audio.trimStart = 0;
                d.audio.trimEnd = null;
              })
            }
          >
            Reset trim
          </Button>
        ) : null}
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
