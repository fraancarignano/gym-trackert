import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleCheck, House, Trophy } from "lucide-react";
import { ListSkeleton } from "@/components/list-skeleton";
import { buttonVariants } from "@/components/ui/button";
import { WorkoutStats } from "@/components/workout/workout-stats";
import { getAchievedRecords } from "@/lib/data/progress";
import { getWorkoutDetail } from "@/lib/data/workouts";
import { describeRecord } from "@/lib/records-format";
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
  const achieved = await getAchievedRecords(workout);

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

      {achieved.length > 0 && (
        <section
          aria-labelledby="records-title"
          className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
        >
          <h2 id="records-title" className="flex items-center gap-2 font-semibold">
            <Trophy className="size-5 text-primary" aria-hidden />
            Récords logrados
          </h2>
          <ul className="flex flex-col gap-2">
            {achieved.map((item) => (
              <li key={item.exerciseName} className="flex flex-col gap-0.5">
                <span className="font-medium">{item.exerciseName}</span>
                {item.records.map((record) => (
                  <span key={record.kind} className="text-sm text-muted-foreground">
                    {describeRecord(record)}
                  </span>
                ))}
              </li>
            ))}
          </ul>
        </section>
      )}

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
