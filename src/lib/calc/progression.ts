import type { RecordSet } from "./records";

/**
 * Indicador "Subí peso" (regla fija, sin IA): en la última sesión del ejercicio
 * todas las series llegaron al máximo del rango objetivo con el mismo peso.
 * No aplica sin objetivo, sin historial ni con peso 0 (peso corporal).
 */
export function shouldIncreaseWeight(
  lastSessionSets: readonly RecordSet[],
  targetRepsMax: number | null,
): boolean {
  if (targetRepsMax === null || lastSessionSets.length === 0) return false;
  const weight = lastSessionSets[0].weightKg;
  if (weight <= 0) return false;
  return lastSessionSets.every((s) => s.weightKg === weight && s.reps >= targetRepsMax);
}
