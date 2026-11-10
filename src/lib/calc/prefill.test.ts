import { describe, expect, it } from "vitest";
import { buildInitialRows, plannedRowCount, suggestSet, type PerformedSet } from "./prefill";

const prev: PerformedSet[] = [
  { setNumber: 1, weightKg: 60, reps: 8 },
  { setNumber: 2, weightKg: 62.5, reps: 7 },
  { setNumber: 3, weightKg: 62.5, reps: 6 },
];

describe("plannedRowCount", () => {
  it("usa el objetivo de la rutina", () => {
    expect(plannedRowCount({ targetSets: 4, previous: prev, confirmed: [] })).toBe(4);
  });

  it("sin objetivo usa las series de la vez anterior", () => {
    expect(plannedRowCount({ targetSets: null, previous: prev, confirmed: [] })).toBe(3);
  });

  it("sin objetivo ni historial arranca con 1 fila", () => {
    expect(plannedRowCount({ targetSets: null, previous: [], confirmed: [] })).toBe(1);
  });

  it("nunca muestra menos filas que la serie confirmada más alta", () => {
    const confirmed = [{ setNumber: 5, weightKg: 60, reps: 8 }];
    expect(plannedRowCount({ targetSets: 3, previous: [], confirmed })).toBe(5);
  });
});

describe("suggestSet", () => {
  const base = { previous: prev, targetRepsMin: 8, isBodyweight: false };

  it("toma la serie con el mismo número", () => {
    expect(suggestSet(2, base)).toEqual({ weightKg: 62.5, reps: 7 });
  });

  it("repite la última serie si hoy hay más filas", () => {
    expect(suggestSet(5, base)).toEqual({ weightKg: 62.5, reps: 6 });
  });

  it("no depende del orden en que llegan las series", () => {
    expect(suggestSet(1, { ...base, previous: [...prev].reverse() })).toEqual({
      weightKg: 60,
      reps: 8,
    });
  });

  it("sin historial: peso vacío y reps en el mínimo del rango", () => {
    expect(suggestSet(1, { previous: [], targetRepsMin: 8, isBodyweight: false })).toEqual({
      weightKg: null,
      reps: 8,
    });
  });

  it("sin historial en sesión libre: todo vacío", () => {
    expect(suggestSet(1, { previous: [], targetRepsMin: null, isBodyweight: false })).toEqual({
      weightKg: null,
      reps: null,
    });
  });

  it("sin historial y de peso corporal: peso 0", () => {
    expect(suggestSet(1, { previous: [], targetRepsMin: null, isBodyweight: true })).toEqual({
      weightKg: 0,
      reps: null,
    });
  });
});

describe("buildInitialRows", () => {
  it("arma las filas con sugerencia y referencia", () => {
    const rows = buildInitialRows({
      targetSets: 4,
      targetRepsMin: 8,
      isBodyweight: false,
      previous: prev,
      confirmed: [],
    });
    expect(rows).toHaveLength(4);
    expect(rows[0]).toMatchObject({
      setNumber: 1,
      values: { weightKg: 60, reps: 8 },
      reference: prev[0],
      confirmed: null,
    });
    // La cuarta fila repite la última serie pero no tiene referencia propia.
    expect(rows[3]).toMatchObject({
      setNumber: 4,
      values: { weightKg: 62.5, reps: 6 },
      reference: null,
    });
  });

  it("al retomar, las filas confirmadas muestran lo guardado", () => {
    const confirmed = [{ setNumber: 1, weightKg: 65, reps: 8 }];
    const rows = buildInitialRows({
      targetSets: 3,
      targetRepsMin: 8,
      isBodyweight: false,
      previous: prev,
      confirmed,
    });
    expect(rows[0].values).toEqual({ weightKg: 65, reps: 8 });
    expect(rows[0].confirmed).toEqual(confirmed[0]);
    expect(rows[1].values).toEqual({ weightKg: 62.5, reps: 7 });
    expect(rows[1].confirmed).toBeNull();
  });
});
