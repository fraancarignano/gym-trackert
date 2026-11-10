export type MoveDirection = "up" | "down";

/**
 * Devuelve una copia de `ids` con `id` movido una posición hacia arriba o abajo.
 * Si el id no está o ya está en el extremo, devuelve el mismo orden.
 */
export function moveItem<T>(ids: readonly T[], id: T, direction: MoveDirection): T[] {
  const result = [...ids];
  const from = result.indexOf(id);
  if (from === -1) return result;
  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= result.length) return result;
  [result[from], result[to]] = [result[to], result[from]];
  return result;
}
