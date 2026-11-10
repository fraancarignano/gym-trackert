"use client";

import { useMemo, useState, useTransition } from "react";
import { Archive, Check, Search, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import { addRoutineExercises } from "@/app/(app)/rutinas/actions";
import { archiveExercise } from "@/app/(app)/rutinas/ejercicios/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/lib/constants";
import type { CatalogExercise } from "@/lib/data/exercises";
import { normalizeText } from "@/lib/text";
import { cn } from "@/lib/utils";
import { CreateExerciseDialog } from "./create-exercise-dialog";

type Props =
  | { mode: "browse"; exercises: CatalogExercise[] }
  | {
      mode: "pick";
      exercises: CatalogExercise[];
      routineId: string;
      /** Ejercicios que ya están en la rutina. */
      excludedIds: string[];
    };

export function ExerciseCatalog(props: Props) {
  const { exercises, mode } = props;
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const excluded = new Set(props.mode === "pick" ? props.excludedIds : []);

  const visible = useMemo(() => {
    const q = normalizeText(query);
    return exercises.filter(
      (e) =>
        (group === null || e.muscleGroup === group) &&
        (q === "" || normalizeText(e.name).includes(q)),
    );
  }, [exercises, group, query]);

  const sections = useMemo(
    () =>
      MUSCLE_GROUPS.map((g) => ({
        group: g,
        items: visible.filter((e) => e.muscleGroup === g),
      })).filter((s) => s.items.length > 0),
    [visible],
  );

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function handleArchive(exercise: CatalogExercise) {
    startTransition(async () => {
      const result = await archiveExercise(exercise.id);
      if (result.ok) toast.success(`"${exercise.name}" archivado`);
      else toast.error(result.error);
    });
  }

  function handleAdd() {
    if (props.mode !== "pick" || selected.length === 0) return;
    const { routineId } = props;
    startTransition(async () => {
      // Si sale bien, la acción redirige al editor de la rutina.
      const result = await addRoutineExercises(routineId, selected);
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ejercicio"
            aria-label="Buscar ejercicio"
            autoComplete="off"
            className="h-12 pr-10 pl-10 text-base [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Borrar búsqueda"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center">
          <CreateExerciseDialog
            key={`${query}-${group ?? ""}`}
            defaultName={visible.length === 0 ? query.trim() : ""}
            defaultGroup={group ?? undefined}
            onCreated={(id) => {
              setQuery("");
              if (mode === "pick") setSelected((current) => [...current, id]);
            }}
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Filtrar por grupo muscular"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
      >
        {[null, ...MUSCLE_GROUPS].map((g) => {
          const active = group === g;
          return (
            <button
              key={g ?? "all"}
              type="button"
              aria-pressed={active}
              onClick={() => setGroup(g)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {g ?? "Todos"}
            </button>
          );
        })}
      </div>

      {sections.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <SearchX className="size-8 text-muted-foreground" aria-hidden />
          <p className="font-medium">No encontramos ejercicios</p>
          <p className="text-sm text-muted-foreground">
            Probá con otra búsqueda o creá un ejercicio propio.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map(({ group: g, items }) => (
            <section key={g} aria-labelledby={`group-${g}`}>
              <h2
                id={`group-${g}`}
                className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {g}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {items.map((exercise) =>
                  mode === "pick" ? (
                    <PickRow
                      key={exercise.id}
                      exercise={exercise}
                      inRoutine={excluded.has(exercise.id)}
                      selected={selected.includes(exercise.id)}
                      onToggle={() => toggle(exercise.id)}
                    />
                  ) : (
                    <BrowseRow
                      key={exercise.id}
                      exercise={exercise}
                      disabled={pending}
                      onArchive={() => handleArchive(exercise)}
                    />
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      {mode === "pick" && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom)+0.75rem)] z-30 mt-2">
          <Button
            size="xl"
            className="w-full shadow-lg"
            disabled={selected.length === 0 || pending}
            onClick={handleAdd}
          >
            {pending
              ? "Agregando…"
              : selected.length === 0
                ? "Elegí ejercicios"
                : `Agregar ${selected.length} ${selected.length === 1 ? "ejercicio" : "ejercicios"}`}
          </Button>
        </div>
      )}
    </div>
  );
}

function ExerciseInfo({ exercise }: { exercise: CatalogExercise }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <span className="truncate font-medium">{exercise.name}</span>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {exercise.equipment}
        {exercise.isOwn && <Badge variant="secondary">Propio</Badge>}
      </span>
    </div>
  );
}

function BrowseRow({
  exercise,
  disabled,
  onArchive,
}: {
  exercise: CatalogExercise;
  disabled: boolean;
  onArchive: () => void;
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-2">
      <ExerciseInfo exercise={exercise} />
      {exercise.isOwn && (
        <ConfirmDialog
          trigger={
            <Button
              variant="ghost"
              size="icon-lg"
              disabled={disabled}
              aria-label={`Archivar ${exercise.name}`}
            >
              <Archive />
            </Button>
          }
          title="¿Archivar ejercicio?"
          description={`"${exercise.name}" deja de aparecer en el catálogo. Las rutinas y el historial que lo usan no cambian.`}
          confirmLabel="Archivar"
          onConfirm={onArchive}
        />
      )}
    </li>
  );
}

function PickRow({
  exercise,
  inRoutine,
  selected,
  onToggle,
}: {
  exercise: CatalogExercise;
  inRoutine: boolean;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={inRoutine}
        aria-pressed={selected}
        className={cn(
          "flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left transition-colors",
          selected && "bg-primary/10",
          inRoutine ? "opacity-50" : "hover:bg-muted/50",
        )}
      >
        <ExerciseInfo exercise={exercise} />
        {inRoutine ? (
          <span className="shrink-0 text-sm text-muted-foreground">En la rutina</span>
        ) : (
          <span
            aria-hidden
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
              selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
            )}
          >
            {selected && <Check className="size-4" />}
          </span>
        )}
      </button>
    </li>
  );
}
