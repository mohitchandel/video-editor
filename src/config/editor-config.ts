import type { AspectRatio } from "@/lib/project/project-schema";

export const ASPECT_RATIOS: Record<
  AspectRatio,
  { label: string; width: number; height: number }
> = {
  "16:9": { label: "Landscape 16:9", width: 1920, height: 1080 },
  "9:16": { label: "Portrait 9:16", width: 1080, height: 1920 },
  "1:1": { label: "Square 1:1", width: 1080, height: 1080 },
};

export const PREVIEW_ZOOM_LEVELS = [0.25, 0.5, 0.75, 1] as const;

export const EXPORT_RESOLUTIONS = [
  { id: "720", label: "720p", scale: 720 / 1080 },
  { id: "1080", label: "1080p", scale: 1 },
] as const;

export const EXPORT_FPS = 30;

export const TIMELINE = {
  /** Pixels per second at zoom = 1. */
  basePxPerSecond: 40,
  zoomLevels: [0.25, 0.5, 1, 2, 4] as const,
  /** Snap increment in seconds. */
  snap: 0.5,
  trackHeight: 36,
  rulerHeight: 28,
  /** Minimum clip length in seconds when resizing. */
  minClipLength: 0.5,
};

export const MAX_AUDIO_FILE_MB = 100;
export const MAX_IMAGE_FILE_MB = 25;

export const ACCEPTED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
  "audio/x-flac",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
];

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

export const FONT_FAMILIES = [
  "Geist",
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Impact",
  "Trebuchet MS",
] as const;
