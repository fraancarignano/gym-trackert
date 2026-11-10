"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addHistorySet,
  deleteHistorySet,
  deleteWorkout,
  editHistorySet,
} from "@/app/(app)/historial/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { WorkoutDetail } from "@/lib/data/workouts";
import { formatSet } from "@/lib/format";
import { SetEditDialog } from "./set-edit-dialog";

/** Series de una sesión terminada, editables, y el botón para eliminarla. */
export function WorkoutEditor({ workout }: { workout: WorkoutDetail }) {
  const router = useRouter();
  const [deleting, startDeleting] = useTransition();

  function handleDeleteWorkout() {
    startDeleting(async () => {
      const result = await deleteWorkout(workout.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast("Sesión eliminada");
      router.replace("/historial");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {workout.exercises.map((exercise) => {
        const last = exercise.sets.at(-1);
        return (
          <section
            key={exercise.workoutExerciseId}
            aria-label={exercise.name}
            className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
          >
            <h2 className="font-semibold">{exercise.name}</h2>

            {exercise.sets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin series.</p>
            ) : (
              <ol className="flex flex-col">
                {exercise.sets.map((set) => (
                  <li key={set.id}>
                    <SetEditDialog
                      title={`${exercise.name} · serie ${set.setNumber}`}
                      initial={{ weightKg: set.weightKg, reps: set.reps }}
                      onSave={(values) =>
                        editHistorySet(set.id, exercise.workoutExerciseId, set.setNumber, values)
                      }
                      onDelete={() => deleteHistorySet(set.id)}
                      trigger={
                        <button
                          type="button"
                          className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 text-left hover:bg-muted/50"
                          aria-label={`Editar serie ${set.setNumber}: ${formatSet(set.weightKg, set.reps)}`}
                        >
                          <span className="w-5 text-sm font-semibold text-muted-foreground tabular-nums">
                            {set.setNumber}
                          </span>
                          <span className="flex-1 tabular-nums">
                            {formatSet(set.weightKg, set.reps)}
                          </span>
                          <Pencil className="size-4 text-muted-foreground" aria-hidden />
                        </button>
                      }
                    />
                  </li>
                ))}
              </ol>
            )}

            <SetEditDialog
              title={`${exercise.name} · nueva serie`}
              initial={last ? { weightKg: last.weightKg, reps: last.reps } : null}
              onSave={(values) => addHistorySet(exercise.workoutExerciseId, values)}
              trigger={
                <Button variant="ghost" size="lg" className="self-start text-muted-foreground">
                  <Plus />
                  Agregar serie
                </Button>
              }
            />
          </section>
        );
      })}

      <div className="mt-6">
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="xl"
              className="w-full text-muted-foreground"
              disabled={deleting}
            >
              <Trash2 />
              Eliminar sesión
            </Button>
          }
          title="¿Eliminar sesión?"
          description="Se borra la sesión con todas sus series. No se puede deshacer."
          confirmLabel="Eliminar"
          destructive
          onConfirm={handleDeleteWorkout}
        />
      </div>
    </div>
  );
}
