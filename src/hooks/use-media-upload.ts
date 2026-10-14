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

  const uploadAudio = useCallback(
    async (file: File) => {
      const problem = validate(file, "audio");
      if (problem) {
        setErrors([{ fileName: file.name, message: problem }]);
        return false;
      }
      setIsUploading(true);
      setErrors([]);
      try {
        const buffer = await file.arrayBuffer();
        const { duration } = await getAudioEngine().load(buffer);
        const id = createId("ast");
        registerAsset(id, file);
        const previousAudioAsset = useProjectStore.getState().project.audio?.assetId;
        update((draft) => {
          if (previousAudioAsset) {
            draft.assets = draft.assets.filter((a) => a.id !== previousAudioAsset);
          }
          draft.assets.push({
            id,
            kind: "audio",
            name: file.name,
            mimeType: file.type || "audio/unknown",
            size: file.size,
          });
          draft.audio = { assetId: id, name: file.name, duration, volume: 1 };
          draft.duration = duration;
        });
        if (previousAudioAsset) revokeAsset(previousAudioAsset);
        return true;
      } catch {
        setErrors([
          {
            fileName: file.name,
            message: "Could not decode this audio file in your browser.",
          },
        ]);
        return false;
      } finally {
        setIsUploading(false);
      }
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
      const wasAudio =
        useProjectStore.getState().project.audio?.assetId === assetId;
      update((draft) => {
        draft.assets = draft.assets.filter((a) => a.id !== assetId);
        draft.layers = draft.layers.filter(
          (l) => !(l.kind === "image" && l.assetId === assetId),
        );
        if (draft.background.assetId === assetId) {
          draft.background.assetId = null;
          if (draft.background.type === "image") draft.background.type = "solid";
        }
        if (draft.audio?.assetId === assetId) {
          draft.audio = null;
        }
      });
      if (wasAudio) getAudioEngine().unload();
      revokeAsset(assetId);
    },
    [update],
  );

  const removeAudio = useCallback(() => {
    const audio = useProjectStore.getState().project.audio;
    if (!audio) return;
    getAudioEngine().unload();
    update((draft) => {
      draft.assets = draft.assets.filter((a) => a.id !== audio.assetId);
      draft.audio = null;
    });
    revokeAsset(audio.assetId);
  }, [update]);

  const clearErrors = useCallback(() => setErrors([]), []);

  return {
    isUploading,
    errors,
    clearErrors,
    uploadAudio,
    uploadImages,
    removeAsset,
    removeAudio,
  };
}
