import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Dumbbell, Plus } from "lucide-react";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { RoutineList } from "@/components/routines/routine-list";
import { buttonVariants } from "@/components/ui/button";
import { getRoutines } from "@/lib/data/routines";

export const metadata: Metadata = { title: "Rutinas · Gym Tracker" };

export default function RoutinesPage() {
  return (
    <>
      <PageHeader
        title="Rutinas"
        action={
          <Link href="/rutinas/nueva" className={buttonVariants({ size: "lg" })}>
            <Plus />
            Nueva
          </Link>
        }
      />
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Routines />
      </Suspense>
      <Link
        href="/rutinas/ejercicios"
        className={buttonVariants({ variant: "outline", size: "xl", className: "mt-8 w-full" })}
      >
        <Dumbbell />
        Catálogo de ejercicios
      </Link>
    </>
  );
}

async function Routines() {
  const routines = await getRoutines();
  return <RoutineList routines={routines} />;
}
