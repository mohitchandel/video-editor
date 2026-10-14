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
  /** changeId targets a timed background change; omitted = the base background. */
  | { type: "background"; changeId?: string }
  | { type: "audio"; id: string }
  | null;
