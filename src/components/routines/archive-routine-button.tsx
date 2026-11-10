"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { setRoutineArchived } from "@/app/(app)/rutinas/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function ArchiveRoutineButton({
  routineId,
  routineName,
  isArchived,
}: {
  routineId: string;
  routineName: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setArchived(archived: boolean) {
    startTransition(async () => {
      const result = await setRoutineArchived(routineId, archived);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      if (archived) {
        toast.success(`"${routineName}" archivada`);
        router.push("/rutinas");
      } else {
        toast.success(`"${routineName}" restaurada`);
      }
    });
  }

  if (isArchived) {
    return (
      <Button size="xl" className="w-full" disabled={pending} onClick={() => setArchived(false)}>
        <ArchiveRestore />
        Restaurar rutina
      </Button>
    );
  }

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="xl" className="w-full text-muted-foreground" disabled={pending}>
          <Archive />
          Archivar rutina
        </Button>
      }
      title="¿Archivar rutina?"
      description={`"${routineName}" deja de aparecer en tus rutinas activas. Las sesiones que ya hiciste no cambian y la podés restaurar cuando quieras.`}
      confirmLabel="Archivar"
      onConfirm={() => setArchived(true)}
    />
  );
}
