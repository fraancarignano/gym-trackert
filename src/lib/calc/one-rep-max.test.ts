import { describe, expect, it } from "vitest";
import { estimateOneRepMax } from "./one-rep-max";

describe("estimateOneRepMax (Epley)", () => {
  it("peso × (1 + reps / 30)", () => {
    // 100 × (1 + 10/30) = 133,33…
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.333, 3);
    // 60 × (1 + 8/30) = 76
    expect(estimateOneRepMax(60, 8)).toBeCloseTo(76, 6);
  });

  it("con 1 repetición es el peso levantado", () => {
    expect(estimateOneRepMax(120, 1)).toBe(120);
  });

  it("no se calcula para peso corporal (peso 0)", () => {
    expect(estimateOneRepMax(0, 12)).toBeNull();
  });
});
