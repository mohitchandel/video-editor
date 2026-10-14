import { create } from "zustand";
import type { Selection, ToolId } from "@/types/editor";

interface EditorStore {
  tool: ToolId;
  selection: Selection;
  /** null = fit to available space. */
  previewZoom: number | null;
  timelineZoom: number;
  /** Pixels; the timeline grows with the number of tracks and can be dragged. */
  timelineHeight: number;
  inspectorOpen: boolean;
  assetsPanelOpen: boolean;

  setTool: (tool: ToolId) => void;
  select: (selection: Selection) => void;
  setPreviewZoom: (zoom: number | null) => void;
  setTimelineZoom: (zoom: number) => void;
  setTimelineHeight: (height: number) => void;
  toggleInspector: () => void;
  toggleAssetsPanel: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  tool: "media",
  selection: null,
  previewZoom: null,
  timelineZoom: 1,
  timelineHeight: 240,
  inspectorOpen: true,
  assetsPanelOpen: true,

  setTool: (tool) => set({ tool, assetsPanelOpen: true }),
  select: (selection) => set({ selection }),
  setPreviewZoom: (previewZoom) => set({ previewZoom }),
  setTimelineZoom: (timelineZoom) => set({ timelineZoom }),
  setTimelineHeight: (timelineHeight) => set({ timelineHeight }),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  toggleAssetsPanel: () => set((s) => ({ assetsPanelOpen: !s.assetsPanelOpen })),
}));
