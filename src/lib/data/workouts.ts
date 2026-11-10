import "server-only";
import { requireUser } from "@/lib/auth";
import type { PerformedSet } from "@/lib/calc/prefill";
import { shouldIncreaseWeight } from "@/lib/calc/progression";
import { computeRecords, type ExerciseRecords } from "@/lib/calc/records";
import { totalVolume } from "@/lib/calc/volume";
import type { Equipment, MuscleGroup } from "@/lib/constants";
import { getExerciseSessions, isBodyweightEquipment } from "@/lib/data/progress";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

// ─── Tipos ─────────────────────────────────────────────────────

export type SavedSet = PerformedSet & { id: string };

export type LiveExercise = {
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  /** Objetivo de la rutina; null en sesión libre o si se agregó en la sesión. */
  target: { sets: number; repsMin: number; repsMax: number } | null;
  /** Series de la última sesión terminada con este ejercicio. */
  previous: PerformedSet[];
  previousDate: string | null;
  /** Series ya confirmadas en esta sesión. */
  sets: SavedSet[];
  /** Récords previos (de sesiones terminadas), para avisar al superarlos. */
  records: ExerciseRecords;
  /** Indicador "Subí peso" según la última sesión y el objetivo. */
  suggestIncrease: boolean;
};

export type LiveWorkout = {
  id: string;
  routineId: string | null;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  exercises: LiveExercise[];
};

export type WorkoutSummary = {
  id: string;
  title: string;
  startedAt: string;
  finishedAt: string;
  exerciseCount: number;
  setCount: number;
  volumeKg: number;
};

export type WorkoutDetailExercise = {
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  equipment: Equipment;
  sets: SavedSet[];
};

export type WorkoutDetail = {
  id: string;
  title: string;
  startedAt: string;
  finishedAt: string | null;
  exercises: WorkoutDetailExercise[];
  setCount: number;
  volumeKg: number;
};

export const FREE_SESSION_TITLE = "Sesión libre";

// ─── Helpers ───────────────────────────────────────────────────

type RawSet = { id: string; set_number: number; weight_kg: number; reps: number };

function toSavedSets(raw: RawSet[]): SavedSet[] {
  return raw
    .map((s) => ({
      id: s.id,
      setNumber: s.set_number,
      weightKg: Number(s.weight_kg),
      reps: s.reps,
    }))
    .sort((a, b) => a.setNumber - b.setNumber);
}

function titleOf(routine: { name: string } | null) {
  return routine?.name ?? FREE_SESSION_TITLE;
}

/** Series de la última sesión terminada de cada ejercicio (ver get_last_sets). */
async function getPreviousSets(
  supabase: Supabase,
  exerciseIds: string[],
  excludeWorkoutId: string,
) {
  const result = new Map<string, { sets: PerformedSet[]; date: string }>();
  if (exerciseIds.length === 0) return result;

  const { data, error } = await supabase.rpc("get_last_sets", {
    p_exercise_ids: exerciseIds,
    p_exclude_workout_id: excludeWorkoutId,
  });
  if (error) throw error;

  for (const row of data) {
    const entry = result.get(row.exercise_id) ?? { sets: [], date: row.started_at };
    entry.sets.push({
      setNumber: row.set_number,
      weightKg: Number(row.weight_kg),
      reps: row.reps,
    });
    result.set(row.exercise_id, entry);
  }
  return result;
}

const WORKOUT_EXERCISE_SELECT = `
  id, exercise_id, position, created_at,
  exercise:exercises ( name, muscle_group, equipment ),
  workout_sets ( id, set_number, weight_kg, reps )
` as const;

/**
 * Arma los ejercicios de la sesión en vivo con su objetivo, la vez anterior y
 * lo ya confirmado. Si se pasa `onlyIds`, solo esos workout_exercises.
 */
export async function loadLiveExercises(
  supabase: Supabase,
  workout: { id: string; routineId: string | null },
  onlyIds?: string[],
): Promise<LiveExercise[]> {
  let query = supabase
    .from("workout_exercises")
    .select(WORKOUT_EXERCISE_SELECT)
    .eq("workout_id", workout.id);
  if (onlyIds) query = query.in("id", onlyIds);

  const { data: rows, error } = await query;
  if (error) throw error;

  const sorted = [...rows].sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at),
  );
  const exerciseIds = [...new Set(sorted.map((r) => r.exercise_id))];

  const [previous, history, targets] = await Promise.all([
    getPreviousSets(supabase, exerciseIds, workout.id),
    getExerciseSessions(supabase, exerciseIds, { excludeWorkoutId: workout.id }),
    workout.routineId
      ? supabase
          .from("routine_exercises")
          .select("exercise_id, target_sets, target_reps_min, target_reps_max")
          .eq("routine_id", workout.routineId)
          .then(({ data, error: targetError }) => {
            if (targetError) throw targetError;
            return new Map(data.map((t) => [t.exercise_id, t]));
          })
      : Promise.resolve(new Map()),
  ]);

  return sorted.map((row) => {
    const target = targets.get(row.exercise_id);
    const prev = previous.get(row.exercise_id);
    const isBodyweight = isBodyweightEquipment(row.exercise.equipment);
    return {
      workoutExerciseId: row.id,
      exerciseId: row.exercise_id,
      name: row.exercise.name,
      muscleGroup: row.exercise.muscle_group as MuscleGroup,
      equipment: row.exercise.equipment as Equipment,
      target: target
        ? {
            sets: target.target_sets,
            repsMin: target.target_reps_min,
            repsMax: target.target_reps_max,
          }
        : null,
      previous: prev?.sets ?? [],
      previousDate: prev?.date ?? null,
      sets: toSavedSets(row.workout_sets),
      records: computeRecords(history.get(row.exercise_id) ?? [], { isBodyweight }),
      suggestIncrease: shouldIncreaseWeight(prev?.sets ?? [], target?.target_reps_max ?? null),
    };
  });
}

// ─── Lecturas ──────────────────────────────────────────────────

export async function getInProgressWorkout() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workouts")
    .select("id, started_at, routine:routines ( name )")
    .is("finished_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { id: data.id, title: titleOf(data.routine), startedAt: data.started_at };
}

export async function getLiveWorkout(id: string): Promise<LiveWorkout | null> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workouts")
    .select("id, routine_id, started_at, finished_at, routine:routines ( name )")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const exercises = data.finished_at
    ? []
    : await loadLiveExercises(supabase, { id: data.id, routineId: data.routine_id });

  return {
    id: data.id,
    routineId: data.routine_id,
    title: titleOf(data.routine),
    startedAt: data.started_at,
    finishedAt: data.finished_at,
    exercises,
  };
}

const HISTORY_SELECT = `
  id, started_at, finished_at,
  routine:routines ( name ),
  workout_exercises ( id, workout_sets ( weight_kg, reps ) )
` as const;

/** Sesiones terminadas, de la más nueva a la más vieja. */
export async function getWorkoutHistory(limit = 200): Promise<WorkoutSummary[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workouts")
    .select(HISTORY_SELECT)
    .not("finished_at", "is", null)
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return data.map((w) => {
    const sets = w.workout_exercises.flatMap((we) =>
      we.workout_sets.map((s) => ({ weightKg: Number(s.weight_kg), reps: s.reps })),
    );
    return {
      id: w.id,
      title: titleOf(w.routine),
      startedAt: w.started_at,
      finishedAt: w.finished_at!,
      exerciseCount: w.workout_exercises.length,
      setCount: sets.length,
      volumeKg: totalVolume(sets),
    };
  });
}

export async function getLastFinishedWorkout(): Promise<WorkoutSummary | null> {
  const [last] = await getWorkoutHistory(1);
  return last ?? null;
}

export async function getWorkoutDetail(id: string): Promise<WorkoutDetail | null> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workouts")
    .select(
      `id, started_at, finished_at,
       routine:routines ( name ),
       workout_exercises (
         id, exercise_id, position, created_at,
         exercise:exercises ( name, equipment ),
         workout_sets ( id, set_number, weight_kg, reps )
       )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const exercises = [...data.workout_exercises]
    .sort((a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at))
    .map((we) => ({
      workoutExerciseId: we.id,
      exerciseId: we.exercise_id,
      name: we.exercise.name,
      equipment: we.exercise.equipment as Equipment,
      sets: toSavedSets(we.workout_sets),
    }));
  const allSets = exercises.flatMap((e) => e.sets);

  return {
    id: data.id,
    title: titleOf(data.routine),
    startedAt: data.started_at,
    finishedAt: data.finished_at,
    exercises,
    setCount: allSets.length,
    volumeKg: totalVolume(allSets),
  };
}
