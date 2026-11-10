import "server-only";
import { requireUser } from "@/lib/auth";
import type { Equipment, MuscleGroup } from "@/lib/constants";

export type RoutineSummary = {
  id: string;
  name: string;
  notes: string | null;
  isArchived: boolean;
  exerciseCount: number;
};

export type RoutineExerciseItem = {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isArchivedExercise: boolean;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
};

export type RoutineDetail = {
  id: string;
  name: string;
  notes: string | null;
  isArchived: boolean;
  exercises: RoutineExerciseItem[];
};

/** Todas las rutinas del usuario, ordenadas por posición (activas y archivadas). */
export async function getRoutines(): Promise<RoutineSummary[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("routines")
    .select("id, name, notes, is_archived, routine_exercises(count)")
    .order("position")
    .order("created_at");

  if (error) throw error;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    notes: row.notes,
    isArchived: row.is_archived,
    exerciseCount: row.routine_exercises[0]?.count ?? 0,
  }));
}

/** Una rutina con sus ejercicios en orden, o null si no existe o no es del usuario. */
export async function getRoutine(id: string): Promise<RoutineDetail | null> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("routines")
    .select(
      `id, name, notes, is_archived,
       routine_exercises (
         id, position, target_sets, target_reps_min, target_reps_max, created_at,
         exercise:exercises ( id, name, muscle_group, equipment, is_archived )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const exercises = [...data.routine_exercises]
    .sort(
      (a, b) =>
        a.position - b.position || a.created_at.localeCompare(b.created_at),
    )
    .map((re) => ({
      id: re.id,
      exerciseId: re.exercise.id,
      name: re.exercise.name,
      muscleGroup: re.exercise.muscle_group as MuscleGroup,
      equipment: re.exercise.equipment as Equipment,
      isArchivedExercise: re.exercise.is_archived,
      targetSets: re.target_sets,
      targetRepsMin: re.target_reps_min,
      targetRepsMax: re.target_reps_max,
    }));

  return {
    id: data.id,
    name: data.name,
    notes: data.notes,
    isArchived: data.is_archived,
    exercises,
  };
}
