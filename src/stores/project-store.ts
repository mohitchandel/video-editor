import { create } from "zustand";
import type { Layer, Project } from "@/lib/project/project-schema";
import { createDefaultProject, createId } from "@/lib/project/project-defaults";

const HISTORY_LIMIT = 50;
/** Repeated edits with the same key within this window share one undo step. */
const COALESCE_WINDOW_MS = 800;

export interface UpdateOptions {
  /** Set false for changes that shouldn't create an undo step. */
  history?: boolean;
  /**
   * Edits with the same key in quick succession (e.g. slider drags) collapse
   * into a single undo entry.
   */
  coalesceKey?: string;
}

interface ProjectStore {
  project: Project;
  past: Project[];
  future: Project[];
  lastCoalesceKey: string | null;
  lastEditAt: number;

  replaceProject: (project: Project) => void;
  update: (mutator: (draft: Project) => void, options?: UpdateOptions) => void;
  updateLayer: <L extends Layer>(
    id: string,
    patch: Partial<L>,
    options?: UpdateOptions,
  ) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  /** Inserts a copy directly above the source layer; returns the new id. */
  duplicateLayer: (id: string) => string | null;
  /** +1 brings the layer forward (toward the top), -1 sends it backward. */
  moveLayer: (id: string, direction: -1 | 1) => void;
  /** Starts a new background at `at` seconds (copying the one in effect); returns its id. */
  addBackgroundChange: (at: number) => string;
  removeBackgroundChange: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  project: createDefaultProject(),
  past: [],
  future: [],
  lastCoalesceKey: null,
  lastEditAt: 0,

  replaceProject: (project) =>
    set({ project, past: [], future: [], lastCoalesceKey: null }),

  update: (mutator, options = {}) => {
    const { history = true, coalesceKey } = options;
    const state = get();
    const draft = structuredClone(state.project);
    mutator(draft);
    draft.updatedAt = Date.now();

    if (!history) {
      set({ project: draft });
      return;
    }
    const now = Date.now();
    const coalesce =
      coalesceKey !== undefined &&
      coalesceKey === state.lastCoalesceKey &&
      now - state.lastEditAt < COALESCE_WINDOW_MS;

    set({
      project: draft,
      past: coalesce
        ? state.past
        : [...state.past.slice(-HISTORY_LIMIT + 1), state.project],
      future: [],
      lastCoalesceKey: coalesceKey ?? null,
      lastEditAt: now,
    });
  },

  updateLayer: (id, patch, options) => {
    get().update(
      (draft) => {
        const layer = draft.layers.find((l) => l.id === id);
        if (layer) Object.assign(layer, patch);
      },
      { coalesceKey: options?.coalesceKey ?? `layer:${id}`, ...options },
    );
  },

  addLayer: (layer) => {
    get().update((draft) => {
      draft.layers.push(layer);
    });
  },

  removeLayer: (id) => {
    get().update((draft) => {
      draft.layers = draft.layers.filter((l) => l.id !== id);
    });
  },

  duplicateLayer: (id) => {
    const source = get().project.layers.find((l) => l.id === id);
    if (!source) return null;
    const copy: Layer = {
      ...structuredClone(source),
      id: createId(source.kind),
      name: `${source.name} copy`,
    };
    get().update((draft) => {
      const index = draft.layers.findIndex((l) => l.id === id);
      draft.layers.splice(index + 1, 0, copy);
    });
    return copy.id;
  },

  moveLayer: (id, direction) => {
    get().update((draft) => {
      const index = draft.layers.findIndex((l) => l.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= draft.layers.length) return;
      const [layer] = draft.layers.splice(index, 1);
      draft.layers.splice(target, 0, layer);
    });
  },

  addBackgroundChange: (at) => {
    const id = createId("bgc");
    get().update((draft) => {
      const before = draft.backgroundChanges
        .filter((c) => c.at <= at)
        .sort((a, b) => a.at - b.at);
      const source = before.length
        ? before[before.length - 1].background
        : draft.background;
      draft.backgroundChanges.push({
        id,
        at,
        background: structuredClone(source),
        transition: "fade",
        transitionDuration: 1,
      });
    });
    return id;
  },

  removeBackgroundChange: (id) => {
    get().update((draft) => {
      draft.backgroundChanges = draft.backgroundChanges.filter((c) => c.id !== id);
    });
  },

  undo: () => {
    const { past, future, project } = get();
    const previous = past[past.length - 1];
    if (!previous) return;
    set({
      project: previous,
      past: past.slice(0, -1),
      future: [project, ...future].slice(0, HISTORY_LIMIT),
      lastCoalesceKey: null,
    });
  },

  redo: () => {
    const { past, future, project } = get();
    const next = future[0];
    if (!next) return;
    set({
      project: next,
      past: [...past, project].slice(-HISTORY_LIMIT),
      future: future.slice(1),
      lastCoalesceKey: null,
    });
  },
}));

export const selectCanUndo = (s: ProjectStore) => s.past.length > 0;
export const selectCanRedo = (s: ProjectStore) => s.future.length > 0;
