"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Número con botones grandes − / + y campo editable con teclado numérico.
 * `value` null = campo vacío.
 */
export function NumberStepper({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  className,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const current = value ?? min;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="w-12 shrink-0 px-0"
          aria-label={`Restar a ${label.toLowerCase()}`}
          disabled={value !== null && value <= min}
          onClick={() => onChange(clamp(current - step))}
        >
          <Minus />
        </Button>
        <input
          id={id}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={value ?? ""}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            onChange(digits === "" ? null : Math.min(max, Number(digits)));
          }}
          onBlur={() => {
            if (value !== null) onChange(clamp(value));
          }}
          className="h-12 w-full min-w-0 rounded-lg border border-input bg-transparent text-center text-lg font-semibold tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        />
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="w-12 shrink-0 px-0"
          aria-label={`Sumar a ${label.toLowerCase()}`}
          disabled={value !== null && value >= max}
          onClick={() => onChange(clamp(value === null ? min : current + step))}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}
