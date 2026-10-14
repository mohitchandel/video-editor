"use client";

import { Music2, Trash2, Volume2, VolumeX } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FileDropzone } from "@/components/common/file-dropzone";
import { IconButton } from "@/components/common/icon-button";
import { UploadErrorList } from "@/components/editor/media";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { formatFileSize, formatTime } from "@/lib/audio/audio-utils";
import { audioClipLength } from "@/lib/project/project-schema";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "cn";

/** Upload songs and manage the clips on the timeline. */
export function AudioPanel() {
  const clips = useProjectStore((s) => s.project.audioClips);
  const assets = useProjectStore((s) => s.project.assets);
  const updateAudioClip = useProjectStore((s) => s.updateAudioClip);
  const select = useEditorStore((s) => s.select);
  const selection = useEditorStore((s) => s.selection);
  const { uploadAudio, removeAudioClip, errors, isUploading } = useMediaUpload();

  const sorted = [...clips].sort((a, b) => a.start - b.start);

  return (
    <div className="flex flex-col gap-3 p-3">
      <FileDropzone
        label={clips.length ? "Add more audio" : "Upload audio"}
        hint="MP3, WAV, OGG, FLAC or M4A — add several to mix them"
        accept="audio/*"
        multiple
        onFiles={(files) => void uploadAudio(files)}
      />
      <UploadErrorList errors={errors} />
      {isUploading ? (
        <p className="text-xs text-muted-foreground" role="status">
          Decoding audio…
        </p>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          icon={Music2}
          title="No audio yet"
          hint="Add a song to unlock audio-reactive visualizers and set the video length. New clips line up after the last one; drag them on the timeline to rearrange or overlap."
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((clip) => {
            const asset = assets.find((a) => a.id === clip.assetId);
            const active = selection?.type === "audio" && selection.id === clip.id;
            return (
              <li
                key={clip.id}
                className={cn(
                  "flex items-center gap-1 rounded-lg border pr-1.5 transition-colors",
                  active && "border-primary/60 bg-primary/10",
                  clip.muted && "opacity-60",
                )}
              >
                <button
                  type="button"
                  onClick={() => select({ type: "audio", id: clip.id })}
                  className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-2.5 text-left hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-track-audio/15 text-track-audio">
                    <Music2 className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">{clip.name}</span>
                    <span className="block font-mono text-[11px] text-muted-foreground">
                      {formatTime(clip.start)} → {formatTime(clip.start + audioClipLength(clip))}
                      {asset ? ` · ${formatFileSize(asset.size)}` : ""}
                    </span>
                  </span>
                </button>
                <IconButton
                  label={clip.muted ? "Unmute clip" : "Mute clip"}
                  onClick={() =>
                    updateAudioClip(clip.id, { muted: !clip.muted }, { coalesceKey: `mute:${clip.id}` })
                  }
                >
                  {clip.muted ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
                </IconButton>
                <IconButton label="Remove clip" onClick={() => removeAudioClip(clip.id)}>
                  <Trash2 aria-hidden />
                </IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
