"use client";

import { startTransition, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { ArchiveRestore, ChevronRight, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { moveRoutine, setRoutineArchived } from "@/app/(app)/rutinas/actions";
import { EmptyState } from "@/components/empty-state";
import { MoveButtons } from "@/components/move-buttons";
import { Button } from "@/components/ui/button";
import type { RoutineSummary } from "@/lib/data/routines";
import { moveItem, type MoveDirection } from "@/lib/reorder";

function exerciseCountLabel(count: number) {
  if (count === 0) return "Sin ejercicios";
  return count === 1 ? "1 ejercicio" : `${count} ejercicios`;
}

export function RoutineList({ routines }: { routines: RoutineSummary[] }) {
  const active = routines.filter((r) => !r.isArchived);
  const archived = routines.filter((r) => r.isArchived);

  const [optimistic, applyMove] = useOptimistic(
    active,
    (state, { id, direction }: { id: string; direction: MoveDirection }) => {
      const order = moveItem(state.map((r) => r.id), id, direction);
      return order.map((rid) => state.find((r) => r.id === rid)!);
    },
  );
  const [restoring, startRestore] = useTransition();

  function handleMove(id: string, direction: MoveDirection) {
    startTransition(async () => {
      applyMove({ id, direction });
      const result = await moveRoutine(id, direction);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleRestore(routine: RoutineSummary) {
    startRestore(async () => {
      const result = await setRoutineArchived(routine.id, false);
      if (result.ok) toast.success(`"${routine.name}" restaurada`);
      else toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {optimistic.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No tenés rutinas"
          description="Creá tu primera rutina y agregale ejercicios con su objetivo de series y reps."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {optimistic.map((routine, index) => (
            <li
              key={routine.id}
              className="flex items-center gap-1 rounded-xl border border-border bg-card pr-1"
            >
              <Link
                href={`/rutinas/${routine.id}`}
                className="flex min-h-16 min-w-0 flex-1 items-center gap-3 py-3 pl-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate font-medium">{routine.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {exerciseCountLabel(routine.exerciseCount)}
                  </span>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
              <MoveButtons
                label={routine.name}
                isFirst={index === 0}
                isLast={index === optimistic.length - 1}
                onMove={(direction) => handleMove(routine.id, direction)}
              />
            </li>
          ))}
        </ul>
      )}

      {archived.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground select-none">
            <span className="group-open:hidden">Ver archivadas ({archived.length})</span>
            <span className="hidden group-open:inline">Ocultar archivadas</span>
          </summary>
          <ul className="mt-3 flex flex-col gap-2">
            {archived.map((routine) => (
              <li
                key={routine.id}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border py-2 pr-2 pl-4"
              >
                <Link href={`/rutinas/${routine.id}`} className="min-w-0 flex-1">
                  <span className="block truncate text-muted-foreground">{routine.name}</span>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={restoring}
                  onClick={() => handleRestore(routine)}
                >
                  <ArchiveRestore />
                  Restaurar
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
