import { Suspense } from "react";
import type { Metadata } from "next";
import { BodyView } from "@/components/body/body-view";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getBodyMetrics } from "@/lib/data/body";

export const metadata: Metadata = { title: "Cuerpo · Gym Tracker" };

export default function BodyPage() {
  return (
    <>
      <PageHeader title="Cuerpo" />
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <BodyContent />
      </Suspense>
    </>
  );
}

async function BodyContent() {
  const metrics = await getBodyMetrics();
  return <BodyView metrics={metrics} />;
}
