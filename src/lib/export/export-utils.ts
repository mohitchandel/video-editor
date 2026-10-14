export interface ExportFormat {
  id: string;
  label: string;
  mimeType: string;
  extension: string;
}

const CANDIDATE_FORMATS: ExportFormat[] = [
  {
    id: "webm-vp9",
    label: "WebM (VP9)",
    mimeType: "video/webm;codecs=vp9,opus",
    extension: "webm",
  },
  {
    id: "webm-vp8",
    label: "WebM (VP8)",
    mimeType: "video/webm;codecs=vp8,opus",
    extension: "webm",
  },
  {
    id: "webm",
    label: "WebM",
    mimeType: "video/webm",
    extension: "webm",
  },
  {
    id: "mp4-h264",
    label: "MP4 (H.264)",
    mimeType: "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    extension: "mp4",
  },
  {
    id: "mp4",
    label: "MP4",
    mimeType: "video/mp4",
    extension: "mp4",
  },
];

/**
 * Only formats this browser's MediaRecorder actually encodes. MP4 appears on
 * Safari; Chromium/Firefox get WebM. Never offer a format we can't produce.
 */
export function getSupportedExportFormats(): ExportFormat[] {
  if (typeof MediaRecorder === "undefined") return [];
  const supported = CANDIDATE_FORMATS.filter((f) =>
    MediaRecorder.isTypeSupported(f.mimeType),
  );
  // Dedupe by extension, keeping the best codec first.
  const seen = new Set<string>();
  return supported.filter((f) => {
    if (seen.has(f.extension)) return false;
    seen.add(f.extension);
    return true;
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^\w\-. ]+/g, "").trim().replace(/\s+/g, "-") || "export";
}
