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

  it("migrates projects saved with a single audio field into one clip", () => {
    const legacy: Record<string, unknown> = {
      ...createDefaultProject(),
      audio: { assetId: "ast_1", name: "song.mp3", duration: 120, volume: 0.8, trimStart: 5 },
    };
    delete legacy.audioClips;
    const parsed = parseProject(legacy);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project.audioClips).toHaveLength(1);
      const clip = parsed.project.audioClips[0];
      expect(clip.assetId).toBe("ast_1");
      expect(clip.start).toBe(0);
      expect(clip.trimStart).toBe(5);
      expect(clip.trimEnd).toBeNull();
      expect(clip.volume).toBe(0.8);
      expect(clip.muted).toBe(false);
    }
  });

  it("fills clip defaults for clips missing optional fields", () => {
    const project = createDefaultProject();
    const parsed = parseProject({
      ...project,
      audioClips: [{ id: "aud_1", assetId: "ast_1", name: "song.mp3", duration: 120 }],
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.project.audioClips[0].start).toBe(0);
      expect(parsed.project.audioClips[0].volume).toBe(1);
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
