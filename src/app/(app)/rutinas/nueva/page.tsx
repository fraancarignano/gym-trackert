import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { RoutineForm } from "@/components/routines/routine-form";
import { createRoutine } from "../actions";

export const metadata: Metadata = { title: "Nueva rutina · Gym Tracker" };

export default function NewRoutinePage() {
  return (
    <>
      <PageHeader title="Nueva rutina" backHref="/rutinas" />
      <RoutineForm
        action={createRoutine}
        submitLabel="Crear y agregar ejercicios"
        pendingLabel="Creando…"
      />
    </>
  );
}
