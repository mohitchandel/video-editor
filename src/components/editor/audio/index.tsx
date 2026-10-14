"use client";

import { Music2, RefreshCcw, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FileDropzone } from "@/components/common/file-dropzone";
import { IconButton } from "@/components/common/icon-button";
import { formatFileSize, formatTime } from "@/lib/audio/audio-utils";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";
import { UploadErrorList } from "@/components/editor/media";

export function AudioPanel() {
  const audio = useProjectStore((s) => s.project.audio);
  const assets = useProjectStore((s) => s.project.assets);
  const select = useEditorStore((s) => s.select);
  const selection = useEditorStore((s) => s.selection);
  const { uploadAudio, removeAudio, errors, isUploading } = useMediaUpload();

  const audioAsset = audio
    ? assets.find((a) => a.id === audio.assetId)
    : undefined;

  return (
    <div className="flex flex-col gap-3 p-3">
      <FileDropzone
        label={audio ? "Replace audio" : "Upload audio"}
        hint="MP3, WAV, OGG, FLAC or M4A — stays on your device"
        accept="audio/*"
        onFiles={(files) => void uploadAudio(files[0])}
      />
      <UploadErrorList errors={errors} />
      {isUploading ? (
        <p className="text-xs text-muted-foreground" role="status">
          Decoding audio…
        </p>
      ) : null}

      {audio ? (
        <div
          className={`flex items-center gap-1 rounded-lg border pr-1.5 transition-colors ${
            selection?.type === "audio" ? "border-primary/60 bg-primary/10" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => select({ type: "audio" })}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-2.5 text-left hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-track-audio/15 text-track-audio">
              <Music2 className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium">{audio.name}</span>
              <span className="block text-[11px] text-muted-foreground">
                {formatTime(audio.duration)}
                {audioAsset ? ` · ${formatFileSize(audioAsset.size)}` : ""}
              </span>
            </span>
          </button>
          <IconButton label="Remove audio" onClick={removeAudio}>
            <Trash2 aria-hidden />
          </IconButton>
        </div>
      ) : (
        <EmptyState
          icon={RefreshCcw}
          title="No audio yet"
          hint="Add a song to unlock audio-reactive visualizers and set the video length."
        />
      )}
    </div>
  );
}
