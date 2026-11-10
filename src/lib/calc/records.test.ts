import { describe, expect, it } from "vitest";
import {
  bestOneRepMax,
  computeRecords,
  EMPTY_RECORDS,
  mergeRecords,
  sessionBreaksRecords,
  sessionVolume,
  setBreaksRecords,
  type ExerciseSession,
} from "./records";

const weighted = { isBodyweight: false };
const bodyweight = { isBodyweight: true };

const sessions: ExerciseSession[] = [
  {
    workoutId: "w1",
    startedAt: "2026-10-01T20:00:00Z",
    sets: [
      { weightKg: 60, reps: 8 }, // 1RM 76
      { weightKg: 60, reps: 8 },
      { weightKg: 60, reps: 7 },
    ], // volumen 1380
  },
  {
    workoutId: "w2",
    startedAt: "2026-10-08T20:00:00Z",
    sets: [
      { weightKg: 65, reps: 5 }, // 1RM 75,83
      { weightKg: 62.5, reps: 8 }, // 1RM 79,17
      { weightKg: 62.5, reps: 6 },
    ], // volumen 325 + 500 + 375 = 1200
  },
];

describe("sessionVolume / bestOneRepMax", () => {
  it("volumen = suma de peso × reps", () => {
    expect(sessionVolume(sessions[0].sets)).toBe(1380);
    expect(sessionVolume(sessions[1].sets)).toBe(1200);
  });

  it("mejor 1RM de la sesión, redondeado a 2 decimales", () => {
    expect(bestOneRepMax(sessions[1].sets)).toBe(79.17);
    expect(bestOneRepMax([{ weightKg: 0, reps: 10 }])).toBeNull();
  });
});

describe("computeRecords", () => {
  it("peso máximo, mejor 1RM y mayor volumen", () => {
    const records = computeRecords(sessions, weighted);
    expect(records.maxWeight).toMatchObject({ value: 65, workoutId: "w2" });
    expect(records.bestOneRepMax).toMatchObject({
      value: 79.17,
      workoutId: "w2",
      set: { weightKg: 62.5, reps: 8 },
    });
    expect(records.maxVolume).toMatchObject({ value: 1380, workoutId: "w1", set: null });
    expect(records.maxReps).toBeNull();
  });

  it("ante un empate queda la primera vez", () => {
    const tie = computeRecords(
      [
        { workoutId: "a", startedAt: "2026-01-01", sets: [{ weightKg: 50, reps: 5 }] },
        { workoutId: "b", startedAt: "2026-02-01", sets: [{ weightKg: 50, reps: 5 }] },
      ],
      weighted,
    );
    expect(tie.maxWeight?.workoutId).toBe("a");
  });

  it("peso corporal: reps máximas, sin 1RM ni volumen", () => {
    const records = computeRecords(
      [
        { workoutId: "a", startedAt: "2026-01-01", sets: [{ weightKg: 0, reps: 10 }] },
        { workoutId: "b", startedAt: "2026-02-01", sets: [{ weightKg: 0, reps: 12 }] },
      ],
      bodyweight,
    );
    expect(records.maxReps).toMatchObject({ value: 12, workoutId: "b" });
    expect(records.maxWeight).toBeNull();
    expect(records.bestOneRepMax).toBeNull();
    expect(records.maxVolume).toBeNull();
  });

  it("peso corporal con lastre: las series con peso cuentan para peso y 1RM", () => {
    const records = computeRecords(
      [
        {
          workoutId: "a",
          startedAt: "2026-01-01",
          sets: [
            { weightKg: 0, reps: 12 },
            { weightKg: 10, reps: 6 },
          ],
        },
      ],
      bodyweight,
    );
    expect(records.maxReps?.value).toBe(12);
    expect(records.maxWeight?.value).toBe(10);
    expect(records.maxVolume?.value).toBe(60);
  });

  it("sin sesiones no hay récords", () => {
    expect(computeRecords([], weighted)).toEqual(EMPTY_RECORDS);
  });
});

describe("setBreaksRecords", () => {
  const previous = computeRecords(sessions, weighted);

  it("solo peso máximo: más peso pero 1RM menor", () => {
    // 67,5 × (1 + 5/30) = 78,75 < 79,17
    expect(setBreaksRecords({ weightKg: 67.5, reps: 5 }, previous, weighted)).toEqual([
      { kind: "maxWeight", value: 67.5, previous: 65 },
    ]);
  });

  it("peso máximo y 1RM a la vez", () => {
    // 70 × (1 + 6/30) = 84
    expect(setBreaksRecords({ weightKg: 70, reps: 6 }, previous, weighted)).toEqual([
      { kind: "maxWeight", value: 70, previous: 65 },
      { kind: "bestOneRepMax", value: 84, previous: 79.17 },
    ]);
  });

  it("igualar no es récord", () => {
    expect(setBreaksRecords({ weightKg: 65, reps: 5 }, previous, weighted)).toEqual([]);
  });

  it("solo 1RM: más reps con menos peso", () => {
    expect(setBreaksRecords({ weightKg: 62.5, reps: 10 }, previous, weighted)).toEqual([
      { kind: "bestOneRepMax", value: 83.33, previous: 79.17 },
    ]);
  });

  it("sin historial previo no avisa", () => {
    expect(setBreaksRecords({ weightKg: 100, reps: 5 }, EMPTY_RECORDS, weighted)).toEqual([]);
  });

  it("peso corporal: reps máximas", () => {
    const prev = computeRecords(
      [{ workoutId: "a", startedAt: "2026-01-01", sets: [{ weightKg: 0, reps: 10 }] }],
      bodyweight,
    );
    expect(setBreaksRecords({ weightKg: 0, reps: 11 }, prev, bodyweight)).toEqual([
      { kind: "maxReps", value: 11, previous: 10 },
    ]);
  });
});

describe("mergeRecords", () => {
  it("la siguiente serie se compara contra lo mejor de la sesión", () => {
    const previous = computeRecords(sessions, weighted);
    const merged = mergeRecords(previous, [{ weightKg: 67.5, reps: 5 }], weighted);
    expect(merged.maxWeight?.value).toBe(67.5);
    expect(setBreaksRecords({ weightKg: 67.5, reps: 5 }, merged, weighted)).toEqual([]);
    expect(
      setBreaksRecords({ weightKg: 70, reps: 3 }, merged, weighted).map((r) => r.kind),
    ).toEqual(["maxWeight"]);
  });

  it("no crea récords donde no había historial", () => {
    const merged = mergeRecords(EMPTY_RECORDS, [{ weightKg: 50, reps: 5 }], weighted);
    expect(merged).toEqual(EMPTY_RECORDS);
  });
});

describe("sessionBreaksRecords", () => {
  it("incluye el récord de volumen de la sesión", () => {
    const previous = computeRecords(sessions, weighted);
    const broken = sessionBreaksRecords(
      [
        { weightKg: 60, reps: 10 },
        { weightKg: 60, reps: 10 },
        { weightKg: 60, reps: 9 },
      ],
      previous,
      weighted,
    );
    // Volumen 1740 > 1380; 1RM 60 × (1 + 10/30) = 80 > 79,17.
    expect(broken).toEqual([
      { kind: "bestOneRepMax", value: 80, previous: 79.17 },
      { kind: "maxVolume", value: 1740, previous: 1380 },
    ]);
  });
});
