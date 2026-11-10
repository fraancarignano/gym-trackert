import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, History } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getWorkoutHistory } from "@/lib/data/workouts";
import { formatDateWithWeekday, formatDuration, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Historial · Gym Tracker" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="Historial" />
      <Suspense fallback={<ListSkeleton rows={5} />}>
        <HistoryList />
      </Suspense>
    </>
  );
}

async function HistoryList() {
  const workouts = await getWorkoutHistory();

  if (workouts.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin sesiones"
        description="Tus entrenamientos terminados van a aparecer acá."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {workouts.map((w) => (
        <li key={w.id}>
          <Link
            href={`/historial/${w.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm text-muted-foreground first-letter:uppercase">
                {formatDateWithWeekday(w.startedAt)}
              </span>
              <span className="truncate font-medium">{w.title}</span>
              <span className="text-sm text-muted-foreground">
                {formatDuration(Date.parse(w.finishedAt) - Date.parse(w.startedAt))} ·{" "}
                {w.setCount} {w.setCount === 1 ? "serie" : "series"} ·{" "}
                {formatNumber(w.volumeKg)} kg
              </span>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
