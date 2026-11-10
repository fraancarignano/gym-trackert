export type RoutineForSuggestion = {
  id: string;
  position: number;
  /** Fecha de la última sesión terminada con esta rutina, o null si nunca se hizo. */
  lastDoneAt: string | null;
};

/**
 * Orden de Inicio: primero las rutinas que nunca se hicieron (por `position`),
 * después por la fecha de su última sesión, de la más vieja a la más reciente.
 * La primera es la sugerida.
 */
export function sortRoutinesForHome<T extends RoutineForSuggestion>(routines: readonly T[]): T[] {
  return [...routines].sort((a, b) => {
    if (a.lastDoneAt === null && b.lastDoneAt === null) return a.position - b.position;
    if (a.lastDoneAt === null) return -1;
    if (b.lastDoneAt === null) return 1;
    return a.lastDoneAt.localeCompare(b.lastDoneAt) || a.position - b.position;
  });
}
