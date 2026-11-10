"use client";

import { Minus, Plus } from "lucide-react";
import { round2 } from "@/lib/calc/volume";
import { parseDecimal, toInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Campo numérico con − / + pegados, pensado para una mano.
 * Trabaja con texto (coma decimal) para poder tipear "62," sin que salte.
 */
export function ValueStepper({
  value,
  onChange,
  step,
  min = 0,
  max = 9999,
  decimal = false,
  ariaLabel,
  disabled,
  size = "md",
}: {
  value: string;
  onChange: (value: string) => void;
  step: number;
  min?: number;
  max?: number;
  decimal?: boolean;
  ariaLabel: string;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const current = parseDecimal(value);

  function bump(delta: number) {
    const base = current ?? (delta > 0 ? 0 : min);
    const next = Math.min(max, Math.max(min, round2(base + delta)));
    onChange(toInputValue(next));
  }

  function handleInput(raw: string) {
    let text = raw.replace(".", ",");
    text = decimal ? text.replace(/[^\d,]/g, "") : text.replace(/\D/g, "");
    if (decimal) {
      const [int, ...rest] = text.split(",");
      text = rest.length > 0 ? `${int},${rest.join("").slice(0, 2)}` : int;
    }
    onChange(text.slice(0, 7));
  }

  const buttonClass = cn(
    "flex shrink-0 items-center justify-center text-muted-foreground transition-colors hover:bg-muted active:bg-muted disabled:opacity-40",
    size === "lg" ? "w-12" : "w-9",
  );

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 overflow-hidden rounded-lg border border-input dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        size === "lg" ? "h-12" : "h-11",
      )}
    >
      <button
        type="button"
        className={buttonClass}
        aria-label={`Restar ${ariaLabel}`}
        disabled={disabled || (current !== null && current <= min)}
        onClick={() => bump(-step)}
      >
        <Minus className="size-4" />
      </button>
      <input
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        aria-label={ariaLabel}
        disabled={disabled}
        className="w-full min-w-0 bg-transparent text-center text-base font-semibold tabular-nums outline-none disabled:opacity-60"
      />
      <button
        type="button"
        className={buttonClass}
        aria-label={`Sumar ${ariaLabel}`}
        disabled={disabled || (current !== null && current >= max)}
        onClick={() => bump(step)}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
