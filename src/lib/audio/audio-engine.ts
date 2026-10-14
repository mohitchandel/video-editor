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

/**
 * Owns the AudioContext, decoded buffer, and the playback clock. This is the
 * single source of truth for the current time — the preview loop, timeline
 * playhead, and export all read from here. Works without audio too: a
 * performance.now()-based clock drives silent projects.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private masterGain: GainNode | null = null;
  private monitorGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;

  private peaks: Float32Array | null = null;
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
  private durationOverride = 30;
  private trimStart = 0;
  private trimEnd: number | null = null;
  private volume = 1;
  private monitorVolume = 1;
  private muted = false;

  private listeners = new Map<EngineEvent, Set<() => void>>();
  private tickHandle: number | null = null;

  /** Duration of the loaded audio, or the project duration when silent. */
  get duration(): number {
    return this.buffer ? this.buffer.duration : this.durationOverride;
  }

  /**
   * Playable window in file time. Playback starts, loops back to, and stops
   * within it; everything outside is trimmed off. Times reported by the
   * engine stay in file time so layers keep their absolute positions.
   */
  getRange(): { start: number; end: number } {
    return {
      start: this.buffer ? this.trimStart : 0,
      end: this.buffer
        ? clamp(this.trimEnd ?? this.duration, this.trimStart, this.duration)
        : this.duration,
    };
  }

  /** Narrows playback to [start, end] seconds of the file (end null = EOF). */
  setTrim(start: number, end: number | null) {
    if (!this.buffer) return;
    const total = this.buffer.duration;
    const nextStart = clamp(start, 0, total);
    const nextEnd = end === null ? null : clamp(end, nextStart, total);
    if (nextStart === this.trimStart && nextEnd === this.trimEnd) return;
    this.trimStart = nextStart;
    this.trimEnd = nextEnd;
    // Re-seek so the clock and any running source respect the new window.
    this.seek(this.getCurrentTime());
  }

  get hasAudio(): boolean {
    return this.buffer !== null;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  getPeaks(): Float32Array | null {
    return this.peaks;
  }

  /** Project duration used when no audio is loaded. */
  setSilentDuration(seconds: number) {
    this.durationOverride = Math.max(1, seconds);
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
    }
    return this.ctx;
  }

  async load(arrayBuffer: ArrayBuffer): Promise<{ duration: number }> {
    const ctx = this.ensureContext();
    this.stopSource();
    this.playing = false;
    this.buffer = await ctx.decodeAudioData(arrayBuffer);
    this.peaks = computePeaks(this.buffer, 2000);
    this.offset = 0;
    this.trimStart = 0;
    this.trimEnd = null;
    this.emit("load");
    return { duration: this.buffer.duration };
  }

  unload() {
    this.stopSource();
    this.playing = false;
    this.buffer = null;
    this.peaks = null;
    this.offset = 0;
    this.emit("load");
  }

  getCurrentTime(): number {
    if (!this.playing) return this.offset;
    if (this.buffer && this.ctx) {
      return clamp(
        this.offset + (this.ctx.currentTime - this.startedAtCtxTime),
        0,
        this.duration,
      );
    }
    return clamp(
      this.offset + (performance.now() - this.silentStartedAt) / 1000,
      0,
      this.duration,
    );
  }

  async play() {
    if (this.playing) return;
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") await ctx.resume();
    const { start, end } = this.getRange();
    if (this.offset < start || this.offset >= end - 0.01) this.offset = start;

    if (this.buffer) {
      this.startSource(this.offset);
      this.startedAtCtxTime = ctx.currentTime;
    } else {
      this.silentStartedAt = performance.now();
    }
    this.playing = true;
    this.startTick();
    this.emit("play");
  }

  pause() {
    if (!this.playing) return;
    this.offset = this.getCurrentTime();
    this.stopSource();
    this.playing = false;
    this.stopTick();
    this.emit("pause");
  }

  seek(time: number) {
    const { start, end } = this.getRange();
    const target = clamp(time, start, end);
    if (this.playing && this.buffer && this.ctx) {
      this.stopSource();
      this.startSource(target);
      this.startedAtCtxTime = this.ctx.currentTime;
    } else if (this.playing) {
      this.silentStartedAt = performance.now();
    }
    this.offset = target;
    this.emit("seek");
  }

  /** Track volume — part of the mix, heard in exports. */
  setVolume(volume: number) {
    this.volume = clamp(volume, 0, 1);
    this.applyGain();
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
    if (this.masterGain) this.masterGain.gain.value = this.volume;
    if (this.monitorGain) {
      this.monitorGain.gain.value = this.muted ? 0 : this.monitorVolume;
    }
  }

  /** Live analyser snapshot for the current moment. */
  getFrame(): AudioFrame {
    if (!this.analyser || !this.buffer) return this.emptyFrame;
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
   * Audio stream for export. Carries the song regardless of preview mute.
   * Returns null when no audio is loaded.
   */
  getRecordStream(): MediaStream | null {
    if (!this.buffer) return null;
    const ctx = this.ensureContext();
    if (!this.recordDest) {
      this.recordDest = ctx.createMediaStreamDestination();
      this.analyser?.connect(this.recordDest);
    }
    return this.recordDest.stream;
  }

  private startSource(fromTime: number) {
    if (!this.buffer || !this.ctx || !this.masterGain) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.masterGain);
    // Stop at the out point even if the tick loop lags a frame.
    source.start(0, fromTime, Math.max(0, this.getRange().end - fromTime));
    this.source = source;
  }

  private stopSource() {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // Already stopped — fine.
      }
      this.source.disconnect();
      this.source = null;
    }
  }

  /** Watches for the end of playback; visual rendering has its own rAF loop. */
  private startTick() {
    const tick = () => {
      if (!this.playing) return;
      const { end } = this.getRange();
      if (this.getCurrentTime() >= end - 0.005) {
        this.offset = end;
        this.stopSource();
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
    this.stopSource();
    this.stopTick();
    this.ctx?.close();
    this.ctx = null;
    this.buffer = null;
    this.listeners.clear();
  }
}

let engine: AudioEngine | null = null;

/** Module-level singleton — the one playback clock shared by the whole app. */
export function getAudioEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}
