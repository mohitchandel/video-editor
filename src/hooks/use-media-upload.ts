"use client";

import { useCallback, useState } from "react";
import {
  ACCEPTED_AUDIO_TYPES,
  ACCEPTED_IMAGE_TYPES,
  MAX_AUDIO_FILE_MB,
  MAX_IMAGE_FILE_MB,
} from "@/config/editor-config";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { registerAsset, revokeAsset } from "@/lib/media/media-registry";
import { createId } from "@/lib/project/project-defaults";
import { audioClipsEnd } from "@/lib/project/project-schema";
import { useProjectStore } from "@/stores/project-store";

export interface UploadError {
  fileName: string;
  message: string;
}

function validate(
  file: File,
  kind: "audio" | "image",
): string | null {
  const accepted = kind === "audio" ? ACCEPTED_AUDIO_TYPES : ACCEPTED_IMAGE_TYPES;
  const maxMb = kind === "audio" ? MAX_AUDIO_FILE_MB : MAX_IMAGE_FILE_MB;
  if (file.type && !accepted.includes(file.type)) {
    return `Unsupported ${kind} format (${file.type || "unknown"}).`;
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File is larger than ${maxMb} MB.`;
  }
  return null;
}

export function useMediaUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const update = useProjectStore((s) => s.update);

  /**
   * Decodes each file and appends it as a clip after the last one on the
   * timeline, so several songs line up back to back and can be rearranged.
   */
  const uploadAudio = useCallback(
    async (files: File[]) => {
      const nextErrors: UploadError[] = [];
      const added: string[] = [];
      setIsUploading(true);
      setErrors([]);
      for (const file of files) {
        const problem = validate(file, "audio");
        if (problem) {
          nextErrors.push({ fileName: file.name, message: problem });
          continue;
        }
        const assetId = createId("ast");
        try {
          const buffer = await file.arrayBuffer();
          const { duration } = await getAudioEngine().load(assetId, buffer);
          registerAsset(assetId, file);
          const clipId = createId("aud");
          update((draft) => {
            draft.assets.push({
              id: assetId,
              kind: "audio",
              name: file.name,
              mimeType: file.type || "audio/unknown",
              size: file.size,
            });
            draft.audioClips.push({
              id: clipId,
              assetId,
              name: file.name,
              duration,
              start: audioClipsEnd(draft.audioClips),
              trimStart: 0,
              trimEnd: null,
              volume: 1,
              muted: false,
            });
            draft.duration = audioClipsEnd(draft.audioClips);
          });
          added.push(clipId);
        } catch {
          nextErrors.push({
            fileName: file.name,
            message: "Could not decode this audio file in your browser.",
          });
        }
      }
      setErrors(nextErrors);
      setIsUploading(false);
      return added;
    },
    [update],
  );

  const uploadImages = useCallback(
    async (files: File[]) => {
      const nextErrors: UploadError[] = [];
      const added: string[] = [];
      for (const file of files) {
        const problem = validate(file, "image");
        if (problem) {
          nextErrors.push({ fileName: file.name, message: problem });
          continue;
        }
        const id = createId("ast");
        registerAsset(id, file);
        added.push(id);
        update((draft) => {
          draft.assets.push({
            id,
            kind: "image",
            name: file.name,
            mimeType: file.type || "image/unknown",
            size: file.size,
          });
        });
      }
      setErrors(nextErrors);
      return added;
    },
    [update],
  );

  const removeAsset = useCallback(
    (assetId: string) => {
      update((draft) => {
        draft.assets = draft.assets.filter((a) => a.id !== assetId);
        draft.layers = draft.layers.filter(
          (l) => !(l.kind === "image" && l.assetId === assetId),
        );
        for (const bg of [
          draft.background,
          ...draft.backgroundChanges.map((c) => c.background),
        ]) {
          if (bg.assetId === assetId) {
            bg.assetId = null;
            if (bg.type === "image") bg.type = "solid";
          }
        }
        draft.audioClips = draft.audioClips.filter((c) => c.assetId !== assetId);
        if (draft.audioClips.length > 0) {
          draft.duration = audioClipsEnd(draft.audioClips);
        }
      });
      getAudioEngine().unload(assetId);
      revokeAsset(assetId);
    },
    [update],
  );

  /** Removes one clip; its file is dropped too once no other clip uses it. */
  const removeAudioClip = useCallback(
    (clipId: string) => {
      const { project, removeAudioClip: remove } = useProjectStore.getState();
      const clip = project.audioClips.find((c) => c.id === clipId);
      if (!clip) return;
      remove(clipId);
      const stillUsed = useProjectStore
        .getState()
        .project.audioClips.some((c) => c.assetId === clip.assetId);
      if (!stillUsed) {
        update((draft) => {
          draft.assets = draft.assets.filter((a) => a.id !== clip.assetId);
        });
        getAudioEngine().unload(clip.assetId);
        revokeAsset(clip.assetId);
      }
    },
    [update],
  );

  const clearErrors = useCallback(() => setErrors([]), []);

  return {
    isUploading,
    errors,
    clearErrors,
    uploadAudio,
    uploadImages,
    removeAsset,
    removeAudioClip,
  };
}
