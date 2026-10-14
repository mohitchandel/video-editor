import { parseProject } from "./project-serialization";
import type { Project } from "./project-schema";

/**
 * Local-first persistence: project JSON plus media blobs in IndexedDB.
 * Everything stays on the user's device.
 */

const DB_NAME = "wavecraft";
const DB_VERSION = 1;
const PROJECTS = "projects";
const BLOBS = "assetBlobs";
const META = "meta";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS);
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Could not open local storage."));
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Local storage request failed."));
  });
}

export async function saveProjectLocally(
  project: Project,
  getBlob: (assetId: string) => Blob | null,
): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction([PROJECTS, BLOBS, META], "readwrite");
    tx.objectStore(PROJECTS).put(JSON.parse(JSON.stringify(project)), project.id);
    tx.objectStore(META).put(project.id, "lastProjectId");
    const blobStore = tx.objectStore(BLOBS);
    for (const asset of project.assets) {
      const blob = getBlob(asset.id);
      if (blob) blobStore.put(blob, asset.id);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not save the project."));
      tx.onabort = () => reject(tx.error ?? new Error("Saving was interrupted."));
    });
  } finally {
    db.close();
  }
}

export interface RestoredProject {
  project: Project;
  blobs: Map<string, Blob>;
}

export async function loadLastProject(): Promise<RestoredProject | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  try {
    const metaTx = db.transaction([META], "readonly");
    const lastId = await requestToPromise(
      metaTx.objectStore(META).get("lastProjectId") as IDBRequest<string | undefined>,
    );
    if (!lastId) return null;

    const tx = db.transaction([PROJECTS, BLOBS], "readonly");
    const raw = await requestToPromise(tx.objectStore(PROJECTS).get(lastId));
    if (!raw) return null;
    const parsed = parseProject(raw);
    if (!parsed.ok) return null;

    const blobs = new Map<string, Blob>();
    const blobStore = db.transaction([BLOBS], "readonly").objectStore(BLOBS);
    // Issue all gets synchronously so the transaction stays alive.
    const reads = parsed.project.assets.map((asset) =>
      requestToPromise(blobStore.get(asset.id) as IDBRequest<Blob | undefined>)
        .then((blob) => ({ id: asset.id, blob }))
        .catch(() => ({ id: asset.id, blob: undefined })),
    );
    for (const { id, blob } of await Promise.all(reads)) {
      if (blob) blobs.set(id, blob);
    }
    return { project: parsed.project, blobs };
  } finally {
    db.close();
  }
}

export async function clearSavedProjects(): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction([PROJECTS, BLOBS, META], "readwrite");
    tx.objectStore(PROJECTS).clear();
    tx.objectStore(BLOBS).clear();
    tx.objectStore(META).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("Could not clear saved data."));
    });
  } finally {
    db.close();
  }
}
