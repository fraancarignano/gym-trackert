/** Una serie hecha (de la sesión anterior o de la actual). */
export type PerformedSet = { setNumber: number; weightKg: number; reps: number };

/** Valores sugeridos para una fila: null = campo vacío. */
export type SuggestedValues = { weightKg: number | null; reps: number | null };

export type RowsInput = {
  /** Series objetivo de la rutina; null en sesión libre o ejercicio agregado. */
  targetSets: number | null;
  /** Mínimo del rango de reps objetivo; null si no hay objetivo. */
  targetRepsMin: number | null;
  /** Ejercicio de peso corporal: sin historial, el peso arranca en 0. */
  isBodyweight: boolean;
  /** Series de la última sesión terminada con este ejercicio, por número. */
  previous: PerformedSet[];
  /** Series ya confirmadas en la sesión actual. */
  confirmed: PerformedSet[];
};

export type InitialRow = {
  setNumber: number;
  /** Lo que se muestra en la fila: lo confirmado o la sugerencia. */
  values: SuggestedValues;
  /** La serie de la vez anterior con el mismo número ("Anterior: 60 kg × 8"). */
  reference: PerformedSet | null;
  /** Serie ya guardada en esta sesión, si la hay. */
  confirmed: PerformedSet | null;
};

const byNumber = (a: PerformedSet, b: PerformedSet) => a.setNumber - b.setNumber;

/**
 * Cantidad de filas: el objetivo de la rutina; sin objetivo, las series de la
 * vez anterior (o 1 si nunca se hizo). Nunca menos que la serie confirmada más alta.
 */
export function plannedRowCount(input: Pick<RowsInput, "targetSets" | "previous" | "confirmed">) {
  const base = input.targetSets ?? Math.max(input.previous.length, 1);
  const highestConfirmed = Math.max(0, ...input.confirmed.map((s) => s.setNumber));
  return Math.max(base, highestConfirmed);
}

/**
 * Sugerencia para la fila `setNumber` (1..n) según las reglas de precarga:
 * - Con historial: el peso y las reps de la serie con el mismo número; si hoy
 *   hay más filas que la vez anterior, se repite la última serie.
 * - Sin historial: peso vacío (0 si es de peso corporal) y reps en el mínimo
 *   del rango objetivo (vacío en sesión libre).
 */
export function suggestSet(
  setNumber: number,
  input: Pick<RowsInput, "previous" | "targetRepsMin" | "isBodyweight">,
): SuggestedValues {
  const previous = [...input.previous].sort(byNumber);
  if (previous.length > 0) {
    const source = previous[Math.min(setNumber, previous.length) - 1];
    return { weightKg: source.weightKg, reps: source.reps };
  }
  return {
    weightKg: input.isBodyweight ? 0 : null,
    reps: input.targetRepsMin,
  };
}

/** Filas iniciales de un ejercicio en la sesión en vivo (al empezar o al retomar). */
export function buildInitialRows(input: RowsInput): InitialRow[] {
  const previous = [...input.previous].sort(byNumber);
  const count = plannedRowCount(input);

  return Array.from({ length: count }, (_, i) => {
    const setNumber = i + 1;
    const confirmed = input.confirmed.find((s) => s.setNumber === setNumber) ?? null;
    return {
      setNumber,
      values: confirmed
        ? { weightKg: confirmed.weightKg, reps: confirmed.reps }
        : suggestSet(setNumber, input),
      reference: previous.find((s) => s.setNumber === setNumber) ?? null,
      confirmed,
    };
  });
}
