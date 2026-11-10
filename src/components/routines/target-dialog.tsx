"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { updateRoutineExerciseTarget } from "@/app/(app)/rutinas/actions";
import { NumberStepper } from "@/components/number-stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LIMITS } from "@/lib/constants";
import type { RoutineExerciseItem } from "@/lib/data/routines";
import { formatTarget } from "@/lib/text";
import { targetSchema } from "@/lib/validation/schemas";

/** Botón con el objetivo ("4 × 8–10") que abre el editor de series y reps. */
export function TargetDialog({
  item,
  onRemove,
}: {
  item: RoutineExerciseItem;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [sets, setSets] = useState<number | null>(item.targetSets);
  const [repsMin, setRepsMin] = useState<number | null>(item.targetRepsMin);
  const [repsMax, setRepsMax] = useState<number | null>(item.targetRepsMax);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setSets(item.targetSets);
    setRepsMin(item.targetRepsMin);
    setRepsMax(item.targetRepsMax);
    setError(null);
  }

  function handleSave() {
    const parsed = targetSchema.safeParse({ sets, repsMin, repsMax });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los valores.");
      return;
    }
    startTransition(async () => {
      const result = await updateRoutineExerciseTarget(item.id, parsed.data);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="secondary"
            size="lg"
            className="tabular-nums"
            aria-label={`Editar objetivo de ${item.name}: ${formatTarget(item.targetSets, item.targetRepsMin, item.targetRepsMax)}`}
          >
            {formatTarget(item.targetSets, item.targetRepsMin, item.targetRepsMax)}
            <Pencil className="text-muted-foreground" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>Objetivo de series y rango de repeticiones.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <NumberStepper
            id={`sets-${item.id}`}
            label="Series"
            value={sets}
            onChange={setSets}
            min={LIMITS.setsMin}
            max={LIMITS.setsMax}
          />
          <div className="grid grid-cols-2 gap-3">
            <NumberStepper
              id={`reps-min-${item.id}`}
              label="Reps mín."
              value={repsMin}
              onChange={(v) => {
                setRepsMin(v);
                if (v !== null && repsMax !== null && v > repsMax) setRepsMax(v);
              }}
              min={LIMITS.repsMin}
              max={LIMITS.repsMax}
            />
            <NumberStepper
              id={`reps-max-${item.id}`}
              label="Reps máx."
              value={repsMax}
              onChange={(v) => {
                setRepsMax(v);
                if (v !== null && repsMin !== null && v < repsMin) setRepsMin(v);
              }}
              min={LIMITS.repsMin}
              max={LIMITS.repsMax}
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button size="xl" className="w-full" disabled={pending} onClick={handleSave}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
          >
            <Trash2 />
            Quitar de la rutina
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
