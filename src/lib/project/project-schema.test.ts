import { describe, expect, it } from "vitest";
import {
  createDefaultProject,
  createTextLayer,
  createVisualizerLayer,
} from "./project-defaults";
import { projectSchema } from "./project-schema";
import { parseProject, serializeProject } from "./project-serialization";

describe("project schema", () => {
  it("accepts a default project", () => {
    const result = projectSchema.safeParse(createDefaultProject());
    expect(result.success).toBe(true);
  });

  it("round-trips through serialization", () => {
    const project = createDefaultProject();
    project.layers.push(createVisualizerLayer("bars", "Bars"));
    project.layers.push(createTextLayer("Hello"));
    const parsed = parseProject(serializeProject(project));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.project).toEqual(project);
  });

  it("fills trim defaults for projects saved before trimming existed", () => {
    const project = createDefaultProject();
    const parsed = parseProject({
      ...project,
      audio: { assetId: "ast_1", name: "song.mp3", duration: 120, volume: 1 },
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project.audio?.trimStart).toBe(0);
      expect(parsed.project.audio?.trimEnd).toBeNull();
    }
  });

  it("rejects invalid JSON with a readable error", () => {
    const parsed = parseProject("not json {");
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toMatch(/not valid JSON/);
  });

  it("rejects structurally invalid projects and names the path", () => {
    const bad = { ...createDefaultProject(), aspectRatio: "4:3" };
    const parsed = parseProject(bad);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("aspectRatio");
  });

  it("rejects layers with an unknown kind", () => {
    const project = createDefaultProject();
    const parsed = parseProject({
      ...project,
      layers: [{ id: "x", kind: "video" }],
    });
    expect(parsed.ok).toBe(false);
  });
});
