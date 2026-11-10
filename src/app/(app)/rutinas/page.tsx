import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function RoutinesPage() {
  return (
    <>
      <PageHeader title="Rutinas" />
      <EmptyState
        icon={ClipboardList}
        title="No tenés rutinas"
        description="Acá vas a crear y ordenar tus rutinas."
      />
    </>
  );
}
