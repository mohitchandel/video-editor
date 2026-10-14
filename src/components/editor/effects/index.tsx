"use client";

import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { PropertySlider } from "@/components/common/property-slider";
import { useProjectStore } from "@/stores/project-store";

/**
 * Effects are real property adjustments applied across the project — no
 * decorative switches. Each control edits the underlying layers directly.
 */
export function EffectsPanel() {
  const project = useProjectStore((s) => s.project);
  const update = useProjectStore((s) => s.update);

  const visualizers = project.layers.filter((l) => l.kind === "visualizer");
  const texts = project.layers.filter((l) => l.kind === "text");
  const hasBackdrop = project.background.type !== "solid";

  const avgGlow =
    visualizers.length > 0
      ? visualizers.reduce((sum, v) => sum + v.glow, 0) / visualizers.length
      : 0;
  const avgTextGlow =
    texts.length > 0
      ? texts.reduce((sum, t) => sum + t.glow, 0) / texts.length
      : 0;

  if (visualizers.length === 0 && texts.length === 0 && !hasBackdrop) {
    return (
      <div className="p-3">
        <EmptyState
          icon={Sparkles}
          title="Nothing to style yet"
          hint="Effects adjust your visualizers, text, and background. Add some layers first."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-3">
      {visualizers.length > 0 ? (
        <section className="flex flex-col gap-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            Visualizer glow
          </p>
          <PropertySlider
            label={`Glow · ${visualizers.length} layer${visualizers.length > 1 ? "s" : ""}`}
            value={Math.round(avgGlow)}
            min={0}
            max={100}
            onChange={(value) =>
              update(
                (d) => {
                  for (const l of d.layers) {
                    if (l.kind === "visualizer") l.glow = value;
                  }
                },
                { coalesceKey: "fx-viz-glow" },
              )
            }
          />
        </section>
      ) : null}

      {texts.length > 0 ? (
        <section className="flex flex-col gap-3">
          <p className="text-[11px] font-medium text-muted-foreground">
            Text glow
          </p>
          <PropertySlider
            label={`Glow · ${texts.length} layer${texts.length > 1 ? "s" : ""}`}
            value={Math.round(avgTextGlow)}
            min={0}
            max={100}
            onChange={(value) =>
              update(
                (d) => {
                  for (const l of d.layers) {
                    if (l.kind === "text") l.glow = value;
                  }
                },
                { coalesceKey: "fx-text-glow" },
              )
            }
          />
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <p className="text-[11px] font-medium text-muted-foreground">Backdrop</p>
        <PropertySlider
          label="Dim"
          value={Math.round(project.background.dim * 100)}
          min={0}
          max={90}
          unit="%"
          onChange={(value) =>
            update(
              (d) => {
                d.background.dim = value / 100;
              },
              { coalesceKey: "fx-bg-dim" },
            )
          }
        />
        <PropertySlider
          label="Blur"
          value={project.background.blur}
          min={0}
          max={100}
          onChange={(value) =>
            update(
              (d) => {
                d.background.blur = value;
              },
              { coalesceKey: "fx-bg-blur" },
            )
          }
        />
      </section>
    </div>
  );
}
