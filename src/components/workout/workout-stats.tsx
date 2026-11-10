import { formatDuration, formatNumber } from "@/lib/format";

/** Duración, series y volumen de una sesión. */
export function WorkoutStats({
  startedAt,
  finishedAt,
  setCount,
  volumeKg,
}: {
  startedAt: string;
  finishedAt: string | null;
  setCount: number;
  volumeKg: number;
}) {
  const stats = [
    {
      label: "Duración",
      value: finishedAt ? formatDuration(Date.parse(finishedAt) - Date.parse(startedAt)) : "—",
    },
    { label: "Series", value: String(setCount) },
    { label: "Volumen", value: `${formatNumber(volumeKg)} kg` },
  ];
  return (
    <dl className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
          <dt className="text-xs text-muted-foreground">{s.label}</dt>
          <dd className="text-lg font-semibold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
