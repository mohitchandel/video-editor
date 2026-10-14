import { z } from "zod";

/**
 * Serializable project document. Runtime resources (AudioBuffer, ImageBitmap,
 * object URLs) live in the media registry, never here. All coordinates are
 * normalized 0..1 relative to the composition; pixel-ish sizes (font size,
 * outline width) are expressed at a 1080p-height baseline and scaled by the
 * renderer.
 */

export const aspectRatioSchema = z.enum(["16:9", "9:16", "1:1"]);
export type AspectRatio = z.infer<typeof aspectRatioSchema>;

export const assetKindSchema = z.enum(["audio", "image"]);
export type AssetKind = z.infer<typeof assetKindSchema>;

export const assetMetaSchema = z.object({
  id: z.string(),
  kind: assetKindSchema,
  name: z.string(),
  mimeType: z.string(),
  size: z.number().nonnegative(),
});
export type AssetMeta = z.infer<typeof assetMetaSchema>;

const layerBase = {
  id: z.string(),
  name: z.string(),
  visible: z.boolean().default(true),
  opacity: z.number().min(0).max(1).default(1),
  /** Seconds. end === null means "until the end of the project". */
  start: z.number().min(0).default(0),
  end: z.number().min(0).nullable().default(null),
};

export const imageLayerSchema = z.object({
  ...layerBase,
  kind: z.literal("image"),
  assetId: z.string(),
  x: z.number().default(0.5),
  y: z.number().default(0.5),
  scale: z.number().min(0.01).max(8).default(1),
  rotation: z.number().default(0),
  cornerRadius: z.number().min(0).max(0.5).default(0),
  brightness: z.number().min(0).max(3).default(1),
  contrast: z.number().min(0).max(3).default(1),
  blur: z.number().min(0).max(100).default(0),
});
export type ImageLayer = z.infer<typeof imageLayerSchema>;

export const textAlignSchema = z.enum(["left", "center", "right"]);

export const textLayerSchema = z.object({
  ...layerBase,
  kind: z.literal("text"),
  text: z.string().default("Title"),
  fontFamily: z.string().default("Geist"),
  fontSize: z.number().min(8).max(600).default(96),
  fontWeight: z.number().min(100).max(900).default(700),
  color: z.string().default("#ffffff"),
  gradient: z
    .object({ from: z.string(), to: z.string() })
    .nullable()
    .default(null),
  align: textAlignSchema.default("center"),
  letterSpacing: z.number().min(-20).max(100).default(0),
  outlineColor: z.string().default("#000000"),
  outlineWidth: z.number().min(0).max(40).default(0),
  shadowColor: z.string().default("#000000"),
  shadowBlur: z.number().min(0).max(100).default(0),
  glow: z.number().min(0).max(100).default(0),
  x: z.number().default(0.5),
  y: z.number().default(0.5),
});
export type TextLayer = z.infer<typeof textLayerSchema>;

export const visualizerStyleSchema = z.enum([
  "circular-spectrum",
  "bars",
  "waveform",
  "mirrored-spectrum",
  "radial-waveform",
  "pulse-ring",
  "minimal-eq",
]);
export type VisualizerStyle = z.infer<typeof visualizerStyleSchema>;

export const visualizerLayerSchema = z.object({
  ...layerBase,
  kind: z.literal("visualizer"),
  style: visualizerStyleSchema.default("circular-spectrum"),
  primaryColor: z.string().default("#7c5cff"),
  secondaryColor: z.string().default("#4cc2ff"),
  useGradient: z.boolean().default(true),
  x: z.number().default(0.5),
  y: z.number().default(0.5),
  /** Fraction of min(width, height). */
  size: z.number().min(0.05).max(2).default(0.6),
  sensitivity: z.number().min(0.1).max(4).default(1),
  smoothing: z.number().min(0).max(0.95).default(0.6),
  barCount: z.number().int().min(8).max(256).default(64),
  glow: z.number().min(0).max(100).default(30),
  rotation: z.number().default(0),
});
export type VisualizerLayer = z.infer<typeof visualizerLayerSchema>;

export const layerSchema = z.discriminatedUnion("kind", [
  imageLayerSchema,
  textLayerSchema,
  visualizerLayerSchema,
]);
export type Layer = z.infer<typeof layerSchema>;
export type LayerKind = Layer["kind"];

export const backgroundSchema = z.object({
  type: z.enum(["solid", "gradient", "image"]).default("solid"),
  color: z.string().default("#0c0c10"),
  gradientFrom: z.string().default("#17103a"),
  gradientTo: z.string().default("#0c0c10"),
  gradientAngle: z.number().default(135),
  assetId: z.string().nullable().default(null),
  blur: z.number().min(0).max(100).default(0),
  dim: z.number().min(0).max(1).default(0),
});
export type ProjectBackground = z.infer<typeof backgroundSchema>;

export const backgroundTransitionSchema = z.enum([
  "cut",
  "fade",
  "slide-left",
  "slide-right",
  "slide-up",
  "zoom",
]);
export type BackgroundTransition = z.infer<typeof backgroundTransitionSchema>;

/** A background that takes over at `at` seconds, animating in from the previous one. */
export const backgroundChangeSchema = z.object({
  id: z.string(),
  at: z.number().min(0),
  background: backgroundSchema,
  transition: backgroundTransitionSchema.default("fade"),
  /** Seconds the transition takes. Ignored for "cut". */
  transitionDuration: z.number().min(0.1).max(5).default(1),
});
export type BackgroundChange = z.infer<typeof backgroundChangeSchema>;

/**
 * One piece of audio placed on the timeline. Several clips may overlap; they
 * are mixed together. `start` is the timeline position, trim points are
 * within the file.
 */
export const audioClipSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  name: z.string(),
  /** Full length of the decoded file, seconds. */
  duration: z.number().positive(),
  /** Timeline position of the clip's first audible sample, seconds. */
  start: z.number().min(0).default(0),
  /** In point within the file, seconds. */
  trimStart: z.number().min(0).default(0),
  /** Out point within the file, seconds. null = to the end of the file. */
  trimEnd: z.number().positive().nullable().default(null),
  volume: z.number().min(0).max(1).default(1),
  muted: z.boolean().default(false),
});
export type AudioClip = z.infer<typeof audioClipSchema>;

/** Audible length of a clip on the timeline. */
export function audioClipLength(clip: AudioClip): number {
  return (clip.trimEnd ?? clip.duration) - clip.trimStart;
}

/** Project length implied by the clips: the end of the last one. */
export function audioClipsEnd(clips: AudioClip[]): number {
  return clips.reduce((end, c) => Math.max(end, c.start + audioClipLength(c)), 0);
}

export const projectSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  name: z.string().min(1).max(120),
  aspectRatio: aspectRatioSchema.default("16:9"),
  /** Seconds. Follows the end of the last audio clip when there are clips. */
  duration: z.number().positive().default(30),
  audioClips: z.array(audioClipSchema).default([]),
  /** Background from time 0 until the first change. */
  background: backgroundSchema,
  backgroundChanges: z.array(backgroundChangeSchema).default([]),
  layers: z.array(layerSchema).default([]),
  assets: z.array(assetMetaSchema).default([]),
  updatedAt: z.number().default(0),
});
export type Project = z.infer<typeof projectSchema>;
