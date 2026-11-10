import { describe, expect, it } from "vitest";
import { buildWeightSeries, latestValues, weightChange, type BodyMetric } from "./body";

const metric = (
  id: string,
  measuredOn: string,
  values: Partial<Omit<BodyMetric, "id" | "measuredOn">>,
): BodyMetric => ({
  id,
  measuredOn,
  weightKg: null,
  waistCm: null,
  chestCm: null,
  armCm: null,
  thighCm: null,
  hipCm: null,
  ...values,
});

// Cargadas en cualquier orden, como pueden venir de la base o de la UI.
const metrics = [
  metric("c", "2026-11-03", { weightKg: 80.4, waistCm: 85 }),
  metric("a", "2026-10-06", { weightKg: 82 }),
  metric("d", "2026-11-10", { armCm: 36.5 }),
  metric("b", "2026-10-20", { weightKg: 81.2, waistCm: 86.5, chestCm: 102 }),
];

describe("buildWeightSeries", () => {
  it("ordena por fecha ascendente y omite registros sin peso", () => {
    expect(buildWeightSeries(metrics)).toEqual([
      { id: "a", measuredOn: "2026-10-06", value: 82 },
      { id: "b", measuredOn: "2026-10-20", value: 81.2 },
      { id: "c", measuredOn: "2026-11-03", value: 80.4 },
    ]);
  });
});

describe("latestValues", () => {
  it("toma el último valor de cada medida, aunque sea de otra fecha", () => {
    const latest = latestValues(metrics);
    expect(latest.weightKg).toEqual({ value: 80.4, measuredOn: "2026-11-03" });
    expect(latest.waistCm).toEqual({ value: 85, measuredOn: "2026-11-03" });
    expect(latest.chestCm).toEqual({ value: 102, measuredOn: "2026-10-20" });
    expect(latest.armCm).toEqual({ value: 36.5, measuredOn: "2026-11-10" });
    expect(latest.hipCm).toBeNull();
  });
});

describe("weightChange", () => {
  it("diferencia con el registro de peso anterior", () => {
    expect(weightChange(metrics)).toEqual({ delta: -0.8, since: "2026-10-20" });
  });

  it("null con menos de dos pesos", () => {
    expect(weightChange([metric("x", "2026-11-01", { weightKg: 80 })])).toBeNull();
  });
});
