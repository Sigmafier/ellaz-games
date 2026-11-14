import { describe, expect, it } from "vitest";
import { RING_MS, pianoSpec, ringMs, warmthFor } from "./sound";

describe("the piano voice", () => {
  it("is the same object for the same key", () => {
    expect(pianoSpec(60, false)).toBe(pianoSpec(60, false));
    expect(pianoSpec(60, true)).not.toBe(pianoSpec(60, false));
  });

  it("rings longer with the pedal down, about three times", () => {
    expect(ringMs(60, true) / ringMs(60, false)).toBeCloseTo(RING_MS.sustain / RING_MS.dry, 5);
    expect(RING_MS.sustain / RING_MS.dry).toBeGreaterThan(2.5);
    expect(RING_MS.sustain / RING_MS.dry).toBeLessThan(3.5);
  });

  it("rings longer and darker low than high, inside its clamps", () => {
    expect(ringMs(36, false)).toBeGreaterThan(ringMs(84, false));
    expect(ringMs(36, false)).toBeLessThanOrEqual(RING_MS.dry * 2);
    expect(ringMs(96, false)).toBeGreaterThanOrEqual(RING_MS.dry * 0.45);
    expect(warmthFor(36)).toBeLessThan(warmthFor(84));
  });

  it("is tuned to the key it was asked for", () => {
    expect(pianoSpec(69, false).freq).toBeCloseTo(440, 6);
  });
});
