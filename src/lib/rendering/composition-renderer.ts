import type { AudioFrame } from "@/lib/audio/audio-engine";
import type {
  Layer,
  Project,
  TextLayer,
  VisualizerLayer,
  ImageLayer,
} from "@/lib/project/project-schema";
import {
  coverRect,
  imageSourceSize,
  resampleFrequencyBins,
  roundedRectPath,
} from "./canvas-utils";
import type { AssetResolver, RenderSize } from "./render-types";
import { VISUALIZER_DRAWS } from "./visualizer-draws";

/**
 * Draws a project at a given time onto a 2D canvas. Shared by the live
 * preview and the export pipeline. Holds per-visualizer smoothing state, so
 * use one instance per render target.
 */
export class CompositionRenderer {
  private smoothed = new Map<string, Float32Array>();

  constructor(private assets: AssetResolver) {}

  render(
    ctx: CanvasRenderingContext2D,
    project: Project,
    time: number,
    frame: AudioFrame,
    size: RenderSize,
  ) {
    const { width, height } = size;
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    this.drawBackground(ctx, project, size);
    for (const layer of project.layers) {
      if (!this.isLayerActive(layer, time, project.duration)) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      if (layer.kind === "image") this.drawImage(ctx, layer, size);
      else if (layer.kind === "visualizer")
        this.drawVisualizer(ctx, layer, frame, time, size);
      else this.drawText(ctx, layer, size);
      ctx.restore();
    }
    ctx.restore();
  }

  private isLayerActive(layer: Layer, time: number, duration: number): boolean {
    if (!layer.visible) return false;
    const end = layer.end ?? duration;
    return time >= layer.start - 1e-6 && time <= end + 1e-6;
  }

  private drawBackground(
    ctx: CanvasRenderingContext2D,
    project: Project,
    size: RenderSize,
  ) {
    const bg = project.background;
    const { width, height } = size;
    if (bg.type === "image" && bg.assetId) {
      const img = this.assets.getImage(bg.assetId);
      if (img) {
        const { width: sw, height: sh } = imageSourceSize(img);
        if (sw > 0 && sh > 0) {
          const src = coverRect(sw, sh, width, height);
          ctx.save();
          if (bg.blur > 0) ctx.filter = `blur(${(bg.blur / 100) * (height * 0.05)}px)`;
          ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, width, height);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = bg.color;
        ctx.fillRect(0, 0, width, height);
      }
    } else if (bg.type === "gradient") {
      const rad = ((bg.gradientAngle - 90) * Math.PI) / 180;
      const half = Math.sqrt(width * width + height * height) / 2;
      const dx = Math.cos(rad) * half;
      const dy = Math.sin(rad) * half;
      const g = ctx.createLinearGradient(
        width / 2 - dx,
        height / 2 - dy,
        width / 2 + dx,
        height / 2 + dy,
      );
      g.addColorStop(0, bg.gradientFrom);
      g.addColorStop(1, bg.gradientTo);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = bg.color;
      ctx.fillRect(0, 0, width, height);
    }
    if (bg.dim > 0) {
      ctx.fillStyle = `rgba(0,0,0,${bg.dim})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawImage(
    ctx: CanvasRenderingContext2D,
    layer: ImageLayer,
    size: RenderSize,
  ) {
    const img = this.assets.getImage(layer.assetId);
    if (!img) return;
    const { width: sw, height: sh } = imageSourceSize(img);
    if (sw <= 0 || sh <= 0) return;
    const { width, height } = size;
    // Base size: fit the image inside 50% of the composition, then scale.
    const base = (Math.min(width, height) * 0.5) / Math.max(sw, sh);
    const drawW = sw * base * layer.scale;
    const drawH = sh * base * layer.scale;
    ctx.save();
    ctx.translate(layer.x * width, layer.y * height);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    const filters: string[] = [];
    if (layer.brightness !== 1) filters.push(`brightness(${layer.brightness})`);
    if (layer.contrast !== 1) filters.push(`contrast(${layer.contrast})`);
    if (layer.blur > 0) filters.push(`blur(${(layer.blur / 100) * height * 0.02}px)`);
    if (filters.length) ctx.filter = filters.join(" ");
    if (layer.cornerRadius > 0) {
      roundedRectPath(
        ctx,
        -drawW / 2,
        -drawH / 2,
        drawW,
        drawH,
        layer.cornerRadius * Math.min(drawW, drawH),
      );
      ctx.clip();
    }
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  }

  private drawVisualizer(
    ctx: CanvasRenderingContext2D,
    layer: VisualizerLayer,
    frame: AudioFrame,
    time: number,
    size: RenderSize,
  ) {
    const bins = this.smoothBins(layer, frame);
    const draw = VISUALIZER_DRAWS[layer.style];
    draw({
      ctx,
      cx: layer.x * size.width,
      cy: layer.y * size.height,
      size: layer.size * Math.min(size.width, size.height),
      layer,
      frame,
      bins,
      time,
      canvasSize: size,
    });
  }

  /** Resample to barCount, apply sensitivity, then exponential smoothing. */
  private smoothBins(layer: VisualizerLayer, frame: AudioFrame): Float32Array {
    let state = this.smoothed.get(layer.id);
    if (!state || state.length !== layer.barCount) {
      state = new Float32Array(layer.barCount);
      this.smoothed.set(layer.id, state);
    }
    const target = new Float32Array(layer.barCount);
    resampleFrequencyBins(frame.freq, layer.barCount, target);
    const keep = layer.smoothing;
    for (let i = 0; i < state.length; i++) {
      const next = Math.min(1.2, target[i] * layer.sensitivity);
      state[i] = state[i] * keep + next * (1 - keep);
    }
    return state;
  }

  private drawText(
    ctx: CanvasRenderingContext2D,
    layer: TextLayer,
    size: RenderSize,
  ) {
    const { width, height } = size;
    // Font sizes are authored at a 1080p-height baseline.
    const scale = height / 1080;
    const fontSize = layer.fontSize * scale;
    ctx.save();
    ctx.font = `${layer.fontWeight} ${fontSize}px "${layer.fontFamily}", sans-serif`;
    ctx.textAlign = layer.align;
    ctx.textBaseline = "middle";
    if ("letterSpacing" in ctx) {
      ctx.letterSpacing = `${layer.letterSpacing * scale}px`;
    }
    const x = layer.x * width;
    const lines = layer.text.split("\n");
    const lineHeight = fontSize * 1.2;
    const totalH = lineHeight * (lines.length - 1);
    const startY = layer.y * height - totalH / 2;

    if (layer.glow > 0) {
      ctx.shadowColor = layer.gradient ? layer.gradient.from : layer.color;
      ctx.shadowBlur = (layer.glow / 100) * fontSize;
    } else if (layer.shadowBlur > 0) {
      ctx.shadowColor = layer.shadowColor;
      ctx.shadowBlur = layer.shadowBlur * scale;
      ctx.shadowOffsetY = layer.shadowBlur * scale * 0.3;
    }

    for (let i = 0; i < lines.length; i++) {
      const y = startY + i * lineHeight;
      if (layer.outlineWidth > 0) {
        ctx.strokeStyle = layer.outlineColor;
        ctx.lineWidth = layer.outlineWidth * scale;
        ctx.lineJoin = "round";
        ctx.strokeText(lines[i], x, y);
      }
      if (layer.gradient) {
        const metrics = ctx.measureText(lines[i]);
        const w = Math.max(1, metrics.width);
        const gx =
          layer.align === "left" ? x : layer.align === "right" ? x - w : x - w / 2;
        const g = ctx.createLinearGradient(gx, 0, gx + w, 0);
        g.addColorStop(0, layer.gradient.from);
        g.addColorStop(1, layer.gradient.to);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = layer.color;
      }
      ctx.fillText(lines[i], x, y);
    }
    ctx.restore();
  }

  /** Drop smoothing state for removed layers so the map doesn't grow forever. */
  prune(activeLayerIds: Set<string>) {
    for (const id of this.smoothed.keys()) {
      if (!activeLayerIds.has(id)) this.smoothed.delete(id);
    }
  }
}
