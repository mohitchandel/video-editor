"use client";

import { useEffect, useRef } from "react";
import { VISUALIZER_PRESETS } from "@/config/visualizer-presets";
import { createVisualizerLayer } from "@/lib/project/project-defaults";
import type { VisualizerStyle } from "@/lib/project/project-schema";
import { VISUALIZER_DRAWS } from "@/lib/rendering/visualizer-draws";
import type { AudioFrame } from "@/lib/audio/audio-engine";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

/** Deterministic fake spectrum so thumbnails look alive without audio. */
function fakeFrame(): AudioFrame {
  const freq = new Uint8Array(1024);
  const wave = new Uint8Array(2048);
  for (let i = 0; i < freq.length; i++) {
    const t = i / freq.length;
    freq[i] = Math.max(
      0,
      Math.round(
        200 * Math.exp(-t * 3.2) * (0.7 + 0.3 * Math.sin(i * 0.6)) ),
    );
  }
  for (let i = 0; i < wave.length; i++) {
    wave[i] = Math.round(
      128 + 40 * Math.sin(i * 0.05) * Math.sin(i * 0.011) + 12 * Math.sin(i * 0.21),
    );
  }
  return { freq, wave, level: 0.5, bass: 0.6 };
}

function VisualizerThumb({ style }: { style: VisualizerStyle }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    const frame = fakeFrame();
    const layer = createVisualizerLayer(style, "thumb");
    layer.glow = 0;
    const bins = new Float32Array(48);
    for (let i = 0; i < bins.length; i++) {
      bins[i] = frame.freq[Math.floor((i / bins.length) * 700)] / 255;
    }
    VISUALIZER_DRAWS[style]({
      ctx,
      cx: width / 2,
      cy: height / 2,
      size: Math.min(width, height) * 1.5,
      layer,
      frame,
      bins,
      time: 0,
      canvasSize: { width, height },
    });
  }, [style]);

  return (
    <canvas
      ref={canvasRef}
      width={176}
      height={88}
      className="h-[72px] w-full rounded-md bg-canvas"
      aria-hidden
    />
  );
}

export function VisualizerPicker() {
  const addLayer = useProjectStore((s) => s.addLayer);
  const hasAudio = useProjectStore((s) => s.project.audioClips.length > 0);
  const select = useEditorStore((s) => s.select);

  const addVisualizer = (style: VisualizerStyle, name: string) => {
    const layer = createVisualizerLayer(style, name);
    addLayer(layer);
    select({ type: "layer", id: layer.id });
  };

  return (
    <div className="flex flex-col gap-3 p-3">
      {!hasAudio ? (
        <p className="rounded-md border border-track-audio/30 bg-track-audio/10 px-2.5 py-2 text-[11px] text-track-audio">
          Visualizers react to audio — add a song in the Audio tab to see them
          move.
        </p>
      ) : null}
      <ul className="grid grid-cols-1 gap-2">
        {VISUALIZER_PRESETS.map((preset) => (
          <li key={preset.style}>
            <button
              type="button"
              onClick={() => addVisualizer(preset.style, preset.name)}
              className="flex w-full flex-col gap-1.5 rounded-lg border bg-elevated p-2 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
            >
              <VisualizerThumb style={preset.style} />
              <span className="px-0.5">
                <span className="block text-xs font-medium">{preset.name}</span>
                <span className="block text-[11px] text-muted-foreground">
                  {preset.description}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
