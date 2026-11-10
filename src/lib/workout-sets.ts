import "server-only";
import { requireUser } from "@/lib/auth";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/action-result";
import {
  firstIssue,
  idSchema,
  setValuesSchema,
  type SetValuesInput,
} from "@/lib/validation/schemas";

// Operaciones sobre series compartidas por la sesión en vivo y el historial.
// RLS garantiza que solo se toquen series de sesiones propias.

/** Guarda una serie: la actualiza si se pasa `setId`, si no la crea con ese número. */
export async function upsertSet(params: {
  workoutExerciseId: string;
  setNumber: number;
  values: SetValuesInput;
  setId?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const { workoutExerciseId, setNumber, setId } = params;
  if (
    !idSchema.safeParse(workoutExerciseId).success ||
    (setId && !idSchema.safeParse(setId).success) ||
    !Number.isInteger(setNumber) ||
    setNumber < 1
  ) {
    return fail("Datos inválidos.");
  }
  const parsed = setValuesSchema.safeParse(params.values);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { supabase } = await requireUser();
  const values = { weight_kg: parsed.data.weightKg, reps: parsed.data.reps };

  if (setId) {
    const { data, error } = await supabase
      .from("workout_sets")
      .update(values)
      .eq("id", setId)
      .select("id")
      .single();
    if (error) return fail(GENERIC_ERROR);
    return ok({ id: data.id });
  }

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({ ...values, workout_exercise_id: workoutExerciseId, set_number: setNumber })
    .select("id")
    .single();
  if (error) {
    return fail(error.code === "23505" ? "Esa serie ya estaba guardada. Recargá la página." : GENERIC_ERROR);
  }
  return ok({ id: data.id });
}

/** Agrega una serie al final de un ejercicio (número = última + 1). */
export async function appendSet(
  workoutExerciseId: string,
  values: SetValuesInput,
): Promise<ActionResult<{ id: string }>> {
  if (!idSchema.safeParse(workoutExerciseId).success) return fail("Datos inválidos.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("workout_sets")
    .select("set_number")
    .eq("workout_exercise_id", workoutExerciseId)
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return fail(GENERIC_ERROR);
  return upsertSet({
    workoutExerciseId,
    setNumber: (data?.set_number ?? 0) + 1,
    values,
  });
}

/** Borra una serie y renumera las siguientes (función delete_workout_set). */
export async function deleteSet(setId: string): Promise<ActionResult> {
  if (!idSchema.safeParse(setId).success) return fail("Serie inválida.");
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_workout_set", { p_set_id: setId });
  if (error) return fail(GENERIC_ERROR);
  return ok();
}
