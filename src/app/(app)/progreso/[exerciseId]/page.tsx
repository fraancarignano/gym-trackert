import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { ExerciseProgressView } from "@/components/progress/exercise-progress-view";
import { buildChartSeries } from "@/lib/calc/chart-series";
import { computeRecords } from "@/lib/calc/records";
import { getExerciseProgress } from "@/lib/data/progress";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Progreso · Gym Tracker" };

const RECENT_SESSIONS = 10;

export default function ExerciseProgressPage({ params }: PageProps<"/progreso/[exerciseId]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Progreso" backHref="/progreso" />
          <ListSkeleton rows={4} />
        </>
      }
    >
      <ExerciseProgressContent params={params} />
    </Suspense>
  );
}

async function ExerciseProgressContent({
  params,
}: {
  params: PageProps<"/progreso/[exerciseId]">["params"];
}) {
  const { exerciseId } = await params;
  if (!idSchema.safeParse(exerciseId).success) notFound();

  const progress = await getExerciseProgress(exerciseId);
  if (!progress) notFound();
  const { exercise, sessions } = progress;

  return (
    <>
      <PageHeader title={exercise.name} backHref="/progreso" backLabel="Volver a progreso" />
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        {exercise.muscleGroup} · {exercise.equipment}
      </p>
      {sessions.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Sin sesiones"
          description="Todavía no terminaste ninguna sesión con este ejercicio."
        />
      ) : (
        <ExerciseProgressView
          isBodyweight={exercise.isBodyweight}
          points={buildChartSeries(sessions)}
          records={computeRecords(sessions, { isBodyweight: exercise.isBodyweight })}
          recentSessions={[...sessions].reverse().slice(0, RECENT_SESSIONS)}
        />
      )}
    </>
  );
}
