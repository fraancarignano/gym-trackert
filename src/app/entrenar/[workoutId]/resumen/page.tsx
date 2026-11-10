import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleCheck, House } from "lucide-react";
import { ListSkeleton } from "@/components/list-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { WorkoutStats } from "@/components/workout/workout-stats";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { formatDateWithWeekday, formatSet } from "@/lib/format";
import { idSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Resumen · Gym Tracker" };

export default function SummaryPage({ params }: PageProps<"/entrenar/[workoutId]/resumen">) {
  return (
    <Suspense fallback={<div className="pt-6"><ListSkeleton rows={4} /></div>}>
      <Summary params={params} />
    </Suspense>
  );
}

async function Summary({
  params,
}: {
  params: PageProps<"/entrenar/[workoutId]/resumen">["params"];
}) {
  const { workoutId } = await params;
  if (!idSchema.safeParse(workoutId).success) notFound();

  const workout = await getWorkoutDetail(workoutId);
  if (!workout) notFound();
  if (!workout.finishedAt) redirect(`/entrenar/${workout.id}`);

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <CircleCheck className="size-12 text-primary" aria-hidden />
        <h1 className="text-2xl font-semibold">¡Entrenamiento terminado!</h1>
        <p className="text-muted-foreground first-letter:uppercase">
          {workout.title} · {formatDateWithWeekday(workout.startedAt)}
        </p>
      </div>

      <WorkoutStats
        startedAt={workout.startedAt}
        finishedAt={workout.finishedAt}
        setCount={workout.setCount}
        volumeKg={workout.volumeKg}
      />

      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
        {workout.exercises.map((exercise) => (
          <li key={exercise.workoutExerciseId} className="flex flex-col gap-1 px-4 py-3">
            <span className="font-medium">{exercise.name}</span>
            <span className="text-sm text-muted-foreground">
              {exercise.sets.map((s) => formatSet(s.weightKg, s.reps)).join(" · ")}
            </span>
          </li>
        ))}
      </ul>

      <Link href="/" className={buttonVariants({ size: "xl", className: "w-full" })}>
        <House />
        Volver al inicio
      </Link>
    </div>
  );
}
