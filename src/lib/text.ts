/** Minúsculas y sin tildes, para buscar sin importar acentos ("jalon" encuentra "Jalón"). */
export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** Escapa los comodines de LIKE/ILIKE para comparar texto literal. */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** "4 × 8–10" o "4 × 8" si el rango es de un solo valor. */
export function formatTarget(sets: number, repsMin: number, repsMax: number) {
  const reps = repsMin === repsMax ? `${repsMin}` : `${repsMin}–${repsMax}`;
  return `${sets} × ${reps}`;
}
