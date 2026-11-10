import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { ArchiveRoutineButton } from "@/components/routines/archive-routine-button";
import { RoutineExerciseList } from "@/components/routines/routine-exercise-list";
import { RoutineForm } from "@/components/routines/routine-form";
import { buttonVariants } from "@/components/ui/button";
import { getRoutine } from "@/lib/data/routines";
import { idSchema } from "@/lib/validation/schemas";
import { updateRoutine } from "../actions";

export const metadata: Metadata = { title: "Editar rutina · Gym Tracker" };

export default function RoutineEditorPage({ params }: PageProps<"/rutinas/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader title="Rutina" backHref="/rutinas" />
          <ListSkeleton rows={4} />
        </>
      }
    >
      <RoutineEditor params={params} />
    </Suspense>
  );
}

async function RoutineEditor({ params }: { params: PageProps<"/rutinas/[id]">["params"] }) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) notFound();

  const routine = await getRoutine(id);
  if (!routine) notFound();

  return (
    <>
      <PageHeader title={routine.name} backHref="/rutinas" backLabel="Volver a rutinas" />

      {routine.isArchived && (
        <p className="mb-6 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          Esta rutina está archivada: no aparece en tus rutinas activas.
        </p>
      )}

      <section aria-labelledby="exercises-title" className="flex flex-col gap-4">
        <h2 id="exercises-title" className="text-lg font-semibold">
          Ejercicios
        </h2>
        <RoutineExerciseList items={routine.exercises} />
        <Link
          href={`/rutinas/${routine.id}/agregar`}
          className={buttonVariants({ variant: "outline", size: "xl", className: "w-full" })}
        >
          <Plus />
          Agregar ejercicios
        </Link>
      </section>

      <section aria-labelledby="details-title" className="mt-10 flex flex-col gap-4">
        <h2 id="details-title" className="text-lg font-semibold">
          Datos de la rutina
        </h2>
        <RoutineForm
          key={`${routine.name}|${routine.notes ?? ""}`}
          action={updateRoutine.bind(null, routine.id)}
          defaultName={routine.name}
          defaultNotes={routine.notes ?? ""}
          submitLabel="Guardar cambios"
        />
      </section>

      <div className="mt-10">
        <ArchiveRoutineButton
          routineId={routine.id}
          routineName={routine.name}
          isArchived={routine.isArchived}
        />
      </div>
    </>
  );
}
