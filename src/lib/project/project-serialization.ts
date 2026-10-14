import { projectSchema, type Project } from "./project-schema";

export function serializeProject(project: Project): string {
  return JSON.stringify(project);
}

export type ParseResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

export function parseProject(input: unknown): ParseResult {
  const data = typeof input === "string" ? safeJsonParse(input) : input;
  if (data === undefined) {
    return { ok: false, error: "Project file is not valid JSON." };
  }
  const result = projectSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.join(".") || "project";
    return {
      ok: false,
      error: `Invalid project data at "${path}": ${issue?.message ?? "unknown error"}`,
    };
  }
  return { ok: true, project: result.data };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
