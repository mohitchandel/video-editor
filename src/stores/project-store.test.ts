import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultProject, createTextLayer } from "@/lib/project/project-defaults";
import type { AudioClip } from "@/lib/project/project-schema";
import { useProjectStore } from "./project-store";

const SONG: AudioClip = {
  id: "song",
  assetId: "ast_song",
  name: "song.mp3",
  duration: 60,
  start: 0,
  trimStart: 0,
  trimEnd: null,
  volume: 1,
  muted: false,
};

describe("project store history", () => {
  beforeEach(() => {
    useProjectStore.getState().replaceProject(createDefaultProject());
  });

  it("adds and removes layers", () => {
    const layer = createTextLayer("Hi");
    useProjectStore.getState().addLayer(layer);
    expect(useProjectStore.getState().project.layers).toHaveLength(1);
    useProjectStore.getState().removeLayer(layer.id);
    expect(useProjectStore.getState().project.layers).toHaveLength(0);
  });

  it("duplicates a layer directly above the source", () => {
    const a = createTextLayer("A");
    const b = createTextLayer("B");
    useProjectStore.getState().addLayer(a);
    useProjectStore.getState().addLayer(b);
    const copyId = useProjectStore.getState().duplicateLayer(a.id);
    const layers = useProjectStore.getState().project.layers;
    expect(layers.map((l) => l.id)).toEqual([a.id, copyId, b.id]);
    expect(layers[1].name).toBe("A copy");
  });

  it("moves layers forward and backward within bounds", () => {
    const a = createTextLayer("A");
    const b = createTextLayer("B");
    useProjectStore.getState().addLayer(a);
    useProjectStore.getState().addLayer(b);
    useProjectStore.getState().moveLayer(a.id, 1);
    expect(useProjectStore.getState().project.layers.map((l) => l.id)).toEqual([b.id, a.id]);
    useProjectStore.getState().moveLayer(a.id, 1);
    expect(useProjectStore.getState().project.layers.map((l) => l.id)).toEqual([b.id, a.id]);
  });

  it("keeps the project as long as its audio clips", () => {
    const store = useProjectStore.getState();
    store.addAudioClip({ ...SONG, id: "a", start: 0 });
    expect(useProjectStore.getState().project.duration).toBe(60);
    useProjectStore.getState().addAudioClip({ ...SONG, id: "b", start: 45 });
    expect(useProjectStore.getState().project.duration).toBe(105);
    useProjectStore.getState().updateAudioClip("b", { trimEnd: 20 });
    expect(useProjectStore.getState().project.duration).toBe(65);
    useProjectStore.getState().removeAudioClip("a");
    expect(useProjectStore.getState().project.duration).toBe(65);
  });

  it("splits a clip at a timeline time into two seamless pieces", () => {
    useProjectStore.getState().addAudioClip({ ...SONG, id: "a", start: 10, trimStart: 5 });
    const rightId = useProjectStore.getState().splitAudioClip("a", 30);
    const clips = useProjectStore.getState().project.audioClips;
    expect(clips).toHaveLength(2);
    const [left, right] = clips;
    expect(left.trimStart).toBe(5);
    expect(left.trimEnd).toBe(25); // 5 + (30 - 10)
    expect(right.id).toBe(rightId);
    expect(right.start).toBe(30);
    expect(right.trimStart).toBe(25);
    expect(right.trimEnd).toBeNull();
  });

  it("refuses to split outside the clip or too close to an edge", () => {
    useProjectStore.getState().addAudioClip({ ...SONG, id: "a", start: 0 });
    expect(useProjectStore.getState().splitAudioClip("a", 0.1)).toBeNull();
    expect(useProjectStore.getState().splitAudioClip("a", 90)).toBeNull();
    expect(useProjectStore.getState().project.audioClips).toHaveLength(1);
  });

  it("duplicates a clip right after itself", () => {
    useProjectStore.getState().addAudioClip({ ...SONG, id: "a", start: 5, trimEnd: 20 });
    const copyId = useProjectStore.getState().duplicateAudioClip("a");
    const copy = useProjectStore.getState().project.audioClips.find((c) => c.id === copyId);
    expect(copy?.start).toBe(25);
    expect(copy?.trimEnd).toBe(20);
    expect(useProjectStore.getState().project.duration).toBe(45);
  });

  it("undoes and redoes edits", () => {
    const store = useProjectStore.getState();
    store.update((d) => {
      d.name = "First";
    });
    useProjectStore.getState().update((d) => {
      d.name = "Second";
    });
    expect(useProjectStore.getState().project.name).toBe("Second");

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.name).toBe("First");
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.name).toBe("Untitled project");
    useProjectStore.getState().redo();
    expect(useProjectStore.getState().project.name).toBe("First");
  });

  it("coalesces rapid edits with the same key into one undo step", () => {
    for (let i = 0; i < 5; i++) {
      useProjectStore.getState().update(
        (d) => {
          d.name = `Drag ${i}`;
        },
        { coalesceKey: "drag-test" },
      );
    }
    expect(useProjectStore.getState().project.name).toBe("Drag 4");
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.name).toBe("Untitled project");
  });

  it("skips history when asked", () => {
    useProjectStore.getState().update(
      (d) => {
        d.name = "Transient";
      },
      { history: false },
    );
    expect(useProjectStore.getState().past).toHaveLength(0);
  });
});
