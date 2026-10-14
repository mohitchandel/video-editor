import { computePeaks } from "./audio-analysis";
import { clamp } from "./audio-utils";

export interface AudioFrame {
  freq: Uint8Array;
  wave: Uint8Array;
  /** Overall level 0..1 (average of frequency bins). */
  level: number;
  /** Low-band level 0..1, useful for beat-driven visuals. */
  bass: number;
}

export type EngineEvent = "play" | "pause" | "seek" | "ended" | "load";

/** What the engine needs to schedule one clip of the mix. */
export interface EngineClip {
  id: string;
  assetId: string;
  /** Timeline position of the clip's first audible sample, seconds. */
  start: number;
  /** In/out points within the file, seconds. */
  trimStart: number;
  trimEnd: number;
  volume: number;
  muted: boolean;
}

interface LoadedAudio {
  buffer: AudioBuffer;
  peaks: Float32Array;
}

interface ScheduledClip {
  clipId: string;
  source: AudioBufferSourceNode;
  gain: GainNode;
}

/** Positions that affect scheduling; volume changes don't need a restart. */
const scheduleKey = (clips: EngineClip[]) =>
  clips
    .map((c) => `${c.id}:${c.assetId}:${c.start}:${c.trimStart}:${c.trimEnd}`)
    .join("|");

/**
 * Owns the AudioContext, every decoded file, and the playback clock. Mixes
 * any number of clips placed on the timeline; the analyser listens to the
 * mix, so visualizers react to everything that is audible. This is the
 * single source of truth for the current time — the preview loop, timeline
 * playhead, and export all read from here. Silent projects use the same
 * clock with nothing scheduled.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private monitorGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;

  private loaded = new Map<string, LoadedAudio>();
  private clips: EngineClip[] = [];
  private scheduled: ScheduledClip[] = [];

  private freqData: Uint8Array<ArrayBuffer> = new Uint8Array(1024);
  private waveData: Uint8Array<ArrayBuffer> = new Uint8Array(2048);
  private emptyFrame: AudioFrame = {
    freq: new Uint8Array(1024),
    wave: new Uint8Array(2048).fill(128),
    level: 0,
    bass: 0,
  };

  private playing = false;
  private offset = 0;
  private startedAtCtxTime = 0;
  private silentStartedAt = 0;
  private durationValue = 30;
  private monitorVolume = 1;
  private muted = false;

  private listeners = new Map<EngineEvent, Set<() => void>>();
  private tickHandle: number | null = null;

  /** Project length in seconds; playback stops here. */
  get duration(): number {
    return this.durationValue;
  }

  setDuration(seconds: number) {
    this.durationValue = Math.max(1, seconds);
    if (this.offset > this.durationValue) this.seek(this.durationValue);
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  /** True when at least one scheduled clip has decoded audio behind it. */
  get hasAudio(): boolean {
    return this.clips.some((c) => this.loaded.has(c.assetId));
  }

  isLoaded(assetId: string): boolean {
    return this.loaded.has(assetId);
  }

  getPeaks(assetId: string): Float32Array | null {
    return this.loaded.get(assetId)?.peaks ?? null;
  }

  getFileDuration(assetId: string): number | null {
    return this.loaded.get(assetId)?.buffer.duration ?? null;
  }

  on(event: EngineEvent, fn: () => void): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(fn);
    return () => set.delete(fn);
  }

  private emit(event: EngineEvent) {
    this.listeners.get(event)?.forEach((fn) => fn());
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.7;
      this.monitorGain = this.ctx.createGain();
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.monitorGain);
      this.monitorGain.connect(this.ctx.destination);
      this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.waveData = new Uint8Array(this.analyser.fftSize);
      this.applyGain();
    }
    return this.ctx;
  }

  /** Decodes a file and keeps it keyed by asset id. */
  async load(assetId: string, arrayBuffer: ArrayBuffer): Promise<{ duration: number }> {
    const ctx = this.ensureContext();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    this.loaded.set(assetId, { buffer, peaks: computePeaks(buffer, 2000) });
    this.restartIfPlaying();
    this.emit("load");
    return { duration: buffer.duration };
  }

  unload(assetId: string) {
    if (!this.loaded.delete(assetId)) return;
    this.restartIfPlaying();
    this.emit("load");
  }

  /** Drops every decoded file and stops playback — for a fresh project. */
  unloadAll() {
    this.pause();
    this.offset = 0;
    this.loaded.clear();
    this.clips = [];
    this.emit("load");
    this.emit("seek");
  }

  /** Replaces the clip list. Only position changes interrupt playback. */
  setClips(clips: EngineClip[]) {
    const samePositions = scheduleKey(clips) === scheduleKey(this.clips);
    this.clips = clips;
    if (!this.playing) return;
    if (samePositions) {
      for (const s of this.scheduled) {
        const clip = clips.find((c) => c.id === s.clipId);
        if (clip) s.gain.gain.value = clip.muted ? 0 : clip.volume;
      }
    } else {
      this.restartIfPlaying();
    }
  }

  getCurrentTime(): number {
    if (!this.playing) return this.offset;
    const elapsed = this.ctx
      ? this.ctx.currentTime - this.startedAtCtxTime
      : (performance.now() - this.silentStartedAt) / 1000;
    return clamp(this.offset + elapsed, 0, this.duration);
  }

  async play() {
    if (this.playing) return;
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    if (this.offset >= this.duration - 0.01) this.offset = 0;
    this.startedAtCtxTime = ctx.currentTime;
    this.silentStartedAt = performance.now();
    this.playing = true;
    this.scheduleSources(this.offset);
    this.startTick();
    this.emit("play");
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.getCurrentTime();
    this.stopSources();
    this.playing = false;
    this.stopTick();
    this.emit("pause");
  }

  seek(time: number) {
    const target = clamp(time, 0, this.duration);
    if (this.playing && this.ctx) {
      this.stopSources();
      this.startedAtCtxTime = this.ctx.currentTime;
      this.offset = target;
      this.scheduleSources(target);
    } else {
      this.offset = target;
    }
    this.emit("seek");
  }

  /** Preview-only volume — never affects the exported audio. */
  setMonitorVolume(volume: number) {
    this.monitorVolume = clamp(volume, 0, 1);
    this.applyGain();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
  }

  private applyGain() {
    if (this.monitorGain) {
      this.monitorGain.gain.value = this.muted ? 0 : this.monitorVolume;
    }
  }

  /** Live analyser snapshot of the mix for the current moment. */
  getFrame(): AudioFrame {
    if (!this.analyser || !this.hasAudio) return this.emptyFrame;
    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.waveData);
    let sum = 0;
    for (let i = 0; i < this.freqData.length; i++) sum += this.freqData[i];
    const bassBins = Math.max(4, Math.floor(this.freqData.length * 0.04));
    let bassSum = 0;
    for (let i = 0; i < bassBins; i++) bassSum += this.freqData[i];
    return {
      freq: this.freqData,
      wave: this.waveData,
      level: sum / (this.freqData.length * 255),
      bass: bassSum / (bassBins * 255),
    };
  }

  /**
   * Audio stream for export. Carries the mix regardless of preview mute.
   * Returns null when nothing is loaded.
   */
  getRecordStream(): MediaStream | null {
    if (!this.hasAudio) return null;
    const ctx = this.ensureContext();
    if (!this.recordDest) {
      this.recordDest = ctx.createMediaStreamDestination();
      this.analyser?.connect(this.recordDest);
    }
    return this.recordDest.stream;
  }

  /** Starts a source for every clip audible at or after `from`. */
  private scheduleSources(from: number) {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;
    for (const clip of this.clips) {
      const audio = this.loaded.get(clip.assetId);
      if (!audio) continue;
      const length = clip.trimEnd - clip.trimStart;
      if (clip.start + length <= from) continue;
      const delay = Math.max(0, clip.start - from);
      const intoClip = Math.max(0, from - clip.start);
      const remaining = Math.min(length - intoClip, this.duration - from - delay);
      if (remaining <= 0) continue;

      const source = ctx.createBufferSource();
      source.buffer = audio.buffer;
      const gain = ctx.createGain();
      gain.gain.value = clip.muted ? 0 : clip.volume;
      source.connect(gain);
      gain.connect(this.masterGain);
      source.start(ctx.currentTime + delay, clip.trimStart + intoClip, remaining);
      this.scheduled.push({ clipId: clip.id, source, gain });
    }
  }

  private stopSources() {
    for (const { source, gain } of this.scheduled) {
      try {
        source.stop();
      } catch {
        // Not started yet or already stopped — fine.
      }
      source.disconnect();
      gain.disconnect();
    }
    this.scheduled = [];
  }

  private restartIfPlaying() {
    if (!this.playing || !this.ctx) return;
    const time = this.getCurrentTime();
    this.stopSources();
    this.offset = time;
    this.startedAtCtxTime = this.ctx.currentTime;
    this.scheduleSources(time);
  }

  /** Watches for the end of playback; visual rendering has its own rAF loop. */
  private startTick() {
    const tick = () => {
      if (!this.playing) return;
      if (this.getCurrentTime() >= this.duration - 0.005) {
        this.offset = this.duration;
        this.stopSources();
        this.playing = false;
        this.stopTick();
        this.emit("ended");
        return;
      }
      this.tickHandle = requestAnimationFrame(tick);
    };
    this.tickHandle = requestAnimationFrame(tick);
  }

  private stopTick() {
    if (this.tickHandle !== null) {
      cancelAnimationFrame(this.tickHandle);
      this.tickHandle = null;
    }
  }

  dispose() {
    this.stopSources();
    this.stopTick();
    this.ctx?.close();
    this.ctx = null;
    this.loaded.clear();
    this.listeners.clear();
  }
}

let engine: AudioEngine | null = null;

/** Module-level singleton — the one playback clock shared by the whole app. */
export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}

/** Dev-only handle for inspecting the engine from the browser console. */
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  (window as unknown as { __wavecraftEngine?: () => AudioEngine }).__wavecraftEngine =
    getAudioEngine;
}
