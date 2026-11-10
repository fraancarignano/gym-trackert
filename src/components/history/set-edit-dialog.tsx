"use client";

import { useState, useTransition, type ReactElement } from "react";
import { Trash2 } from "lucide-react";
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
import { ValueStepper } from "@/components/workout/value-stepper";
import type { ActionResult } from "@/lib/action-result";
import { WEIGHT_STEP_KG } from "@/lib/constants";
import { parseDecimal, toInputValue } from "@/lib/format";
import { setValuesSchema } from "@/lib/validation/schemas";

type Values = { weightKg: number; reps: number };

/** Diálogo para crear o editar una serie (peso y reps). */
export function SetEditDialog({
  trigger,
  title,
  description,
  initial,
  onSave,
  onDelete,
}: {
  trigger: ReactElement;
  title: string;
  description?: string;
  initial: Values | null;
  onSave: (values: Values) => Promise<ActionResult>;
  onDelete?: () => Promise<ActionResult>;
}) {
  const [open, setOpen] = useState(false);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(next: boolean) {
    if (next) {
      setWeight(toInputValue(initial?.weightKg ?? null));
      setReps(toInputValue(initial?.reps ?? null));
      setError(null);
    }
    setOpen(next);
  }

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  function handleSave() {
    const parsed = setValuesSchema.safeParse({
      weightKg: parseDecimal(weight) ?? undefined,
      reps: parseDecimal(reps) ?? undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá peso y reps.");
      return;
    }
    run(() => onSave(parsed.data));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Peso (kg)</span>
            <ValueStepper
              value={weight}
              onChange={setWeight}
              step={WEIGHT_STEP_KG}
              decimal
              max={9999.99}
              ariaLabel="peso en kg"
              size="lg"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-muted-foreground">Reps</span>
            <ValueStepper
              value={reps}
              onChange={setReps}
              step={1}
              min={1}
              max={999}
              ariaLabel="repeticiones"
              size="lg"
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
          {onDelete && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-destructive hover:text-destructive"
              disabled={pending}
              onClick={() => run(onDelete)}
            >
              <Trash2 />
              Eliminar serie
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
