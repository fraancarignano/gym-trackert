import { describe, expect, it } from "vitest";
import { buildChartSeries, filterByRange } from "./chart-series";

describe("buildChartSeries", () => {
  it("un punto por sesión en orden cronológico", () => {
    const points = buildChartSeries([
      {
        workoutId: "w2",
        startedAt: "2026-10-08T20:00:00Z",
        sets: [
          { weightKg: 65, reps: 5 },
          { weightKg: 62.5, reps: 8 },
        ],
      },
      { workoutId: "w1", startedAt: "2026-10-01T20:00:00Z", sets: [{ weightKg: 60, reps: 8 }] },
    ]);
    expect(points.map((p) => p.workoutId)).toEqual(["w1", "w2"]);
    expect(points[1]).toEqual({
      workoutId: "w2",
      startedAt: "2026-10-08T20:00:00Z",
      oneRepMax: 79.17,
      maxWeight: 65,
      volume: 825,
      maxReps: null,
    });
  });

  it("peso corporal: reps máximas, sin 1RM ni peso", () => {
    const [point] = buildChartSeries([
      {
        workoutId: "w",
        startedAt: "2026-10-01",
        sets: [
          { weightKg: 0, reps: 10 },
          { weightKg: 0, reps: 12 },
        ],
      },
    ]);
    expect(point).toMatchObject({ oneRepMax: null, maxWeight: null, volume: 0, maxReps: 12 });
  });
});

describe("filterByRange", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  const points = buildChartSeries(
    ["2026-04-01", "2026-06-15", "2026-09-01", "2026-10-20", "2026-11-09"].map((d, i) => ({
      workoutId: `w${i}`,
      startedAt: `${d}T20:00:00Z`,
      sets: [{ weightKg: 50, reps: 5 }],
    })),
  );

  it("filtra por meses hacia atrás", () => {
    expect(filterByRange(points, "1m", now).map((p) => p.workoutId)).toEqual(["w3", "w4"]);
    expect(filterByRange(points, "3m", now)).toHaveLength(3);
    expect(filterByRange(points, "6m", now)).toHaveLength(4);
    expect(filterByRange(points, "all", now)).toHaveLength(5);
  });
});
