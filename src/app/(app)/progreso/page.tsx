import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getProgressList } from "@/lib/data/progress";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Progreso · Gym Tracker" };

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Progreso" />
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <ProgressList />
      </Suspense>
    </>
  );
}

async function ProgressList() {
  const items = await getProgressList();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sin datos todavía"
        description="Cuando termines sesiones, vas a ver tu progreso por ejercicio."
      />
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
      {items.map((item) => (
        <li key={item.exerciseId}>
          <Link
            href={`/progreso/${item.exerciseId}`}
            className="flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-muted/50"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium">{item.name}</span>
              <span className="text-sm text-muted-foreground">
                {item.muscleGroup} · {item.sessionCount}{" "}
                {item.sessionCount === 1 ? "sesión" : "sesiones"} · última {formatDate(item.lastDoneAt)}
              </span>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
