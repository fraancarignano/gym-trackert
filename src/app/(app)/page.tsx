import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight, ClipboardList, LogOut, Play, Plus } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ListSkeleton } from "@/components/list-skeleton";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { StartWorkoutButton } from "@/components/workout/start-workout-button";
import { sortRoutinesForHome } from "@/lib/calc/suggested-routine";
import { getRoutineLastDone } from "@/lib/data/progress";
import { getRoutines } from "@/lib/data/routines";
import { getInProgressWorkout, getLastFinishedWorkout } from "@/lib/data/workouts";
import {
  formatDate,
  formatDateWithWeekday,
  formatDuration,
  formatNumber,
  formatTime,
} from "@/lib/format";
import { startWorkout } from "../entrenar/actions";
import { signOut } from "./actions";

export default function HomePage() {
  return (
    <>
      <PageHeader
        title="Inicio"
        action={
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="icon-lg" aria-label="Cerrar sesión">
              <LogOut />
            </Button>
          </form>
        }
      />
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <HomeContent />
      </Suspense>
    </>
  );
}

async function HomeContent() {
  const [inProgress, routines, last, lastDone] = await Promise.all([
    getInProgressWorkout(),
    getRoutines(),
    getLastFinishedWorkout(),
    getRoutineLastDone(),
  ]);
  // Rutina sugerida: primero las nunca hechas, después la que hace más que no se hace.
  const active = sortRoutinesForHome(
    routines
      .filter((r) => !r.isArchived)
      .map((r, position) => ({ ...r, position, lastDoneAt: lastDone.get(r.id) ?? null })),
  );

  return (
    <div className="flex flex-col gap-8">
      {inProgress ? (
        <section
          aria-labelledby="in-progress-title"
          className="flex flex-col gap-3 rounded-xl border border-primary/50 bg-primary/10 p-4"
        >
          <div>
            <h2 id="in-progress-title" className="font-semibold">
              Entrenamiento en curso
            </h2>
            <p className="text-sm text-muted-foreground">
              {inProgress.title} · empezó a las {formatTime(inProgress.startedAt)}
            </p>
          </div>
          <Link
            href={`/entrenar/${inProgress.id}`}
            className={buttonVariants({ size: "xl", className: "w-full" })}
          >
            <Play />
            Retomar entrenamiento
          </Link>
        </section>
      ) : (
        <section aria-labelledby="start-title" className="flex flex-col gap-3">
          <h2 id="start-title" className="text-lg font-semibold">
            Empezar a entrenar
          </h2>

          {active.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Todavía no tenés rutinas"
              description="Creá una rutina o arrancá una sesión libre."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {active.map((routine, index) => (
                <li key={routine.id}>
                  <form action={startWorkout.bind(null, routine.id)}>
                    <StartWorkoutButton>
                      <span className="flex items-center gap-2">
                        <span className="truncate font-medium">{routine.name}</span>
                        {index === 0 && <Badge>Sugerida</Badge>}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {routine.exerciseCount === 1
                          ? "1 ejercicio"
                          : `${routine.exerciseCount} ejercicios`}
                        {" · "}
                        {routine.lastDoneAt
                          ? `última vez ${formatDate(routine.lastDoneAt)}`
                          : "nunca la hiciste"}
                      </span>
                    </StartWorkoutButton>
                  </form>
                </li>
              ))}
            </ul>
          )}

          <form action={startWorkout.bind(null, null)}>
            <StartWorkoutButton variant="outline">
              <span className="flex items-center gap-2 font-medium">
                <Plus className="size-4" aria-hidden />
                Sesión libre
              </span>
              <span className="text-sm text-muted-foreground">
                Sin rutina: agregás los ejercicios sobre la marcha.
              </span>
            </StartWorkoutButton>
          </form>

          {active.length === 0 && (
            <Link
              href="/rutinas/nueva"
              className={buttonVariants({ variant: "outline", size: "xl", className: "w-full" })}
            >
              <Plus />
              Crear rutina
            </Link>
          )}
        </section>
      )}

      {last && (
        <section aria-labelledby="last-title" className="flex flex-col gap-3">
          <h2 id="last-title" className="text-lg font-semibold">
            Último entrenamiento
          </h2>
          <Link
            href={`/historial/${last.id}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate font-medium">{last.title}</span>
              <span className="text-sm text-muted-foreground first-letter:uppercase">
                {formatDateWithWeekday(last.startedAt)} ·{" "}
                {formatDuration(Date.parse(last.finishedAt) - Date.parse(last.startedAt))}
              </span>
              <span className="text-sm text-muted-foreground">
                {last.setCount} {last.setCount === 1 ? "serie" : "series"} ·{" "}
                {formatNumber(last.volumeKg)} kg de volumen
              </span>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          </Link>
        </section>
      )}
    </div>
  );
}
