import { bestOneRepMax, sessionVolume, type ExerciseSession } from "./records";

export type ChartPoint = {
  workoutId: string;
  startedAt: string;
  /** Mejor 1RM estimado de la sesión (null si no hubo series con peso). */
  oneRepMax: number | null;
  /** Peso más alto levantado en la sesión (null si no hubo series con peso). */
  maxWeight: number | null;
  /** Volumen de la sesión en kg. */
  volume: number;
  /** Reps máximas de la sesión en series de peso corporal (peso 0). */
  maxReps: number | null;
};

export type ChartRange = "1m" | "3m" | "6m" | "all";

export const CHART_RANGES: { value: ChartRange; label: string; months: number | null }[] = [
  { value: "1m", label: "1 mes", months: 1 },
  { value: "3m", label: "3 meses", months: 3 },
  { value: "6m", label: "6 meses", months: 6 },
  { value: "all", label: "Todo", months: null },
];

/** Un punto por sesión, en orden cronológico. */
export function buildChartSeries(sessions: readonly ExerciseSession[]): ChartPoint[] {
  return [...sessions]
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((session) => {
      const weighted = session.sets.filter((s) => s.weightKg > 0);
      const bodyweight = session.sets.filter((s) => s.weightKg === 0);
      return {
        workoutId: session.workoutId,
        startedAt: session.startedAt,
        oneRepMax: bestOneRepMax(session.sets),
        maxWeight: weighted.length ? Math.max(...weighted.map((s) => s.weightKg)) : null,
        volume: sessionVolume(session.sets),
        maxReps: bodyweight.length ? Math.max(...bodyweight.map((s) => s.reps)) : null,
      };
    });
}

/** Puntos dentro del rango, contando hacia atrás desde `now`. */
export function filterByRange<T extends { startedAt: string }>(
  points: readonly T[],
  range: ChartRange,
  now: Date = new Date(),
): T[] {
  const months = CHART_RANGES.find((r) => r.value === range)?.months ?? null;
  if (months === null) return [...points];
  const from = new Date(now);
  from.setMonth(from.getMonth() - months);
  return points.filter((p) => new Date(p.startedAt) >= from);
}
