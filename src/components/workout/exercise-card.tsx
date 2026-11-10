"use client";

import { Minus, Plus, X } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import type { LiveExercise } from "@/lib/data/workouts";
import { formatDate } from "@/lib/format";
import { formatTarget } from "@/lib/text";
import { SetRow, type SetRowState } from "./set-row";

export function isRowDirty(row: SetRowState, parse: (text: string) => number | null) {
  if (!row.saved) return false;
  return parse(row.weight) !== row.saved.weightKg || parse(row.reps) !== row.saved.reps;
}

export function ExerciseCard({
  exercise,
  rows,
  parse,
  onRowChange,
  onConfirmRow,
  onAddRow,
  onRemoveLastRow,
  onRemoveExercise,
}: {
  exercise: LiveExercise;
  rows: SetRowState[];
  parse: (text: string) => number | null;
  onRowChange: (index: number, patch: Partial<Pick<SetRowState, "weight" | "reps">>) => void;
  onConfirmRow: (index: number) => void;
  onAddRow: () => void;
  onRemoveLastRow: () => void;
  onRemoveExercise: () => void;
}) {
  const hasSaved = rows.some((r) => r.saved !== null);
  const last = rows.at(-1);
  const lastIsSaved = last?.saved != null;
  const busy = rows.some((r) => r.saving);

  const removeRowButton = (
    <Button
      variant="outline"
      size="lg"
      className="flex-1"
      disabled={rows.length <= 1 || busy}
      onClick={lastIsSaved ? undefined : onRemoveLastRow}
    >
      <Minus />
      Serie
    </Button>
  );

  return (
    <section
      aria-label={exercise.name}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
    >
      <header className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="font-semibold">{exercise.name}</h2>
          <p className="text-sm text-muted-foreground">
            {exercise.target
              ? `Objetivo ${formatTarget(exercise.target.sets, exercise.target.repsMin, exercise.target.repsMax)}`
              : exercise.equipment}
            {exercise.previousDate && ` · Última vez ${formatDate(exercise.previousDate)}`}
          </p>
        </div>
        {!hasSaved && (
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="icon-lg"
                className="-mt-1 -mr-2 text-muted-foreground"
                aria-label={`Quitar ${exercise.name} de la sesión`}
              >
                <X />
              </Button>
            }
            title="¿Quitar ejercicio?"
            description={`"${exercise.name}" se saca de esta sesión. La rutina no cambia.`}
            confirmLabel="Quitar"
            onConfirm={onRemoveExercise}
          />
        )}
      </header>

      <div className="flex items-center gap-2 pr-[3.25rem] pl-7 text-xs font-medium text-muted-foreground">
        <span className="flex-1 text-center">kg</span>
        <span className="flex-1 text-center">Reps</span>
      </div>

      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => (
          <SetRow
            key={`${exercise.workoutExerciseId}-${index}`}
            setNumber={index + 1}
            row={row}
            dirty={isRowDirty(row, parse)}
            reference={exercise.previous.find((p) => p.setNumber === index + 1) ?? null}
            onChange={(patch) => onRowChange(index, patch)}
            onConfirm={() => onConfirmRow(index)}
          />
        ))}
      </ol>

      <div className="flex gap-2">
        {lastIsSaved && rows.length > 1 ? (
          <ConfirmDialog
            trigger={removeRowButton}
            title={`¿Quitar la serie ${rows.length}?`}
            description="Esta serie ya estaba confirmada y se va a borrar."
            confirmLabel="Quitar serie"
            destructive
            onConfirm={onRemoveLastRow}
          />
        ) : (
          removeRowButton
        )}
        <Button variant="outline" size="lg" className="flex-1" disabled={busy} onClick={onAddRow}>
          <Plus />
          Serie
        </Button>
      </div>
    </section>
  );
}
