"use client";

import { useEffect, useRef } from "react";
import { ASPECT_RATIOS } from "@/config/editor-config";
import { getAudioEngine } from "@/lib/audio/audio-engine";
import { getAssetImage } from "@/lib/media/media-registry";
import { CompositionRenderer } from "@/lib/rendering/composition-renderer";
import type { Layer } from "@/lib/project/project-schema";
import { clamp } from "@/lib/audio/audio-utils";
import { useEditorStore } from "@/stores/editor-store";
import { useProjectStore } from "@/stores/project-store";

/**
 * The live composition. A rAF loop reads the engine clock and the latest
 * project snapshot directly — no React state updates per frame. Dragging
 * moves the selected layer; clicking hit-tests layers (topmost first).
 */
export function PreviewCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const aspectRatio = useProjectStore((s) => s.project.aspectRatio);
  const previewZoom = useEditorStore((s) => s.previewZoom);
  const dragRef = useRef<{
    layerId: string;
    startX: number;
    startY: number;
    layerX: number;
    layerY: number;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderer = new CompositionRenderer({ getImage: getAssetImage });
    const engine = getAudioEngine();
    let raf = 0;

    const loop = () => {
      const project = useProjectStore.getState().project;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      const w = Math.max(2, Math.round(cssW * dpr));
      const h = Math.max(2, Math.round(cssH * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      renderer.prune(new Set(project.layers.map((l) => l.id)));
      renderer.render(
        ctx,
        project,
        engine.getCurrentTime(),
        engine.getFrame(),
        { width: w, height: h },
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const toNormalized = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
      rect,
    };
  };

  const hitTest = (nx: number, ny: number): Layer | null => {
    const { project } = useProjectStore.getState();
    const ratio = ASPECT_RATIOS[project.aspectRatio];
    const engine = getAudioEngine();
    const time = engine.getCurrentTime();
    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible) continue;
      const end = layer.end ?? project.duration;
      if (time < layer.start || time > end) continue;
      // Approximate bounding boxes in normalized space.
      let half = 0.15;
      if (layer.kind === "visualizer") half = layer.size / 2;
      else if (layer.kind === "image") half = layer.scale * 0.25;
      else if (layer.kind === "text")
        half = Math.max(0.06, (layer.fontSize / 1080) * 1.4);
      const aspect = ratio.width / ratio.height;
      const hx = half / Math.max(1, aspect) || half;
      if (
        Math.abs(nx - layer.x) <= Math.max(0.04, hx) &&
        Math.abs(ny - layer.y) <= Math.max(0.04, half)
      ) {
        return layer;
      }
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const { x, y } = toNormalized(e);
    const { selection, select } = useEditorStore.getState();
    const { project } = useProjectStore.getState();

    const hit = hitTest(x, y);
    if (hit) {
      if (!(selection?.type === "layer" && selection.id === hit.id)) {
        select({ type: "layer", id: hit.id });
      }
      dragRef.current = {
        layerId: hit.id,
        startX: x,
        startY: y,
        layerX: hit.x,
        layerY: hit.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    // Selected layer can still be grabbed even if the hit test misses it.
    if (selection?.type === "layer") {
      const layer = project.layers.find((l) => l.id === selection.id);
      if (layer) {
        dragRef.current = {
          layerId: layer.id,
          startX: x,
          startY: y,
          layerX: layer.x,
          layerY: layer.y,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }
    select({ type: "background" });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const { x, y } = toNormalized(e);
    useProjectStore.getState().updateLayer(
      drag.layerId,
      {
        x: clamp(drag.layerX + (x - drag.startX), 0, 1),
        y: clamp(drag.layerY + (y - drag.startY), 0, 1),
      },
      { coalesceKey: `drag:${drag.layerId}` },
    );
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const ratio = ASPECT_RATIOS[aspectRatio];
  const fitStyle =
    previewZoom === null
      ? {
          width: "100%",
          height: "100%",
        }
      : {
          width: ratio.width * previewZoom * 0.25,
          height: ratio.height * previewZoom * 0.25,
        };

  return (
    <div
      ref={wrapperRef}
      className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-canvas p-4"
    >
      <div
        className="relative flex max-h-full max-w-full items-center justify-center"
        style={previewZoom === null ? { width: "100%", height: "100%" } : undefined}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="max-h-full max-w-full rounded-sm shadow-[0_0_0_1px_var(--border),0_12px_40px_rgba(0,0,0,0.5)]"
          style={{
            aspectRatio: `${ratio.width} / ${ratio.height}`,
            ...(previewZoom === null
              ? ratio.width >= ratio.height
                ? { width: "100%", height: "auto", maxHeight: "100%" }
                : { height: "100%", width: "auto", maxWidth: "100%" }
              : fitStyle),
            touchAction: "none",
          }}
        />
      </div>
    </div>
  );
}
