import type { AudioFrame } from "@/lib/audio/audio-engine";
import type { VisualizerLayer } from "@/lib/project/project-schema";

export interface RenderSize {
  width: number;
  height: number;
}

/** Resolves asset ids to drawable sources at render time. */
export interface AssetResolver {
  getImage(assetId: string): CanvasImageSource | null;
}

export interface VisualizerDrawArgs {
  ctx: CanvasRenderingContext2D;
  /** Center of the visualizer in canvas pixels. */
  cx: number;
  cy: number;
  /** Visualizer size in canvas pixels (config.size × min(w, h)). */
  size: number;
  layer: VisualizerLayer;
  frame: AudioFrame;
  /** Frequency bins resampled to layer.barCount and smoothed, 0..1. */
  bins: Float32Array;
  time: number;
  canvasSize: RenderSize;
}

export type VisualizerDrawFn = (args: VisualizerDrawArgs) => void;
