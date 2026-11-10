"use client";

import { useState, useTransition, type ReactElement } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBodyMetric, saveBodyMetric } from "@/app/(app)/cuerpo/actions";
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
import { ValueStepper } from "@/components/workout/value-stepper";
import { MEASUREMENTS, type BodyMetric, type MeasurementKey } from "@/lib/calc/body";
import { formatIsoDate, parseDecimal, toInputValue, todayIsoDate } from "@/lib/format";
import { bodyMetricSchema } from "@/lib/validation/schemas";

type Fields = { measuredOn: string; weightKg: string } & Record<MeasurementKey, string>;

function toFields(metric: BodyMetric | null, defaults?: BodyMetric | null): Fields {
  // Al registrar uno nuevo, el peso arranca con el último valor para ajustarlo con +/-.
  const source = metric ?? null;
  return {
    measuredOn: metric?.measuredOn ?? todayIsoDate(),
    weightKg: toInputValue(source?.weightKg ?? defaults?.weightKg ?? null),
    waistCm: toInputValue(source?.waistCm ?? null),
    chestCm: toInputValue(source?.chestCm ?? null),
    armCm: toInputValue(source?.armCm ?? null),
    thighCm: toInputValue(source?.thighCm ?? null),
    hipCm: toInputValue(source?.hipCm ?? null),
  };
}

/** Registrar una medición nueva (metric = null) o editar / borrar una existente. */
export function BodyMetricDialog({
  trigger,
  metric,
  lastMetric,
}: {
  trigger: ReactElement;
  metric: BodyMetric | null;
  /** Última medición, para precargar el peso al registrar una nueva. */
  lastMetric?: BodyMetric | null;
}) {
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<Fields>(() => toFields(metric, lastMetric));
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  const today = todayIsoDate();

  function handleOpenChange(next: boolean) {
    if (next) {
      setFields(toFields(metric, lastMetric));
      setError(null);
      setConfirmDelete(false);
    }
    setOpen(next);
  }

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  function handleSave() {
    const parsed = bodyMetricSchema.safeParse({
      measuredOn: fields.measuredOn,
      weightKg: parseDecimal(fields.weightKg),
      waistCm: parseDecimal(fields.waistCm),
      chestCm: parseDecimal(fields.chestCm),
      armCm: parseDecimal(fields.armCm),
      thighCm: parseDecimal(fields.thighCm),
      hipCm: parseDecimal(fields.hipCm),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Revisá los valores.");
      return;
    }
    startTransition(async () => {
      const result = await saveBodyMetric(parsed.data, metric?.id ?? null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(metric ? "Medición actualizada" : "Medición registrada");
      setOpen(false);
    });
  }

  function handleDelete() {
    if (!metric) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteBodyMetric(metric.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast("Medición borrada");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {metric ? `Medición del ${formatIsoDate(metric.measuredOn)}` : "Nueva medición"}
          </DialogTitle>
          <DialogDescription>Peso en kg y medidas en cm. Completá solo lo que mediste.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="measured-on">Fecha</Label>
            <Input
              id="measured-on"
              type="date"
              max={today}
              value={fields.measuredOn}
              onChange={(e) => set("measuredOn", e.target.value)}
              className="h-12 text-base [color-scheme:dark]"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Peso (kg)</span>
            <ValueStepper
              value={fields.weightKg}
              onChange={(v) => set("weightKg", v)}
              step={0.1}
              decimal
              max={400}
              ariaLabel="peso corporal en kg"
              size="lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MEASUREMENTS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-muted-foreground">{label} (cm)</span>
                <ValueStepper
                  value={fields[key]}
                  onChange={(v) => set(key, v)}
                  step={0.5}
                  decimal
                  max={300}
                  ariaLabel={`${label.toLowerCase()} en cm`}
                />
              </div>
            ))}
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
          {metric && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-destructive hover:text-destructive"
              disabled={pending}
              onClick={handleDelete}
            >
              <Trash2 />
              {confirmDelete ? "Tocá de nuevo para borrar" : "Borrar medición"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
