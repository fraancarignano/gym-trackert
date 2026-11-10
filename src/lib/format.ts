export const TIME_ZONE = "America/Argentina/Cordoba";

const numberFormat = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

const dateFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const weekdayFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE,
  weekday: "short",
});

const timeFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** 62,5 · 1.250 (formato argentino, hasta 2 decimales). */
export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

/** "62,5 kg" */
export function formatWeight(kg: number): string {
  return `${formatNumber(kg)} kg`;
}

/** "60 kg × 8" */
export function formatSet(weightKg: number, reps: number): string {
  return `${formatWeight(weightKg)} × ${reps}`;
}

/** "10/11/2026" en hora de Córdoba. */
export function formatDate(value: string | Date): string {
  return dateFormat.format(new Date(value));
}

/** Fecha sin hora ("2026-11-10", columnas `date`) a "10/11/2026", sin pasar por zonas horarias. */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Fecha sin hora a un instante del mediodía UTC de ese día, para usarla donde se
 * espera un timestamp (gráficos, rangos) sin que la zona horaria la corra de día.
 */
export function isoDateToTimestamp(isoDate: string): string {
  return `${isoDate.slice(0, 10)}T12:00:00Z`;
}

/** Hoy en Córdoba como "aaaa-mm-dd" (para inputs de fecha y columnas `date`). */
export function todayIsoDate(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** "lun 10/11/2026" */
export function formatDateWithWeekday(value: string | Date): string {
  const weekday = weekdayFormat.format(new Date(value)).replace(".", "");
  return `${weekday} ${formatDate(value)}`;
}

/** "18:05" */
export function formatTime(value: string | Date): string {
  return timeFormat.format(new Date(value));
}

/** Duración legible: "45 min", "1 h 05 min". */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

/** Cronómetro: "05:09" o "1:02:03". */
export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Número a texto editable con coma decimal: 62.5 → "62,5", null → "". */
export function toInputValue(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

/** Texto ingresado a número (acepta coma o punto). "" o inválido → null. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "" || normalized === ".") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
