import type { VisualizerStyle } from "@/lib/project/project-schema";
import type { VisualizerDrawArgs, VisualizerDrawFn } from "./render-types";

/**
 * The seven visualizer implementations. Each receives pre-resampled,
 * pre-smoothed bins (0..1) and draws around (cx, cy) within `size` pixels.
 * Sensitivity is already applied by the composition renderer.
 */

function applyGlow(args: VisualizerDrawArgs, color: string) {
  const { ctx, layer } = args;
  if (layer.glow > 0) {
    ctx.shadowColor = color;
    ctx.shadowBlur = (layer.glow / 100) * args.size * 0.15;
  }
}

function barGradient(args: VisualizerDrawArgs): CanvasGradient | string {
  const { ctx, layer, cx, cy, size } = args;
  if (!layer.useGradient) return layer.primaryColor;
  const g = ctx.createLinearGradient(cx - size / 2, cy, cx + size / 2, cy);
  g.addColorStop(0, layer.primaryColor);
  g.addColorStop(1, layer.secondaryColor);
  return g;
}

const drawCircularSpectrum: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, bins } = args;
  const innerR = size * 0.22;
  const maxBar = size * 0.26;
  const count = bins.length;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  applyGlow(args, layer.primaryColor);
  ctx.lineWidth = Math.max(1.5, (innerR * Math.PI * 2) / count * 0.55);
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const v = Math.min(1, bins[i]);
    const len = Math.max(2, v * maxBar);
    const color = layer.useGradient
      ? mixColor(layer.primaryColor, layer.secondaryColor, i / count)
      : layer.primaryColor;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
    ctx.lineTo(
      Math.cos(angle) * (innerR + len),
      Math.sin(angle) * (innerR + len),
    );
    ctx.stroke();
  }
  ctx.restore();
};

const drawBars: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, bins } = args;
  const count = bins.length;
  const width = size;
  const maxH = size * 0.5;
  const gap = width / count * 0.25;
  const barW = width / count - gap;
  const baseY = cy + maxH / 2;
  ctx.save();
  applyGlow(args, layer.primaryColor);
  ctx.fillStyle = barGradient(args);
  for (let i = 0; i < count; i++) {
    const v = Math.min(1, bins[i]);
    const h = Math.max(2, v * maxH);
    const x = cx - width / 2 + i * (barW + gap);
    ctx.fillRect(x, baseY - h, barW, h);
  }
  ctx.restore();
};

const drawWaveform: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, frame } = args;
  const width = size;
  const amp = size * 0.18 * layer.sensitivity;
  const wave = frame.wave;
  ctx.save();
  applyGlow(args, layer.primaryColor);
  ctx.strokeStyle = barGradient(args);
  ctx.lineWidth = Math.max(2, size * 0.008);
  ctx.lineJoin = "round";
  ctx.beginPath();
  const samples = 240;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const sample = wave[Math.floor(t * (wave.length - 1))] / 128 - 1;
    const x = cx - width / 2 + t * width;
    const y = cy + sample * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
};

const drawMirroredSpectrum: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, bins } = args;
  const count = bins.length;
  const width = size;
  const maxH = size * 0.24;
  const gap = width / count * 0.3;
  const barW = width / count - gap;
  ctx.save();
  applyGlow(args, layer.primaryColor);
  ctx.fillStyle = barGradient(args);
  for (let i = 0; i < count; i++) {
    const v = Math.min(1, bins[i]);
    const h = Math.max(1.5, v * maxH);
    const x = cx - width / 2 + i * (barW + gap);
    ctx.fillRect(x, cy - h, barW, h);
    ctx.globalAlpha *= 0.45;
    ctx.fillRect(x, cy, barW, h);
    ctx.globalAlpha /= 0.45;
  }
  ctx.restore();
};

const drawRadialWaveform: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, frame } = args;
  const baseR = size * 0.3;
  const amp = size * 0.12 * layer.sensitivity;
  const wave = frame.wave;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  applyGlow(args, layer.primaryColor);
  ctx.strokeStyle = layer.useGradient
    ? ringGradient(args)
    : layer.primaryColor;
  ctx.lineWidth = Math.max(2, size * 0.008);
  ctx.beginPath();
  const samples = 180;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const sample = wave[Math.floor(t * (wave.length - 1))] / 128 - 1;
    const angle = t * Math.PI * 2 - Math.PI / 2;
    const r = baseR + sample * amp;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
};

const drawPulseRing: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, frame } = args;
  const bass = Math.min(1, frame.bass * layer.sensitivity);
  const level = Math.min(1, frame.level * layer.sensitivity);
  const r = size * 0.22 + bass * size * 0.16;
  ctx.save();
  applyGlow(args, layer.primaryColor);
  ctx.strokeStyle = layer.primaryColor;
  ctx.lineWidth = Math.max(3, size * 0.02 + bass * size * 0.015);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // Echo ring driven by the overall level.
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = layer.useGradient
    ? layer.secondaryColor
    : layer.primaryColor;
  ctx.lineWidth = Math.max(1.5, size * 0.006);
  ctx.beginPath();
  ctx.arc(cx, cy, r + size * 0.06 + level * size * 0.1, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const drawMinimalEq: VisualizerDrawFn = (args) => {
  const { ctx, cx, cy, size, layer, bins } = args;
  const count = Math.min(12, Math.max(5, Math.round(layer.barCount / 8)));
  const width = size * 0.7;
  const maxH = size * 0.4;
  const gap = width / count * 0.45;
  const barW = width / count - gap;
  ctx.save();
  applyGlow(args, layer.primaryColor);
  ctx.fillStyle = barGradient(args);
  for (let i = 0; i < count; i++) {
    const bin = bins[Math.floor((i / count) * bins.length)];
    const v = Math.min(1, bin);
    const h = Math.max(barW, v * maxH);
    const x = cx - width / 2 + i * (barW + gap);
    const r = barW / 2;
    ctx.beginPath();
    ctx.roundRect(x, cy - h / 2, barW, h, r);
    ctx.fill();
  }
  ctx.restore();
};

function ringGradient(args: VisualizerDrawArgs): CanvasGradient {
  const { ctx, cx, cy, size, layer } = args;
  const g = ctx.createLinearGradient(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
  g.addColorStop(0, layer.primaryColor);
  g.addColorStop(1, layer.secondaryColor);
  return g;
}

/** Cheap hex color mix for per-bar hue sweeps. */
export function mixColor(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return a;
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const VISUALIZER_DRAWS: Record<VisualizerStyle, VisualizerDrawFn> = {
  "circular-spectrum": drawCircularSpectrum,
  bars: drawBars,
  waveform: drawWaveform,
  "mirrored-spectrum": drawMirroredSpectrum,
  "radial-waveform": drawRadialWaveform,
  "pulse-ring": drawPulseRing,
  "minimal-eq": drawMinimalEq,
};
