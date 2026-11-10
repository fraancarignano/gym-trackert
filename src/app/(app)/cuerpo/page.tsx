import { Scale } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";

export default function BodyPage() {
  return (
    <>
      <PageHeader title="Cuerpo" />
      <EmptyState
        icon={Scale}
        title="Sin mediciones"
        description="Acá vas a registrar tu peso corporal y tus medidas."
      />
    </>
  );
}
