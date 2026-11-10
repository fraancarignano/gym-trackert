"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MoveDirection } from "@/lib/reorder";

/** Botones subir / bajar para reordenar una lista. */
export function MoveButtons({
  label,
  isFirst,
  isLast,
  disabled,
  onMove,
}: {
  label: string;
  isFirst: boolean;
  isLast: boolean;
  disabled?: boolean;
  onMove: (direction: MoveDirection) => void;
}) {
  return (
    <div className="flex shrink-0 flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-10"
        aria-label={`Subir ${label}`}
        disabled={disabled || isFirst}
        onClick={() => onMove("up")}
      >
        <ChevronUp className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-10"
        aria-label={`Bajar ${label}`}
        disabled={disabled || isLast}
        onClick={() => onMove("down")}
      >
        <ChevronDown className="size-5" />
      </Button>
    </div>
  );
}
