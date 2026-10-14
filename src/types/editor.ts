export type ToolId =
  | "select"
  | "audio"
  | "media"
  | "text"
  | "visualizers"
  | "backgrounds"
  | "effects";

export type Selection =
  | { type: "layer"; id: string }
  | { type: "background" }
  | { type: "audio" }
  | null;
