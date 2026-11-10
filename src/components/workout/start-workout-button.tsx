"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Botón de submit grande para empezar una sesión (muestra spinner mientras crea). */
export function StartWorkoutButton({
  children,
  variant = "card",
}: {
  children: ReactNode;
  variant?: "card" | "outline";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex min-h-16 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60",
        variant === "card"
          ? "border-border bg-card hover:bg-muted/50"
          : "border-dashed border-border hover:bg-muted/50",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
      {pending && <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />}
    </button>
  );
}
