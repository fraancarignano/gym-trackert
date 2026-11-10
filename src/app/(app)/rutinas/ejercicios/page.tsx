import { Suspense } from "react";
import type { Metadata } from "next";
import { ExerciseCatalog } from "@/components/exercises/exercise-catalog";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { getCatalog } from "@/lib/data/exercises";

export const metadata: Metadata = { title: "Ejercicios · Gym Tracker" };

export default function ExercisesPage() {
  return (
    <>
      <PageHeader title="Ejercicios" backHref="/rutinas" />
      <Suspense fallback={<ListSkeleton rows={8} />}>
        <Catalog />
      </Suspense>
    </>
  );
}

async function Catalog() {
  const exercises = await getCatalog();
  return <ExerciseCatalog mode="browse" exercises={exercises} />;
}
