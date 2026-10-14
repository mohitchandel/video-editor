import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultProject, createTextLayer } from "@/lib/project/project-defaults";
import { useProjectStore } from "./project-store";

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
