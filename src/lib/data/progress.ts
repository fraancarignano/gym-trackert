import "server-only";
import { requireUser } from "@/lib/auth";
import {
  computeRecords,
  sessionBreaksRecords,
  type BrokenRecord,
  type ExerciseSession,
  type RecordSet,
} from "@/lib/calc/records";
import type { Equipment, MuscleGroup } from "@/lib/constants";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

const PAGE_SIZE = 1000; // Límite de filas por request de la API de Supabase.

/** Trae todas las páginas de una consulta (la API corta en 1000 filas). */
async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

export function isBodyweightEquipment(equipment: string) {
  return equipment === "Peso corporal";
}

/**
 * Sesiones terminadas de cada ejercicio, con sus series.
 * - `excludeWorkoutId`: dejar afuera una sesión (la actual).
 * - `before`: solo sesiones que empezaron antes de esa fecha.
 */
export async function getExerciseSessions(
  supabase: Supabase,
  exerciseIds: string[],
  options: { excludeWorkoutId?: string; before?: string } = {},
): Promise<Map<string, ExerciseSession[]>> {
  const result = new Map<string, ExerciseSession[]>();
  if (exerciseIds.length === 0) return result;

  const rows = await fetchAll((from, to) =>
    supabase
      .from("workout_exercises")
      .select(
        "id, exercise_id, workout:workouts!inner ( id, started_at, finished_at ), workout_sets ( weight_kg, reps )",
      )
      .in("exercise_id", exerciseIds)
      .order("id")
      .range(from, to),
  );

  const byKey = new Map<string, ExerciseSession & { exerciseId: string }>();
  for (const row of rows) {
    const w = row.workout;
    if (!w.finished_at) continue;
    if (options.excludeWorkoutId && w.id === options.excludeWorkoutId) continue;
    if (options.before && w.started_at >= options.before) continue;
    if (row.workout_sets.length === 0) continue;

    // Un mismo ejercicio podría figurar dos veces en una sesión: se juntan.
    const key = `${row.exercise_id}:${w.id}`;
    const session = byKey.get(key) ?? {
      exerciseId: row.exercise_id,
      workoutId: w.id,
      startedAt: w.started_at,
      sets: [],
    };
    session.sets.push(
      ...row.workout_sets.map((s) => ({ weightKg: Number(s.weight_kg), reps: s.reps })),
    );
    byKey.set(key, session);
  }

  for (const { exerciseId, ...session } of byKey.values()) {
    const list = result.get(exerciseId) ?? [];
    list.push(session);
    result.set(exerciseId, list);
  }
  for (const list of result.values()) {
    list.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }
  return result;
}

export type ProgressListItem = {
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  lastDoneAt: string;
  sessionCount: number;
};

/** Ejercicios con historial (al menos una serie en una sesión terminada), por uso reciente. */
export async function getProgressList(): Promise<ProgressListItem[]> {
  const { supabase } = await requireUser();
  const rows = await fetchAll((from, to) =>
    supabase
      .from("workout_exercises")
      .select(
        "id, exercise_id, exercise:exercises ( name, muscle_group, equipment ), workout:workouts!inner ( id, started_at, finished_at ), workout_sets ( id )",
      )
      .order("id")
      .range(from, to),
  );

  const items = new Map<string, ProgressListItem & { workouts: Set<string> }>();
  for (const row of rows) {
    if (!row.workout.finished_at || row.workout_sets.length === 0) continue;
    const item = items.get(row.exercise_id) ?? {
      exerciseId: row.exercise_id,
      name: row.exercise.name,
      muscleGroup: row.exercise.muscle_group as MuscleGroup,
      equipment: row.exercise.equipment as Equipment,
      lastDoneAt: row.workout.started_at,
      sessionCount: 0,
      workouts: new Set<string>(),
    };
    item.workouts.add(row.workout.id);
    if (row.workout.started_at > item.lastDoneAt) item.lastDoneAt = row.workout.started_at;
    items.set(row.exercise_id, item);
  }

  return [...items.values()]
    .map(({ workouts, ...item }) => ({ ...item, sessionCount: workouts.size }))
    .sort((a, b) => b.lastDoneAt.localeCompare(a.lastDoneAt));
}

export type ExerciseProgress = {
  exercise: {
    id: string;
    name: string;
    muscleGroup: MuscleGroup;
    equipment: Equipment;
    isBodyweight: boolean;
  };
  sessions: ExerciseSession[];
};

/** Un ejercicio con todas sus sesiones terminadas, o null si no existe o no es visible. */
export async function getExerciseProgress(exerciseId: string): Promise<ExerciseProgress | null> {
  const { supabase } = await requireUser();
  const { data: exercise, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment")
    .eq("id", exerciseId)
    .maybeSingle();
  if (error) throw error;
  if (!exercise) return null;

  const sessions = await getExerciseSessions(supabase, [exerciseId]);
  return {
    exercise: {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscle_group as MuscleGroup,
      equipment: exercise.equipment as Equipment,
      isBodyweight: isBodyweightEquipment(exercise.equipment),
    },
    sessions: sessions.get(exerciseId) ?? [],
  };
}

export type AchievedRecords = { exerciseName: string; records: BrokenRecord[] };

/**
 * Récords que logró una sesión terminada, por ejercicio, comparando contra las
 * sesiones anteriores a ella (incluye el récord de volumen de la sesión).
 */
export async function getAchievedRecords(workout: {
  id: string;
  startedAt: string;
  exercises: { exerciseId: string; name: string; equipment: string; sets: RecordSet[] }[];
}): Promise<AchievedRecords[]> {
  const { supabase } = await requireUser();
  const history = await getExerciseSessions(
    supabase,
    [...new Set(workout.exercises.map((e) => e.exerciseId))],
    { excludeWorkoutId: workout.id, before: workout.startedAt },
  );

  return workout.exercises
    .map((exercise) => {
      const options = { isBodyweight: isBodyweightEquipment(exercise.equipment) };
      const previous = computeRecords(history.get(exercise.exerciseId) ?? [], options);
      return {
        exerciseName: exercise.name,
        records: sessionBreaksRecords(exercise.sets, previous, options),
      };
    })
    .filter((e) => e.records.length > 0);
}

/** Fecha de la última sesión terminada de cada rutina. */
export async function getRoutineLastDone(): Promise<Map<string, string>> {
  const { supabase } = await requireUser();
  const rows = await fetchAll((from, to) =>
    supabase
      .from("workouts")
      .select("routine_id, started_at")
      .not("finished_at", "is", null)
      .not("routine_id", "is", null)
      .order("started_at", { ascending: false })
      .range(from, to),
  );
  const result = new Map<string, string>();
  for (const row of rows) {
    if (row.routine_id && !result.has(row.routine_id)) result.set(row.routine_id, row.started_at);
  }
  return result;
}
