import { describe, expect, it } from "vitest";
import { coverRect, resampleFrequencyBins } from "./canvas-utils";

describe("coverRect", () => {
  it("crops horizontally when the source is wider than the target", () => {
    const r = coverRect(200, 100, 100, 100);
    expect(r).toEqual({ sx: 50, sy: 0, sw: 100, sh: 100 });
  });

  it("crops vertically when the source is taller than the target", () => {
    const r = coverRect(100, 200, 100, 100);
    expect(r).toEqual({ sx: 0, sy: 50, sw: 100, sh: 100 });
  });
});

describe("resampleFrequencyBins", () => {
  it("normalizes byte bins to 0..1", () => {
    const freq = new Uint8Array(100).fill(255);
    const out = new Float32Array(10);
    resampleFrequencyBins(freq, 10, out);
    for (const v of out) expect(v).toBeCloseTo(1);
  });

  it("averages within buckets", () => {
    const freq = new Uint8Array(100);
    freq.fill(100, 0, 75);
    const out = new Float32Array(5);
    resampleFrequencyBins(freq, 5, out);
    expect(out[0]).toBeCloseTo(100 / 255, 2);
  });
});
