import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { WorkoutEditor } from "@/components/history/workout-editor";
import { WorkoutStats } from "@/components/workout/workout-stats";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { formatDateWithWeekday, formatTime } from "@/lib/format";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Sesión · Gym Tracker" };

export default function WorkoutDetailPage({ params }: PageProps<"/historial/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Sesión" backHref="/historial" />
          <ListSkeleton rows={4} />
        </>
      }
    >
      <WorkoutDetailContent params={params} />
    </Suspense>
  );
}

async function WorkoutDetailContent({
  params,
}: {
  params: PageProps<"/historial/[id]">["params"];
}) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const workout = await getWorkoutDetail(id);
  if (!workout) notFound();
  // Una sesión en curso se edita desde la pantalla en vivo.
  if (!workout.finishedAt) redirect(`/entrenar/${workout.id}`);

  return (
    <>
      <PageHeader title={workout.title} backHref="/historial" backLabel="Volver al historial" />
      <p className="-mt-4 mb-4 text-sm text-muted-foreground first-letter:uppercase">
        {formatDateWithWeekday(workout.startedAt)} · {formatTime(workout.startedAt)} a{" "}
        {formatTime(workout.finishedAt)}
      </p>
      <div className="mb-6">
        <WorkoutStats
          startedAt={workout.startedAt}
          finishedAt={workout.finishedAt}
          setCount={workout.setCount}
          volumeKg={workout.volumeKg}
        />
      </div>
      <WorkoutEditor workout={workout} />
    </>
  );
}
