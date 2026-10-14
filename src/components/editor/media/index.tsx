"use client";

import { useState } from "react";
import { ImagePlus, Plus, Search, Trash2, Wallpaper } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FileDropzone } from "@/components/common/file-dropzone";
import { IconButton } from "@/components/common/icon-button";
import { Input } from "@/components/ui/input";
import { useMediaUpload, type UploadError } from "@/hooks/use-media-upload";
import { formatFileSize } from "@/lib/audio/audio-utils";
import { getAssetUrl } from "@/lib/media/media-registry";
import { createImageLayer } from "@/lib/project/project-defaults";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

export function UploadErrorList({ errors }: { errors: UploadError[] }) {
  if (errors.length === 0) return null;
  return (
    <ul className="flex flex-col gap-1" role="alert">
      {errors.map((err) => (
        <li
          key={`${err.fileName}-${err.message}`}
          className="rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive"
        >
          <span className="font-medium">{err.fileName}</span>: {err.message}
        </li>
      ))}
    </ul>
  );
}

export function MediaPanel() {
  const assets = useProjectStore((s) => s.project.assets);
  const addLayer = useProjectStore((s) => s.addLayer);
  const update = useProjectStore((s) => s.update);
  const select = useEditorStore((s) => s.select);
  const { uploadImages, removeAsset, errors } = useMediaUpload();
  const [query, setQuery] = useState("");

  const images = assets.filter(
    (a) =>
      a.kind === "image" &&
      a.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const addToCanvas = (assetId: string, name: string) => {
    const layer = createImageLayer(assetId, name);
    addLayer(layer);
    select({ type: "layer", id: layer.id });
  };

  const setAsBackground = (assetId: string) => {
    update((d) => {
      d.background.type = "image";
      d.background.assetId = assetId;
    });
    select({ type: "background" });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      <FileDropzone
        label="Upload images"
        hint="Album art, photos — JPG, PNG, WebP"
        accept="image/*"
        multiple
        onFiles={(files) => void uploadImages(files)}
      />
      <UploadErrorList errors={errors} />

      {assets.some((a) => a.kind === "image") ? (
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search media"
            aria-label="Search media"
            className="h-8 pl-8 text-xs"
          />
        </div>
      ) : null}

      {images.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title={query ? "No matches" : "No images yet"}
          hint={
            query
              ? "Try a different search."
              : "Upload artwork to place on the canvas or use as a background."
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {images.map((asset) => {
            const url = getAssetUrl(asset.id);
            return (
              <li
                key={asset.id}
                className="group overflow-hidden rounded-lg border bg-elevated"
              >
                <div className="relative aspect-video bg-canvas">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local object URL
                    <img
                      src={url}
                      alt={asset.name}
                      className="size-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <IconButton
                      label="Add to canvas"
                      onClick={() => addToCanvas(asset.id, asset.name)}
                      className="text-foreground"
                    >
                      <Plus aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Use as background"
                      onClick={() => setAsBackground(asset.id)}
                      className="text-foreground"
                    >
                      <Wallpaper aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Remove"
                      onClick={() => removeAsset(asset.id)}
                      className="text-foreground"
                    >
                      <Trash2 aria-hidden />
                    </IconButton>
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <p className="truncate text-[11px] font-medium">{asset.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatFileSize(asset.size)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
