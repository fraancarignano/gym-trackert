"use client";

import { startTransition, useOptimistic } from "react";
import { ListPlus } from "lucide-react";
import { toast } from "sonner";
import { moveRoutineExercise, removeRoutineExercise } from "@/app/(app)/rutinas/actions";
import { EmptyState } from "@/components/empty-state";
import { MoveButtons } from "@/components/move-buttons";
import { Badge } from "@/components/ui/badge";
import type { RoutineExerciseItem } from "@/lib/data/routines";
import { moveItem, type MoveDirection } from "@/lib/reorder";
import { TargetDialog } from "./target-dialog";

type OptimisticAction =
  | { type: "move"; id: string; direction: MoveDirection }
  | { type: "remove"; id: string };

export function RoutineExerciseList({ items }: { items: RoutineExerciseItem[] }) {
  const [optimistic, apply] = useOptimistic(items, (state, action: OptimisticAction) => {
    if (action.type === "remove") return state.filter((i) => i.id !== action.id);
    const order = moveItem(state.map((i) => i.id), action.id, action.direction);
    return order.map((id) => state.find((i) => i.id === id)!);
  });

  function handleMove(id: string, direction: MoveDirection) {
    startTransition(async () => {
      apply({ type: "move", id, direction });
      const result = await moveRoutineExercise(id, direction);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleRemove(item: RoutineExerciseItem) {
    startTransition(async () => {
      apply({ type: "remove", id: item.id });
      const result = await removeRoutineExercise(item.id);
      if (result.ok) toast.success(`"${item.name}" quitado de la rutina`);
      else toast.error(result.error);
    });
  }

  if (optimistic.length === 0) {
    return (
      <EmptyState
        icon={ListPlus}
        title="Sin ejercicios"
        description="Agregá ejercicios del catálogo para armar la rutina."
      />
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {optimistic.map((item, index) => (
        <li
          key={item.id}
          className="flex items-center gap-2 rounded-xl border border-border bg-card py-3 pr-1 pl-4"
        >
          <span className="w-5 shrink-0 text-sm font-medium text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate font-medium">{item.name}</span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                {item.muscleGroup} · {item.equipment}
                {item.isArchivedExercise && <Badge variant="outline">Archivado</Badge>}
              </span>
            </div>
            <div>
              <TargetDialog
                key={`${item.targetSets}-${item.targetRepsMin}-${item.targetRepsMax}`}
                item={item}
                onRemove={() => handleRemove(item)}
              />
            </div>
          </div>
          <MoveButtons
            label={item.name}
            isFirst={index === 0}
            isLast={index === optimistic.length - 1}
            onMove={(direction) => handleMove(item.id, direction)}
          />
        </li>
      ))}
    </ol>
  );
}
