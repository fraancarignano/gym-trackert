import { TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function ProgressPage() {
  return (
    <>
      <PageHeader title="Progreso" />
      <EmptyState
        icon={TrendingUp}
        title="Sin datos todavía"
        description="Cuando registres sesiones, vas a ver tu progreso por ejercicio."
      />
    </>
  );
}
