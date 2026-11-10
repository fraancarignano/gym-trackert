"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createExercise } from "@/app/(app)/rutinas/ejercicios/actions";
import { NativeSelect } from "@/components/native-select";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EQUIPMENT,
  LIMITS,
  MUSCLE_GROUPS,
  type Equipment,
  type MuscleGroup,
} from "@/lib/constants";

export function CreateExerciseDialog({
  defaultName = "",
  defaultGroup,
  onCreated,
}: {
  defaultName?: string;
  defaultGroup?: MuscleGroup;
  onCreated?: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createExercise({
        name: String(formData.get("name") ?? ""),
        muscleGroup: formData.get("muscleGroup") as MuscleGroup,
        equipment: formData.get("equipment") as Equipment,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Ejercicio creado");
      setOpen(false);
      onCreated?.(result.data.id);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="lg">
            <Plus />
            Crear
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo ejercicio</DialogTitle>
          <DialogDescription>
            Se agrega a tu catálogo y lo podés usar en cualquier rutina.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="exercise-name">Nombre</Label>
            <Input
              id="exercise-name"
              name="name"
              required
              maxLength={LIMITS.nameMax}
              defaultValue={defaultName}
              autoComplete="off"
              className="h-12 text-base"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exercise-group">Grupo muscular</Label>
            <NativeSelect
              id="exercise-group"
              name="muscleGroup"
              required
              defaultValue={defaultGroup ?? ""}
            >
              <option value="" disabled>
                Elegí un grupo
              </option>
              {MUSCLE_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="exercise-equipment">Equipo</Label>
            <NativeSelect
              id="exercise-equipment"
              name="equipment"
              required
              defaultValue=""
            >
              <option value="" disabled>
                Elegí un equipo
              </option>
              {EQUIPMENT.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" size="xl" disabled={pending} className="w-full">
              {pending ? "Guardando…" : "Crear ejercicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
