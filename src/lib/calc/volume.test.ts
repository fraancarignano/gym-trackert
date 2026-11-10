import { describe, expect, it } from "vitest";
import { round2, totalVolume } from "./volume";

describe("totalVolume", () => {
  it("suma peso × reps", () => {
    expect(
      totalVolume([
        { weightKg: 60, reps: 8 },
        { weightKg: 62.5, reps: 6 },
      ]),
    ).toBe(855);
  });

  it("las series de peso corporal no suman", () => {
    expect(totalVolume([{ weightKg: 0, reps: 12 }])).toBe(0);
  });

  it("sin series es 0", () => {
    expect(totalVolume([])).toBe(0);
  });

  it("evita errores de punto flotante", () => {
    expect(totalVolume([{ weightKg: 22.1, reps: 3 }])).toBe(66.3);
  });
});

describe("round2", () => {
  it("redondea a 2 decimales", () => {
    expect(round2(1.005 * 1000) / 1000).toBeCloseTo(1.005, 3);
    expect(round2(2.499)).toBe(2.5);
  });
});
