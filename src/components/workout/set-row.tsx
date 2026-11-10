"use client";

import { Check, Loader2 } from "lucide-react";
import type { PerformedSet } from "@/lib/calc/prefill";
import { WEIGHT_STEP_KG } from "@/lib/constants";
import { formatSet } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ValueStepper } from "./value-stepper";

export type SetRowState = {
  weight: string;
  reps: string;
  /** Serie guardada en la base (id + valores guardados). */
  saved: { id: string; weightKg: number; reps: number } | null;
  saving: boolean;
};

export function SetRow({
  setNumber,
  row,
  dirty,
  reference,
  onChange,
  onConfirm,
}: {
  setNumber: number;
  row: SetRowState;
  /** Guardada pero con valores cambiados. */
  dirty: boolean;
  reference: PerformedSet | null;
  onChange: (patch: Partial<Pick<SetRowState, "weight" | "reps">>) => void;
  onConfirm: () => void;
}) {
  const done = row.saved !== null && !dirty;

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "w-5 shrink-0 text-center text-sm font-semibold tabular-nums",
            done ? "text-primary" : "text-muted-foreground",
          )}
        >
          {setNumber}
        </span>
        <ValueStepper
          value={row.weight}
          onChange={(weight) => onChange({ weight })}
          step={WEIGHT_STEP_KG}
          decimal
          max={9999.99}
          ariaLabel={`peso de la serie ${setNumber} en kg`}
        />
        <ValueStepper
          value={row.reps}
          onChange={(reps) => onChange({ reps })}
          step={1}
          min={1}
          max={999}
          ariaLabel={`repeticiones de la serie ${setNumber}`}
        />
        <button
          type="button"
          onClick={onConfirm}
          disabled={row.saving}
          aria-label={
            done
              ? `Serie ${setNumber} confirmada`
              : row.saved
                ? `Guardar cambios de la serie ${setNumber}`
                : `Confirmar serie ${setNumber}`
          }
          aria-pressed={done}
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
            done
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:border-primary hover:text-primary",
            row.saving && "opacity-70",
          )}
        >
          {row.saving ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-6" />}
        </button>
      </div>
      {reference && (
        <p className="pl-7 text-xs text-muted-foreground">
          Anterior: {formatSet(reference.weightKg, reference.reps)}
        </p>
      )}
    </li>
  );
}
