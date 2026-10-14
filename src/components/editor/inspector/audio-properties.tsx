"use client";

import { Scissors, Trash2 } from "lucide-react";
import { PropertySlider } from "@/components/common/property-slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { formatTime } from "@/lib/audio/audio-utils";
import { audioClipLength } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

/** Properties of the selected audio clip. */
export function AudioProperties() {
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const clipId = selection?.type === "audio" ? selection.id : null;
  const clip = useProjectStore((s) => s.project.audioClips.find((c) => c.id === clipId));
  const updateAudioClip = useProjectStore((s) => s.updateAudioClip);
  const splitAudioClip = useProjectStore((s) => s.splitAudioClip);
  const { removeAudioClip } = useMediaUpload();

  if (!clip) {
    return (
      <p className="text-xs text-muted-foreground">
        Select an audio clip on the timeline, or add a song from the Audio tab.
      </p>
    );
  }

  const trimEnd = clip.trimEnd ?? clip.duration;
  const length = audioClipLength(clip);
  const trimmed = clip.trimStart > 0 || clip.trimEnd !== null;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border bg-elevated px-2.5 py-2">
        <p className="truncate text-xs font-medium">{clip.name}</p>
        <p className="font-mono text-[11px] text-muted-foreground">
          {formatTime(clip.start)} → {formatTime(clip.start + length)} · file {formatTime(clip.duration)}
        </p>
      </div>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">Starts at (s)</span>
        <Input
          type="number"
          min={0}
          step={0.5}
          value={Number(clip.start.toFixed(2))}
          onChange={(e) =>
            updateAudioClip(clip.id, { start: Math.max(0, Number(e.target.value) || 0) })
          }
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Trim (in → out)</span>
          <span className="font-mono text-[11px]">
            {formatTime(clip.trimStart)} → {formatTime(trimEnd)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Drag the clip&apos;s edges on the timeline to trim it.
        </p>
        {trimmed ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateAudioClip(clip.id, { trimStart: 0, trimEnd: null })}
          >
            Reset trim
          </Button>
        ) : null}
      </div>

      <PropertySlider
        label="Clip volume"
        value={Math.round(clip.volume * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) =>
          updateAudioClip(clip.id, { volume: v / 100 }, { coalesceKey: `volume:${clip.id}` })
        }
      />
      <div className="flex items-center justify-between">
        <Label htmlFor="clip-muted" className="text-xs text-muted-foreground">
          Muted
        </Label>
        <Switch
          id="clip-muted"
          checked={clip.muted}
          onCheckedChange={(muted) =>
            updateAudioClip(clip.id, { muted }, { coalesceKey: `mute:${clip.id}` })
          }
        />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => {
            const rightId = splitAudioClip(clip.id, getAudioEngine().getCurrentTime());
            if (rightId) select({ type: "audio", id: rightId });
          }}
        >
          <Scissors aria-hidden /> Split at playhead
        </Button>
        <Button
          variant="outline"
          size="sm"
          aria-label="Delete clip"
          onClick={() => {
            removeAudioClip(clip.id);
            select(null);
          }}
        >
          <Trash2 aria-hidden />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Clip volume is baked into the exported video. Overlapping clips are
        mixed together.
      </p>
    </div>
  );
}
