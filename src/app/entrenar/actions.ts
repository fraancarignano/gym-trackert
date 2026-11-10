"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/action-result";
import { loadLiveExercises, type LiveExercise } from "@/lib/data/workouts";
import { deleteSet, upsertSet } from "@/lib/workout-sets";
import { idSchema, type SetValuesInput } from "@/lib/validation/schemas";

// Las acciones de series en vivo no revalidan: la pantalla lleva su propio
// estado y refrescarla en cada serie sería trabajo de más. Terminar y descartar
// sí revalidan todo (Inicio, Historial).

/** Empieza una sesión desde una rutina (o libre con null) y abre la pantalla en vivo. */
export async function startWorkout(routineId: string | null) {
  if (routineId !== null && !idSchema.safeParse(routineId).success) {
    throw new Error("Rutina inválida");
  }
  const { supabase } = await requireUser();

  const { data, error } = await supabase.rpc(
    "start_workout",
    routineId ? { p_routine_id: routineId } : {},
  );

  if (error) {
    // Ya hay una sesión en curso: llevar a esa.
    if (error.code === "23505") {
      const { data: current } = await supabase
        .from("workouts")
        .select("id")
        .is("finished_at", null)
        .maybeSingle();
      if (current) redirect(`/entrenar/${current.id}`);
    }
    throw new Error("No se pudo empezar el entrenamiento");
  }

  revalidatePath("/", "layout");
  redirect(`/entrenar/${data}`);
}

export async function saveLiveSet(params: {
  workoutExerciseId: string;
  setNumber: number;
  values: SetValuesInput;
  setId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  return upsertSet(params);
}

export async function removeLiveSet(setId: string): Promise<ActionResult> {
  return deleteSet(setId);
}

/** Agrega ejercicios a la sesión en curso y devuelve sus datos listos para mostrar. */
export async function addWorkoutExercises(
  workoutId: string,
  exerciseIds: string[],
): Promise<ActionResult<LiveExercise[]>> {
  const parsed = z
    .object({ workoutId: idSchema, exerciseIds: z.array(idSchema).min(1).max(50) })
    .safeParse({ workoutId, exerciseIds });
  if (!parsed.success) return fail("Elegí al menos un ejercicio.");

  const { supabase } = await requireUser();
  const { data: workout, error: workoutError } = await supabase
    .from("workouts")
    .select("id, routine_id, finished_at, workout_exercises ( exercise_id, position )")
    .eq("id", workoutId)
    .maybeSingle();
  if (workoutError || !workout) return fail(GENERIC_ERROR);
  if (workout.finished_at) return fail("La sesión ya terminó.");

  const already = new Set(workout.workout_exercises.map((we) => we.exercise_id));
  const toAdd = [...new Set(parsed.data.exerciseIds)].filter((id) => !already.has(id));
  if (toAdd.length === 0) return ok([]);

  let position = Math.max(-1, ...workout.workout_exercises.map((we) => we.position)) + 1;
  const { data: inserted, error } = await supabase
    .from("workout_exercises")
    .insert(
      toAdd.map((exerciseId) => ({
        workout_id: workoutId,
        exercise_id: exerciseId,
        position: position++,
      })),
    )
    .select("id");
  if (error) return fail(GENERIC_ERROR);

  try {
    const exercises = await loadLiveExercises(
      supabase,
      // Los ejercicios agregados en la sesión no toman el objetivo de la rutina.
      { id: workoutId, routineId: null },
      inserted.map((r) => r.id),
    );
    return ok(exercises);
  } catch {
    return fail(GENERIC_ERROR);
  }
}

/** Quita un ejercicio de la sesión en curso, solo si todavía no tiene series. */
export async function removeWorkoutExercise(workoutExerciseId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(workoutExerciseId).success) return fail("Datos inválidos.");
  const { supabase } = await requireUser();

  const { count, error: countError } = await supabase
    .from("workout_sets")
    .select("id", { count: "exact", head: true })
    .eq("workout_exercise_id", workoutExerciseId);
  if (countError) return fail(GENERIC_ERROR);
  if ((count ?? 0) > 0) return fail("Quitá primero las series confirmadas.");

  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", workoutExerciseId);
  if (error) return fail(GENERIC_ERROR);
  return ok();
}

/** Termina la sesión. Sin series confirmadas, se descarta. */
export async function finishWorkout(
  workoutId: string,
): Promise<ActionResult<"finished" | "discarded">> {
  if (!idSchema.safeParse(workoutId).success) return fail("Sesión inválida.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("finish_workout", { p_workout_id: workoutId });
  if (error) return fail(GENERIC_ERROR);

  revalidatePath("/", "layout");
  return ok(data === "discarded" ? "discarded" : "finished");
}

/** Descarta (borra) una sesión en curso con todo lo confirmado. */
export async function discardWorkout(workoutId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(workoutId).success) return fail("Sesión inválida.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .is("finished_at", null)
    .select("id");
  if (error) return fail(GENERIC_ERROR);
  if (data.length === 0) return fail("La sesión ya no está en curso.");

  revalidatePath("/", "layout");
  return ok();
}
