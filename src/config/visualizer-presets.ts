import type { VisualizerStyle } from "@/lib/project/project-schema";

export interface VisualizerPreset {
  style: VisualizerStyle;
  name: string;
  description: string;
}

export const VISUALIZER_PRESETS: VisualizerPreset[] = [
  {
    style: "circular-spectrum",
    name: "Circular spectrum",
    description: "Frequency bars radiating from a circle",
  },
  {
    style: "bars",
    name: "Frequency bars",
    description: "Classic bottom-anchored spectrum bars",
  },
  {
    style: "waveform",
    name: "Waveform",
    description: "Oscilloscope-style wave line",
  },
  {
    style: "mirrored-spectrum",
    name: "Mirrored spectrum",
    description: "Bars mirrored around a center line",
  },
  {
    style: "radial-waveform",
    name: "Radial waveform",
    description: "Waveform wrapped around a circle",
  },
  {
    style: "pulse-ring",
    name: "Pulse ring",
    description: "A ring that beats with the music",
  },
  {
    style: "minimal-eq",
    name: "Minimal equalizer",
    description: "A few rounded bars, clean and simple",
  },
];

export interface ColorPalettePreset {
  name: string;
  primary: string;
  secondary: string;
}

export const COLOR_PALETTES: ColorPalettePreset[] = [
  { name: "Violet", primary: "#7c5cff", secondary: "#4cc2ff" },
  { name: "Sunset", primary: "#ff6b4a", secondary: "#ffc24a" },
  { name: "Mint", primary: "#4ade80", secondary: "#22d3ee" },
  { name: "Magenta", primary: "#e060b0", secondary: "#7c5cff" },
  { name: "Mono", primary: "#ffffff", secondary: "#9ca3af" },
  { name: "Gold", primary: "#f5c044", secondary: "#f97316" },
];
