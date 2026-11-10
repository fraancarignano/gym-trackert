import { describe, expect, it } from "vitest";
import { buildChartSeries, filterByRange } from "./chart-series";
import { computeRecords, type ExerciseSession } from "./records";

// Mismos datos de prueba que se cargaron en la base para la Fase 3 (nota
// "DATOS DE PRUEBA"). Los valores esperados están calculados a mano.

const session = (id: string, date: string, sets: [number, number][]): ExerciseSession => ({
  workoutId: id,
  startedAt: `${date}T22:00:00Z`,
  sets: sets.map(([weightKg, reps]) => ({ weightKg, reps })),
});

const remo = [
  session("r1", "2026-07-15", [[50, 10], [50, 10], [50, 9]]),
  session("r2", "2026-08-12", [[55, 8], [55, 8], [55, 7]]),
  session("r3", "2026-09-09", [[57.5, 8], [57.5, 7], [57.5, 6]]),
  session("r4", "2026-10-07", [[60, 6], [57.5, 8], [57.5, 8]]),
  session("r5", "2026-10-28", [[60, 8], [60, 8], [60, 8]]),
  session("r6", "2026-11-04", [[62.5, 6], [62.5, 5], [60, 7]]),
];

const dominadas = [
  session("d1", "2026-09-02", [[0, 8], [0, 7], [0, 6]]),
  session("d2", "2026-09-30", [[0, 9], [0, 8], [0, 7]]),
  session("d3", "2026-10-21", [[0, 10], [0, 9], [0, 8], [5, 5]]),
  session("d4", "2026-11-05", [[0, 11], [0, 10], [0, 9]]),
];

describe("Remo con barra (cálculo manual)", () => {
  const points = buildChartSeries(remo);

  it("1RM estimado por sesión", () => {
    // 50×(1+10/30)=66,67 · 55×(1+8/30)=69,67 · 57,5×(1+8/30)=72,83
    // 57,5×(1+8/30)=72,83 · 60×(1+8/30)=76 · 62,5×(1+6/30)=75
    expect(points.map((p) => p.oneRepMax)).toEqual([66.67, 69.67, 72.83, 72.83, 76, 75]);
  });

  it("peso máximo por sesión", () => {
    expect(points.map((p) => p.maxWeight)).toEqual([50, 55, 57.5, 60, 60, 62.5]);
  });

  it("volumen por sesión", () => {
    expect(points.map((p) => p.volume)).toEqual([1450, 1265, 1207.5, 1280, 1440, 1107.5]);
  });

  it("récords", () => {
    const records = computeRecords(remo, { isBodyweight: false });
    expect(records.maxWeight).toMatchObject({ value: 62.5, workoutId: "r6" });
    expect(records.bestOneRepMax).toMatchObject({
      value: 76,
      workoutId: "r5",
      set: { weightKg: 60, reps: 8 },
    });
    expect(records.maxVolume).toMatchObject({ value: 1450, workoutId: "r1" });
    expect(records.maxReps).toBeNull();
  });

  it("rangos al 10/11/2026", () => {
    const now = new Date("2026-11-10T15:00:00Z");
    expect(filterByRange(points, "1m", now).map((p) => p.workoutId)).toEqual(["r5", "r6"]);
    expect(filterByRange(points, "3m", now).map((p) => p.workoutId)).toEqual([
      "r2",
      "r3",
      "r4",
      "r5",
      "r6",
    ]);
    expect(filterByRange(points, "6m", now)).toHaveLength(6);
  });
});

describe("Dominadas (cálculo manual)", () => {
  it("reps máximas por sesión y récords con lastre", () => {
    const points = buildChartSeries(dominadas);
    expect(points.map((p) => p.maxReps)).toEqual([8, 9, 10, 11]);
    expect(points.map((p) => p.oneRepMax)).toEqual([null, null, 5.83, null]);

    const records = computeRecords(dominadas, { isBodyweight: true });
    expect(records.maxReps).toMatchObject({ value: 11, workoutId: "d4" });
    expect(records.maxWeight).toMatchObject({ value: 5, workoutId: "d3" });
    expect(records.bestOneRepMax).toMatchObject({ value: 5.83, workoutId: "d3" });
    expect(records.maxVolume).toMatchObject({ value: 25, workoutId: "d3" });
  });
});
