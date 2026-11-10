export type SetLike = { weightKg: number; reps: number };

/** Redondea a 2 decimales (kg). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Volumen total en kg: suma de peso × reps. Las series de peso corporal
 * (peso 0) no suman volumen.
 */
export function totalVolume(sets: readonly SetLike[]): number {
  return round2(sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0));
}
