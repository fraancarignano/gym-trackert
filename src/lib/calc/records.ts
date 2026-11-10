import { estimateOneRepMax } from "./one-rep-max";
import { round2 } from "./volume";

export type RecordSet = { weightKg: number; reps: number };

/** Una sesión terminada de un ejercicio, con sus series. */
export type ExerciseSession = {
  workoutId: string;
  startedAt: string;
  sets: RecordSet[];
};

export type RecordKind = "maxWeight" | "bestOneRepMax" | "maxVolume" | "maxReps";

export type RecordValue = {
  value: number;
  workoutId: string;
  startedAt: string;
  /** Serie que lo logró (no aplica al volumen de sesión). */
  set: RecordSet | null;
};

export type ExerciseRecords = Record<RecordKind, RecordValue | null>;

export const RECORD_LABELS: Record<RecordKind, string> = {
  maxWeight: "Peso máximo",
  bestOneRepMax: "Mejor 1RM estimado",
  maxVolume: "Mayor volumen en una sesión",
  maxReps: "Reps máximas",
};

export const EMPTY_RECORDS: ExerciseRecords = {
  maxWeight: null,
  bestOneRepMax: null,
  maxVolume: null,
  maxReps: null,
};

/** Volumen de un ejercicio en una sesión: suma de peso × reps (peso 0 no suma). */
export function sessionVolume(sets: readonly RecordSet[]): number {
  return round2(sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0));
}

/** Mayor 1RM estimado entre las series (null si todas son de peso corporal). */
export function bestOneRepMax(sets: readonly RecordSet[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    const orm = estimateOneRepMax(s.weightKg, s.reps);
    if (orm !== null && (best === null || orm > best)) best = orm;
  }
  return best === null ? null : round2(best);
}

function better(current: RecordValue | null, candidate: RecordValue): RecordValue {
  return current === null || candidate.value > current.value ? candidate : current;
}

/**
 * Récords personales de un ejercicio a partir de sus sesiones terminadas.
 * - Peso máximo, mejor 1RM y mayor volumen: solo con series con peso (> 0).
 * - Reps máximas: solo para ejercicios de peso corporal, con las series de peso 0.
 * Ante un empate gana la primera vez que se logró.
 */
export function computeRecords(
  sessions: readonly ExerciseSession[],
  options: { isBodyweight: boolean },
): ExerciseRecords {
  const ordered = [...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const records: ExerciseRecords = { ...EMPTY_RECORDS };

  for (const session of ordered) {
    const base = { workoutId: session.workoutId, startedAt: session.startedAt };

    for (const set of session.sets) {
      if (set.weightKg > 0) {
        records.maxWeight = better(records.maxWeight, { ...base, value: set.weightKg, set });
        const orm = estimateOneRepMax(set.weightKg, set.reps)!;
        records.bestOneRepMax = better(records.bestOneRepMax, {
          ...base,
          value: round2(orm),
          set,
        });
      } else if (options.isBodyweight) {
        records.maxReps = better(records.maxReps, { ...base, value: set.reps, set });
      }
    }

    const volume = sessionVolume(session.sets);
    if (volume > 0) {
      records.maxVolume = better(records.maxVolume, { ...base, value: volume, set: null });
    }
  }

  return records;
}

export type BrokenRecord = { kind: RecordKind; value: number; previous: number };

/**
 * Récords que supera una serie recién confirmada, comparando contra los récords
 * previos. Solo cuenta como récord si había un valor previo con el que comparar
 * (la primera vez que se hace un ejercicio no avisa).
 */
export function setBreaksRecords(
  set: RecordSet,
  previous: ExerciseRecords,
  options: { isBodyweight: boolean },
): BrokenRecord[] {
  const broken: BrokenRecord[] = [];

  if (set.weightKg > 0) {
    if (previous.maxWeight && set.weightKg > previous.maxWeight.value) {
      broken.push({ kind: "maxWeight", value: set.weightKg, previous: previous.maxWeight.value });
    }
    const orm = round2(estimateOneRepMax(set.weightKg, set.reps)!);
    if (previous.bestOneRepMax && orm > previous.bestOneRepMax.value) {
      broken.push({ kind: "bestOneRepMax", value: orm, previous: previous.bestOneRepMax.value });
    }
  } else if (options.isBodyweight && previous.maxReps && set.reps > previous.maxReps.value) {
    broken.push({ kind: "maxReps", value: set.reps, previous: previous.maxReps.value });
  }

  return broken;
}

/**
 * Récords que logró una sesión completa frente a las sesiones anteriores
 * (incluye el de volumen, que se evalúa al terminar).
 */
export function sessionBreaksRecords(
  sets: readonly RecordSet[],
  previous: ExerciseRecords,
  options: { isBodyweight: boolean },
): BrokenRecord[] {
  const current = computeRecords(
    [{ workoutId: "current", startedAt: "", sets: [...sets] }],
    options,
  );
  const broken: BrokenRecord[] = [];
  for (const kind of ["maxWeight", "bestOneRepMax", "maxVolume", "maxReps"] as const) {
    const now = current[kind];
    const before = previous[kind];
    if (now && before && now.value > before.value) {
      broken.push({ kind, value: now.value, previous: before.value });
    }
  }
  return broken;
}

/**
 * Combina récords previos con series ya confirmadas en la sesión actual, para
 * que la siguiente serie se compare contra lo mejor hasta ahora. Solo actualiza
 * récords que ya existían: sin historial previo no hay avisos.
 */
export function mergeRecords(
  previous: ExerciseRecords,
  sets: readonly RecordSet[],
  options: { isBodyweight: boolean },
): ExerciseRecords {
  if (sets.length === 0) return previous;
  const current = computeRecords(
    [{ workoutId: "current", startedAt: "9999", sets: [...sets] }],
    options,
  );
  const merged: ExerciseRecords = { ...previous };
  for (const kind of ["maxWeight", "bestOneRepMax", "maxReps"] as const) {
    const now = current[kind];
    const before = previous[kind];
    if (now && before) merged[kind] = better(before, now);
  }
  return merged;
}
