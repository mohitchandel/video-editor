import type {
  ImageLayer,
  Project,
  TextLayer,
  VisualizerLayer,
  VisualizerStyle,
} from "./project-schema";

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export const DEFAULT_PROJECT_DURATION = 30;

export function createDefaultProject(): Project {
  return {
    version: 1,
    id: createId("prj"),
    name: "Untitled project",
    aspectRatio: "16:9",
    duration: DEFAULT_PROJECT_DURATION,
    audio: null,
    background: {
      type: "gradient",
      color: "#0c0c10",
      gradientFrom: "#17103a",
      gradientTo: "#0c0c10",
      gradientAngle: 135,
      assetId: null,
      blur: 0,
      dim: 0,
    },
    layers: [],
    assets: [],
    updatedAt: 0,
  };
}

export function createVisualizerLayer(
  style: VisualizerStyle,
  name: string,
): VisualizerLayer {
  return {
    id: createId("viz"),
    kind: "visualizer",
    name,
    visible: true,
    opacity: 1,
    start: 0,
    end: null,
    style,
    primaryColor: "#7c5cff",
    secondaryColor: "#4cc2ff",
    useGradient: true,
    x: 0.5,
    y: 0.5,
    size: 0.6,
    sensitivity: 1,
    smoothing: 0.6,
    barCount: 64,
    glow: 30,
    rotation: 0,
  };
}

export function createTextLayer(text: string): TextLayer {
  return {
    id: createId("txt"),
    kind: "text",
    name: text.slice(0, 24) || "Text",
    visible: true,
    opacity: 1,
    start: 0,
    end: null,
    text,
    fontFamily: "Geist",
    fontSize: 96,
    fontWeight: 700,
    color: "#ffffff",
    gradient: null,
    align: "center",
    letterSpacing: 0,
    outlineColor: "#000000",
    outlineWidth: 0,
    shadowColor: "#000000",
    shadowBlur: 0,
    glow: 0,
    x: 0.5,
    y: 0.5,
  };
}

export function createImageLayer(assetId: string, name: string): ImageLayer {
  return {
    id: createId("img"),
    kind: "image",
    name,
    visible: true,
    opacity: 1,
    start: 0,
    end: null,
    assetId,
    x: 0.5,
    y: 0.5,
    scale: 1,
    rotation: 0,
    cornerRadius: 0,
    brightness: 1,
    contrast: 1,
    blur: 0,
  };
}
