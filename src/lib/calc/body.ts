export const MEASUREMENTS = [
  { key: "waistCm", label: "Cintura" },
  { key: "chestCm", label: "Pecho" },
  { key: "armCm", label: "Brazo" },
  { key: "thighCm", label: "Muslo" },
  { key: "hipCm", label: "Cadera" },
] as const;

export type MeasurementKey = (typeof MEASUREMENTS)[number]["key"];

export type BodyMetric = {
  id: string;
  /** Fecha sin hora, "aaaa-mm-dd". */
  measuredOn: string;
  weightKg: number | null;
} & Record<MeasurementKey, number | null>;

export type LatestValue = { value: number; measuredOn: string };

/** Serie del gráfico de peso: solo registros con peso, de la fecha más vieja a la más nueva. */
export function buildWeightSeries(metrics: readonly BodyMetric[]) {
  return metrics
    .filter((m): m is BodyMetric & { weightKg: number } => m.weightKg !== null)
    .map((m) => ({ id: m.id, measuredOn: m.measuredOn, value: m.weightKg }))
    .sort((a, b) => a.measuredOn.localeCompare(b.measuredOn));
}

/**
 * Último valor registrado de cada medida (cada una puede venir de una fecha
 * distinta, porque no todas se miden siempre).
 */
export function latestValues(
  metrics: readonly BodyMetric[],
): Record<"weightKg" | MeasurementKey, LatestValue | null> {
  const newestFirst = [...metrics].sort((a, b) => b.measuredOn.localeCompare(a.measuredOn));
  const pick = (key: "weightKg" | MeasurementKey): LatestValue | null => {
    const found = newestFirst.find((m) => m[key] !== null);
    return found ? { value: found[key]!, measuredOn: found.measuredOn } : null;
  };
  return {
    weightKg: pick("weightKg"),
    waistCm: pick("waistCm"),
    chestCm: pick("chestCm"),
    armCm: pick("armCm"),
    thighCm: pick("thighCm"),
    hipCm: pick("hipCm"),
  };
}

/** Diferencia de peso entre el último registro con peso y el anterior. */
export function weightChange(metrics: readonly BodyMetric[]) {
  const series = buildWeightSeries(metrics);
  if (series.length < 2) return null;
  const last = series[series.length - 1];
  const previous = series[series.length - 2];
  return {
    delta: Math.round((last.value - previous.value) * 100) / 100,
    since: previous.measuredOn,
  };
}
