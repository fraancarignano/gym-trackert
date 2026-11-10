import { RECORD_LABELS, type BrokenRecord, type RecordKind } from "@/lib/calc/records";
import { formatNumber, formatWeight } from "@/lib/format";

/** Valor de un récord con su unidad: "65 kg", "1.740 kg", "12 reps". */
export function formatRecordValue(kind: RecordKind, value: number): string {
  if (kind === "maxReps") return `${value} reps`;
  if (kind === "maxVolume") return `${formatNumber(value)} kg`;
  return formatWeight(value);
}

/** "Peso máximo: 65 kg (antes 62,5 kg)" */
export function describeRecord(record: BrokenRecord): string {
  return `${RECORD_LABELS[record.kind]}: ${formatRecordValue(record.kind, record.value)} (antes ${formatRecordValue(record.kind, record.previous)})`;
}
