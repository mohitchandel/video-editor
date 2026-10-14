import { projectSchema, type Project } from "./project-schema";

export function serializeProject(project: Project): string {
  return JSON.stringify(project);
}

export type ParseResult =
  | { ok: true; project: Project }
  | { ok: false; error: string };

/**
 * Projects saved with the single `audio` field become one clip at time 0.
 * Its in/out trim is kept, so the audible part is unchanged.
 */
function migrateSingleAudio(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;
  const record = data as Record<string, unknown>;
  if (!("audio" in record) || Array.isArray(record.audioClips)) return data;
  const { audio, ...rest } = record;
  if (!audio || typeof audio !== "object") return { ...rest, audioClips: [] };
  const legacy = audio as Record<string, unknown>;
  return {
    ...rest,
    audioClips: [
      {
        id: `aud_${String(legacy.assetId ?? "legacy")}`,
        assetId: legacy.assetId,
        name: legacy.name,
        duration: legacy.duration,
        start: 0,
        trimStart: legacy.trimStart ?? 0,
        trimEnd: legacy.trimEnd ?? null,
        volume: legacy.volume ?? 1,
        muted: false,
      },
    ],
  };
}

export function parseProject(input: unknown): ParseResult {
  const raw = typeof input === "string" ? safeJsonParse(input) : input;
  if (raw === undefined) {
    return { ok: false, error: "Project file is not valid JSON." };
  }
  const data = migrateSingleAudio(raw);
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
