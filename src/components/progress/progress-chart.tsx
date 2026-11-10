"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate, formatNumber } from "@/lib/format";

/** Un punto: `id` único (sesión o medición), `startedAt` timestamp ISO y el valor. */
export type ProgressDatum = { id: string; startedAt: string; value: number };

const SERIES = "var(--chart-series)";
const GRID = "var(--border)";
const MUTED = "var(--muted-foreground)";
const SURFACE = "var(--card)";

const shortDate = new Intl.DateTimeFormat("es-AR", {
  timeZone: "America/Argentina/Cordoba",
  day: "2-digit",
  month: "2-digit",
});

/**
 * Gráfico de una sola serie por sesión: línea (1RM, peso, reps) o columnas
 * (volumen). Sin leyenda: el título de la tarjeta dice qué se grafica.
 */
export function ProgressChart({
  title,
  data,
  unit,
  kind = "line",
  lastLabel = "Última",
}: {
  title: string;
  data: ProgressDatum[];
  unit: string;
  kind?: "line" | "bar";
  lastLabel?: string;
}) {
  const last = data.at(-1);
  const byId = new Map(data.map((d) => [d.id, d]));
  const tick = (id: string) => {
    const d = byId.get(id);
    return d ? shortDate.format(new Date(d.startedAt)) : "";
  };
  const axisProps = {
    tick: { fill: MUTED, fontSize: 12 },
    tickLine: false,
    axisLine: false,
  } as const;

  const tooltip = (
    <Tooltip
      content={({ active, payload }) => (
        <ChartTooltip
          active={active}
          pointId={payload?.[0]?.payload?.id}
          unit={unit}
          byId={byId}
        />
      )}
      cursor={
        kind === "line"
          ? { stroke: MUTED, strokeWidth: 1 }
          : { fill: "var(--muted)", opacity: 0.4 }
      }
      isAnimationActive={false}
    />
  );

  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-medium">{title}</span>
        {last && (
          <span className="text-sm text-muted-foreground tabular-nums">
            {lastLabel}: <span className="font-semibold text-foreground">{formatNumber(last.value)} {unit}</span>
          </span>
        )}
      </figcaption>

      <div className="h-48 w-full" role="img" aria-label={`${title}: ${data.length} sesiones`}>
        <ResponsiveContainer width="100%" height="100%">
          {kind === "bar" ? (
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="id" tickFormatter={tick} minTickGap={16} {...axisProps} />
              <YAxis
                width={48}
                tickFormatter={(v: number) => formatNumber(v)}
                allowDecimals={false}
                {...axisProps}
              />
              {tooltip}
              <Bar
                dataKey="value"
                fill={SERIES}
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          ) : (
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="id" tickFormatter={tick} minTickGap={16} {...axisProps} />
              <YAxis
                width={48}
                domain={["auto", "auto"]}
                tickFormatter={(v: number) => formatNumber(v)}
                {...axisProps}
              />
              {tooltip}
              <Line
                dataKey="value"
                type="monotone"
                stroke={SERIES}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={{ r: 4, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: SERIES, stroke: SURFACE, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

function ChartTooltip({
  active,
  pointId,
  unit,
  byId,
}: {
  active?: boolean;
  pointId?: unknown;
  unit: string;
  byId: Map<string, ProgressDatum>;
}) {
  if (!active || typeof pointId !== "string") return null;
  const datum = byId.get(pointId);
  if (!datum) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="text-muted-foreground">{formatDate(datum.startedAt)}</p>
      <p className="font-semibold tabular-nums">
        {formatNumber(datum.value)} {unit}
      </p>
    </div>
  );
}
