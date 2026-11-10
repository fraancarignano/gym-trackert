"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  CHART_RANGES,
  filterByRange,
  type ChartPoint,
  type ChartRange,
} from "@/lib/calc/chart-series";
import { RECORD_LABELS, type ExerciseRecords, type RecordKind } from "@/lib/calc/records";
import type { ExerciseSession } from "@/lib/calc/records";
import { formatDate, formatSet } from "@/lib/format";
import { formatRecordValue } from "@/lib/records-format";
import { cn } from "@/lib/utils";
import { ProgressChart, type ProgressDatum } from "./progress-chart";

function series(points: ChartPoint[], pick: (p: ChartPoint) => number | null): ProgressDatum[] {
  return points.flatMap((p) => {
    const value = pick(p);
    return value === null ? [] : [{ id: p.workoutId, startedAt: p.startedAt, value }];
  });
}

export function ExerciseProgressView({
  isBodyweight,
  points,
  records,
  recentSessions,
}: {
  isBodyweight: boolean;
  points: ChartPoint[];
  records: ExerciseRecords;
  recentSessions: ExerciseSession[];
}) {
  const [range, setRange] = useState<ChartRange>("3m");
  const visible = filterByRange(points, range);

  const oneRepMax = series(visible, (p) => p.oneRepMax);
  const maxWeight = series(visible, (p) => p.maxWeight);
  const volume = series(visible, (p) => (p.volume > 0 ? p.volume : null));
  const maxReps = series(visible, (p) => p.maxReps);

  const recordKinds: RecordKind[] = [
    ...(isBodyweight ? (["maxReps"] as const) : []),
    "maxWeight",
    "bestOneRepMax",
    "maxVolume",
  ];
  const shownRecords = recordKinds.filter((k) => records[k] !== null);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="records-title" className="flex flex-col gap-3">
        <h2 id="records-title" className="text-lg font-semibold">
          Récords
        </h2>
        <dl className="grid grid-cols-2 gap-2">
          {shownRecords.map((kind) => {
            const record = records[kind]!;
            return (
              <div key={kind} className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3">
                <dt className="text-xs text-muted-foreground">{RECORD_LABELS[kind]}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatRecordValue(kind, record.value)}
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {record.set && kind !== "maxWeight" && kind !== "maxReps"
                    ? `${formatSet(record.set.weightKg, record.set.reps)} · `
                    : ""}
                  {formatDate(record.startedAt)}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section aria-labelledby="charts-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="charts-title" className="text-lg font-semibold">
            Evolución
          </h2>
          <div role="group" aria-label="Rango de fechas" className="flex gap-1 rounded-lg border border-border p-1">
            {CHART_RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={range === r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "h-8 rounded-md px-2.5 text-sm font-medium transition-colors",
                  range === r.value
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No hay sesiones en este período.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {isBodyweight && maxReps.length > 0 && (
              <ProgressChart title="Reps máximas por sesión" data={maxReps} unit="reps" />
            )}
            {oneRepMax.length > 0 && (
              <ProgressChart title="1RM estimado" data={oneRepMax} unit="kg" />
            )}
            {maxWeight.length > 0 && (
              <ProgressChart title="Peso máximo" data={maxWeight} unit="kg" />
            )}
            {volume.length > 0 && (
              <ProgressChart title="Volumen por sesión" data={volume} unit="kg" kind="bar" />
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="sessions-title" className="flex flex-col gap-3">
        <h2 id="sessions-title" className="text-lg font-semibold">
          Últimas sesiones
        </h2>
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {recentSessions.map((session) => (
            <li key={session.workoutId}>
              <Link
                href={`/historial/${session.workoutId}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{formatDate(session.startedAt)}</span>
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {session.sets.map((s) => formatSet(s.weightKg, s.reps)).join(" · ")}
                  </span>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
