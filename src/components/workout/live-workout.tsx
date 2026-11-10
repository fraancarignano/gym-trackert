"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addWorkoutExercises,
  discardWorkout,
  finishWorkout,
  removeLiveSet,
  removeWorkoutExercise,
  saveLiveSet,
} from "@/app/entrenar/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ExerciseCatalog } from "@/components/exercises/exercise-catalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildInitialRows, suggestSet } from "@/lib/calc/prefill";
import type { CatalogExercise } from "@/lib/data/exercises";
import type { LiveExercise, LiveWorkout } from "@/lib/data/workouts";
import { parseDecimal, toInputValue } from "@/lib/format";
import { setValuesSchema } from "@/lib/validation/schemas";
import { ElapsedTimer } from "./elapsed-timer";
import { ExerciseCard } from "./exercise-card";
import type { SetRowState } from "./set-row";

type ExerciseState = { exercise: LiveExercise; rows: SetRowState[] };

function isBodyweight(exercise: LiveExercise) {
  return exercise.equipment === "Peso corporal";
}

function initialState(exercise: LiveExercise): ExerciseState {
  const rows = buildInitialRows({
    targetSets: exercise.target?.sets ?? null,
    targetRepsMin: exercise.target?.repsMin ?? null,
    isBodyweight: isBodyweight(exercise),
    previous: exercise.previous,
    confirmed: exercise.sets,
  }).map((row) => {
    const saved = exercise.sets.find((s) => s.setNumber === row.setNumber);
    return {
      weight: toInputValue(row.values.weightKg),
      reps: toInputValue(row.values.reps),
      saved: saved ? { id: saved.id, weightKg: saved.weightKg, reps: saved.reps } : null,
      saving: false,
    };
  });
  return { exercise, rows };
}

export function LiveWorkoutView({
  workout,
  catalog,
}: {
  workout: LiveWorkout;
  catalog: CatalogExercise[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<ExerciseState[]>(() =>
    workout.exercises.map(initialState),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [closing, startClosing] = useTransition();

  const savedCount = items.reduce(
    (n, item) => n + item.rows.filter((r) => r.saved !== null).length,
    0,
  );

  // Se identifica cada ejercicio por su workoutExerciseId: después de un await
  // los índices pueden haber cambiado (por ejemplo, si se quitó un ejercicio).
  function updateItem(id: string, update: (item: ExerciseState) => ExerciseState) {
    setItems((current) =>
      current.map((item) => (item.exercise.workoutExerciseId === id ? update(item) : item)),
    );
  }

  function updateRow(id: string, rowIndex: number, patch: Partial<SetRowState>) {
    updateItem(id, (item) => ({
      ...item,
      rows: item.rows.map((row, i) => (i === rowIndex ? { ...row, ...patch } : row)),
    }));
  }

  async function confirmRow(itemIndex: number, rowIndex: number) {
    const { exercise, rows } = items[itemIndex];
    const id = exercise.workoutExerciseId;
    const row = rows[rowIndex];
    const parsed = setValuesSchema.safeParse({
      weightKg: parseDecimal(row.weight) ?? undefined,
      reps: parseDecimal(row.reps) ?? undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Revisá peso y reps.");
      return;
    }
    if (
      row.saved &&
      row.saved.weightKg === parsed.data.weightKg &&
      row.saved.reps === parsed.data.reps
    ) {
      return; // Ya está guardada con esos valores.
    }

    updateRow(id, rowIndex, { saving: true });
    const result = await saveLiveSet({
      workoutExerciseId: exercise.workoutExerciseId,
      setNumber: rowIndex + 1,
      values: parsed.data,
      setId: row.saved?.id ?? null,
    });
    if (!result.ok) {
      updateRow(id, rowIndex, { saving: false });
      toast.error(result.error);
      return;
    }
    updateRow(id, rowIndex, {
      saving: false,
      weight: toInputValue(parsed.data.weightKg),
      reps: toInputValue(parsed.data.reps),
      saved: { id: result.data.id, ...parsed.data },
    });
  }

  function addRow(id: string) {
    updateItem(id, ({ exercise, rows }) => {
      const setNumber = rows.length + 1;
      const last = rows.at(-1);
      // Con historial se aplica la precarga; sin historial se copia la última fila.
      const values =
        exercise.previous.length > 0 || !last
          ? (() => {
              const s = suggestSet(setNumber, {
                previous: exercise.previous,
                targetRepsMin: exercise.target?.repsMin ?? null,
                isBodyweight: isBodyweight(exercise),
              });
              return { weight: toInputValue(s.weightKg), reps: toInputValue(s.reps) };
            })()
          : { weight: last.weight, reps: last.reps };
      return { exercise, rows: [...rows, { ...values, saved: null, saving: false }] };
    });
  }

  async function removeLastRow(itemIndex: number) {
    const { exercise, rows } = items[itemIndex];
    const id = exercise.workoutExerciseId;
    const last = rows.at(-1);
    if (!last || rows.length <= 1) return;

    if (last.saved) {
      updateRow(id, rows.length - 1, { saving: true });
      const result = await removeLiveSet(last.saved.id);
      if (!result.ok) {
        updateRow(id, rows.length - 1, { saving: false });
        toast.error(result.error);
        return;
      }
    }
    updateItem(id, (item) => ({ ...item, rows: item.rows.slice(0, -1) }));
  }

  async function removeExercise(itemIndex: number) {
    const { exercise } = items[itemIndex];
    const result = await removeWorkoutExercise(exercise.workoutExerciseId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((current) =>
      current.filter((item) => item.exercise.workoutExerciseId !== exercise.workoutExerciseId),
    );
  }

  async function addExercises(exerciseIds: string[]) {
    const result = await addWorkoutExercises(workout.id, exerciseIds);
    if (!result.ok) return result;
    setItems((current) => [...current, ...result.data.map(initialState)]);
    setPickerOpen(false);
    toast.success(
      result.data.length === 1 ? "Ejercicio agregado" : `${result.data.length} ejercicios agregados`,
    );
  }

  function finish() {
    startClosing(async () => {
      const result = await finishWorkout(workout.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (result.data === "discarded") {
        toast("Sesión descartada: no tenía series confirmadas.");
        router.replace("/");
      } else {
        router.replace(`/entrenar/${workout.id}/resumen`);
      }
    });
  }

  function discard() {
    startClosing(async () => {
      const result = await discardWorkout(workout.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast("Entrenamiento descartado");
      router.replace("/");
    });
  }

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
        <Link
          href="/"
          aria-label="Salir (la sesión sigue en curso)"
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <ChevronLeft className="size-6" />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{workout.title}</span>
          <ElapsedTimer
            startedAt={workout.startedAt}
            className="text-sm text-muted-foreground tabular-nums"
          />
        </div>
        <ConfirmDialog
          trigger={
            <Button size="lg" disabled={closing}>
              Terminar
            </Button>
          }
          title="¿Terminar entrenamiento?"
          description={
            savedCount === 0
              ? "No confirmaste ninguna serie: la sesión se va a descartar."
              : `Se guardan ${savedCount} ${savedCount === 1 ? "serie confirmada" : "series confirmadas"}. Las filas sin confirmar no se guardan.`
          }
          confirmLabel="Terminar"
          onConfirm={finish}
        />
      </header>

      <div className="flex flex-col gap-4">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            Agregá el primer ejercicio para empezar.
          </p>
        )}

        {items.map((item, itemIndex) => (
          <ExerciseCard
            key={item.exercise.workoutExerciseId}
            exercise={item.exercise}
            rows={item.rows}
            parse={parseDecimal}
            onRowChange={(rowIndex, patch) =>
              updateRow(item.exercise.workoutExerciseId, rowIndex, patch)
            }
            onConfirmRow={(rowIndex) => confirmRow(itemIndex, rowIndex)}
            onAddRow={() => addRow(item.exercise.workoutExerciseId)}
            onRemoveLastRow={() => removeLastRow(itemIndex)}
            onRemoveExercise={() => removeExercise(itemIndex)}
          />
        ))}

        <Button
          variant="outline"
          size="xl"
          className="w-full"
          onClick={() => setPickerOpen(true)}
        >
          <Plus />
          Agregar ejercicio
        </Button>

        <div className="mt-6 pb-4">
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="xl"
                className="w-full text-muted-foreground"
                disabled={closing}
              >
                <Trash2 />
                Descartar entrenamiento
              </Button>
            }
            title="¿Descartar entrenamiento?"
            description="Se borra la sesión con todas las series confirmadas. No se puede deshacer."
            confirmLabel="Descartar"
            destructive
            onConfirm={discard}
          />
        </div>
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="top-0 left-0 flex h-dvh max-h-dvh w-full max-w-none translate-x-0 translate-y-0 flex-col gap-4 overflow-y-auto rounded-none p-4 pt-[calc(env(safe-area-inset-top)+1rem)] sm:max-w-none">
          <DialogHeader>
            <DialogTitle className="text-xl">Agregar ejercicio</DialogTitle>
            <DialogDescription>Se suma solo a esta sesión, la rutina no cambia.</DialogDescription>
          </DialogHeader>
          {pickerOpen && (
            <ExerciseCatalog
              mode="pick"
              exercises={catalog}
              excludedIds={items.map((i) => i.exercise.exerciseId)}
              excludedLabel="En la sesión"
              onConfirm={addExercises}
              hasBottomNav={false}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
