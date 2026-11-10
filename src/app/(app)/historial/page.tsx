import { History } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="Historial" />
      <EmptyState
        icon={History}
        title="Sin sesiones"
        description="Tus entrenamientos terminados van a aparecer acá."
      />
    </>
  );
}
