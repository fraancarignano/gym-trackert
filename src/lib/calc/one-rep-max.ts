/**
 * 1RM estimado con la fórmula de Epley: peso × (1 + reps / 30).
 * Con 1 repetición el 1RM es el peso levantado. Con peso 0 (peso corporal)
 * no se calcula: devuelve null.
 */
export function estimateOneRepMax(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
