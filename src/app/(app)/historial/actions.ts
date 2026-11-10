"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/action-result";
import { appendSet, deleteSet, upsertSet } from "@/lib/workout-sets";
import { idSchema, type SetValuesInput } from "@/lib/validation/schemas";

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function editHistorySet(
  setId: string,
  workoutExerciseId: string,
  setNumber: number,
  values: SetValuesInput,
): Promise<ActionResult> {
  const result = await upsertSet({ setId, workoutExerciseId, setNumber, values });
  if (!result.ok) return result;
  revalidateAll();
  return ok();
}

export async function addHistorySet(
  workoutExerciseId: string,
  values: SetValuesInput,
): Promise<ActionResult> {
  const result = await appendSet(workoutExerciseId, values);
  if (!result.ok) return result;
  revalidateAll();
  return ok();
}

export async function deleteHistorySet(setId: string): Promise<ActionResult> {
  const result = await deleteSet(setId);
  if (!result.ok) return result;
  revalidateAll();
  return ok();
}

/** Elimina una sesión terminada con todas sus series. */
export async function deleteWorkout(workoutId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(workoutId).success) return fail("Sesión inválida.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .select("id");
  if (error) return fail(GENERIC_ERROR);
  if (data.length === 0) return fail("La sesión no existe.");
  revalidateAll();
  return ok();
}
