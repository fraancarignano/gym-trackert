"use client";

import { useState } from "react";
import { ChevronRight, Plus, Scale } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ProgressChart } from "@/components/progress/progress-chart";
import { Button } from "@/components/ui/button";
import {
  buildWeightSeries,
  latestValues,
  MEASUREMENTS,
  weightChange,
  type BodyMetric,
} from "@/lib/calc/body";
import { CHART_RANGES, filterByRange, type ChartRange } from "@/lib/calc/chart-series";
import {
  formatIsoDate,
  formatNumber,
  formatWeight,
  isoDateToTimestamp,
  todayIsoDate,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { BodyMetricDialog } from "./body-metric-dialog";

function summary(metric: BodyMetric) {
  const parts: string[] = [];
  if (metric.weightKg !== null) parts.push(formatWeight(metric.weightKg));
  for (const { key, label } of MEASUREMENTS) {
    const value = metric[key];
    if (value !== null) parts.push(`${label.toLowerCase()} ${formatNumber(value)}`);
  }
  return parts.join(" · ");
}

export function BodyView({ metrics }: { metrics: BodyMetric[] }) {
  const [range, setRange] = useState<ChartRange>("3m");

  const today = todayIsoDate();
  const todays = metrics.find((m) => m.measuredOn === today) ?? null;
  const latest = latestValues(metrics);
  const change = weightChange(metrics);
  const weightPoints = buildWeightSeries(metrics).map((p) => ({
    id: p.id,
    startedAt: isoDateToTimestamp(p.measuredOn),
    value: p.value,
  }));
  const visible = filterByRange(weightPoints, range);
  const measured = MEASUREMENTS.filter(({ key }) => latest[key] !== null);

  const registerButton = (
    <BodyMetricDialog
      metric={todays}
      lastMetric={metrics[0] ?? null}
      trigger={
        <Button size="xl" className="w-full">
          <Plus />
          {todays ? "Editar medición de hoy" : "Registrar medición de hoy"}
        </Button>
      }
    />
  );

  if (metrics.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyState
          icon={Scale}
          title="Sin mediciones"
          description="Registrá tu peso corporal y tus medidas para ver cómo evolucionan."
        />
        {registerButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="latest-title" className="flex flex-col gap-3">
        <h2 id="latest-title" className="sr-only">
          Último registro
        </h2>
        {latest.weightKg && (
          <div className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4">
            <span className="text-sm text-muted-foreground">Peso</span>
            <span className="text-3xl font-semibold tabular-nums">
              {formatWeight(latest.weightKg.value)}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatIsoDate(latest.weightKg.measuredOn)}
              {change &&
                ` · ${change.delta > 0 ? "+" : ""}${formatNumber(change.delta)} kg desde el ${formatIsoDate(change.since)}`}
            </span>
          </div>
        )}
        {measured.length > 0 && (
          <dl className="grid grid-cols-2 gap-2">
            {measured.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-0.5 rounded-xl border border-border bg-card p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {formatNumber(latest[key]!.value)} cm
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {formatIsoDate(latest[key]!.measuredOn)}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {registerButton}
      </section>

      {weightPoints.length > 0 && (
        <section aria-labelledby="weight-chart-title" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="weight-chart-title" className="text-lg font-semibold">
              Peso corporal
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
              No hay registros de peso en este período.
            </p>
          ) : (
            <ProgressChart title="Peso (kg)" data={visible} unit="kg" lastLabel="Último" />
          )}
        </section>
      )}

      <section aria-labelledby="history-title" className="flex flex-col gap-3">
        <h2 id="history-title" className="text-lg font-semibold">
          Registros
        </h2>
        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {metrics.map((metric) => (
            <li key={metric.id}>
              <BodyMetricDialog
                metric={metric}
                trigger={
                  <button
                    type="button"
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{formatIsoDate(metric.measuredOn)}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">{summary(metric)}</span>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
