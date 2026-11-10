import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExerciseCatalog } from "@/components/exercises/exercise-catalog";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getCatalog } from "@/lib/data/exercises";
import { getRoutine } from "@/lib/data/routines";
import { idSchema } from "@/lib/validation/schemas";
import { addRoutineExercises } from "../../actions";

export const metadata: Metadata = { title: "Agregar ejercicios · Gym Tracker" };

export default function AddExercisesPage({
  params,
}: PageProps<"/rutinas/[id]/agregar">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Agregar ejercicios" backHref="/rutinas" />
          <ListSkeleton rows={8} />
        </>
      }
    >
      <AddExercises params={params} />
    </Suspense>
  );
}

async function AddExercises({
  params,
}: {
  params: PageProps<"/rutinas/[id]/agregar">["params"];
}) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const [routine, exercises] = await Promise.all([getRoutine(id), getCatalog()]);
  if (!routine) notFound();

  return (
    <>
      <PageHeader title="Agregar ejercicios" backHref={`/rutinas/${id}`} />
      <p className="-mt-4 mb-4 text-sm text-muted-foreground">
        A <span className="font-medium text-foreground">{routine.name}</span>
      </p>
      <ExerciseCatalog
        mode="pick"
        onConfirm={addRoutineExercises.bind(null, routine.id)}
        excludedIds={routine.exercises.map((e) => e.exerciseId)}
        exercises={exercises}
      />
    </>
  );
}
