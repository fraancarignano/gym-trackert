"use client";

import { useActionState } from "react";
import { toast } from "sonner";
import type { RoutineFormState } from "@/app/(app)/rutinas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMITS } from "@/lib/constants";

const initialState: RoutineFormState = { status: "idle" };

export function RoutineForm({
  action,
  defaultName = "",
  defaultNotes = "",
  submitLabel,
  pendingLabel = "Guardando…",
}: {
  action: (prev: RoutineFormState, formData: FormData) => Promise<RoutineFormState>;
  defaultName?: string;
  defaultNotes?: string;
  submitLabel: string;
  pendingLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: RoutineFormState, formData: FormData) => {
      const next = await action(prev, formData);
      if (next.status === "saved") toast.success("Cambios guardados");
      return next;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="routine-name">Nombre</Label>
        <Input
          id="routine-name"
          name="name"
          required
          maxLength={LIMITS.nameMax}
          defaultValue={defaultName}
          placeholder="Ej.: Empuje, Piernas, Full body"
          autoComplete="off"
          className="h-12 text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="routine-notes">
          Notas <span className="font-normal text-muted-foreground">(opcional)</span>
        </Label>
        <Textarea
          id="routine-notes"
          name="notes"
          maxLength={LIMITS.notesMax}
          defaultValue={defaultNotes}
          rows={2}
          className="text-base"
        />
      </div>

      {state.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <Button type="submit" size="xl" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
