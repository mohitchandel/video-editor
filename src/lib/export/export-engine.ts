import { getAudioEngine } from "@/lib/audio/audio-engine";
import { CompositionRenderer } from "@/lib/rendering/composition-renderer";
import type { AssetResolver } from "@/lib/rendering/render-types";
import type { Project } from "@/lib/project/project-schema";

export interface ExportSettings {
  width: number;
  height: number;
  fps: number;
  mimeType: string;
  videoBitsPerSecond: number;
}

export interface ExportOutcome {
  blob: Blob;
  mimeType: string;
}

/**
 * Real-time export: plays the project through the shared audio engine while
 * recording the composited canvas (captureStream) and the audio graph
 * (MediaStreamAudioDestinationNode) with MediaRecorder. Progress is actual
 * playback position — nothing simulated. Takes as long as the song does.
 */
export class ExportEngine {
  private aborted = false;
  private cleanup: (() => void) | null = null;

  async export(
    project: Project,
    assets: AssetResolver,
    settings: ExportSettings,
    onProgress: (fraction: number) => void,
  ): Promise<ExportOutcome> {
    if (typeof MediaRecorder === "undefined") {
      throw new Error("This browser does not support video recording.");
    }
    this.aborted = false;
    const engine = getAudioEngine();
    engine.pause();
    // Export covers the trimmed in/out range only.
    const range = engine.getRange();
    engine.seek(range.start);

    const canvas = document.createElement("canvas");
    canvas.width = settings.width;
    canvas.height = settings.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a rendering context.");

    const renderer = new CompositionRenderer(assets);
    const size = { width: settings.width, height: settings.height };

    const videoStream = canvas.captureStream(settings.fps);
    const combined = new MediaStream(videoStream.getVideoTracks());
    const audioStream = engine.getRecordStream();
    for (const track of audioStream?.getAudioTracks() ?? []) {
      combined.addTrack(track);
    }

    const recorder = new MediaRecorder(combined, {
      mimeType: settings.mimeType,
      videoBitsPerSecond: settings.videoBitsPerSecond,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const length = Math.max(0.01, range.end - range.start);
    let raf = 0;

    const result = new Promise<ExportOutcome>((resolve, reject) => {
      recorder.onstop = () => {
        engine.pause();
        engine.seek(range.start);
        if (this.aborted) {
          reject(new Error("Export cancelled."));
          return;
        }
        if (chunks.length === 0) {
          reject(new Error("The recorder produced no data."));
          return;
        }
        resolve({
          blob: new Blob(chunks, { type: settings.mimeType }),
          mimeType: settings.mimeType,
        });
      };
      recorder.onerror = () => {
        engine.pause();
        reject(new Error("Video encoding failed in this browser."));
      };
    });

    const offEnded = engine.on("ended", () => stop());
    const stop = () => {
      cancelAnimationFrame(raf);
      offEnded();
      if (recorder.state !== "inactive") recorder.stop();
    };
    this.cleanup = stop;

    recorder.start(250);
    await engine.play();

    const loop = () => {
      if (this.aborted) {
        stop();
        return;
      }
      const time = engine.getCurrentTime();
      renderer.render(ctx, project, time, engine.getFrame(), size);
      onProgress(Math.min(1, (time - range.start) / length));
      if (time >= range.end - 0.01 && !engine.isPlaying) {
        stop();
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return result;
  }

  abort() {
    this.aborted = true;
    this.cleanup?.();
  }
}
