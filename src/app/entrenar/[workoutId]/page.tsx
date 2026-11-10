import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ListSkeleton } from "@/components/list-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveWorkoutView } from "@/components/workout/live-workout";
import { getCatalog } from "@/lib/data/exercises";
import { getLiveWorkout } from "@/lib/data/workouts";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Entrenando · Gym Tracker" };

export default function LiveWorkoutPage({ params }: PageProps<"/entrenar/[workoutId]">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 pt-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <ListSkeleton rows={3} />
        </div>
      }
    >
      <LiveWorkoutLoader params={params} />
    </Suspense>
  );
}

async function LiveWorkoutLoader({
  params,
}: {
  params: PageProps<"/entrenar/[workoutId]">["params"];
}) {
  const { workoutId } = await params;
  if (!idSchema.safeParse(workoutId).success) notFound();

  const [workout, catalog] = await Promise.all([getLiveWorkout(workoutId), getCatalog()]);
  // Si no existe (por ejemplo, recién descartada o terminada sin series), a Inicio.
  if (!workout) redirect("/");
  if (workout.finishedAt) redirect(`/entrenar/${workout.id}/resumen`);

  return <LiveWorkoutView key={workout.id} workout={workout} catalog={catalog} />;
}
