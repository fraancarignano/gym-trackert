"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/action-result";
import { DEFAULT_TARGET } from "@/lib/constants";
import { moveItem, type MoveDirection } from "@/lib/reorder";
import {
  firstIssue,
  idSchema,
  moveDirectionSchema,
  routineSchema,
  targetSchema,
  type TargetInput,
} from "@/lib/validation/schemas";

type Supabase = Awaited<ReturnType<typeof requireUser>>["supabase"];

export type RoutineFormState =
  | { status: "idle" }
  | { status: "saved" }
  | { status: "error"; message: string };

function revalidateAll() {
  revalidatePath("/", "layout");
}

function parseRoutineForm(formData: FormData) {
  return routineSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });
}

async function nextRoutinePosition(supabase: Supabase) {
  const { data } = await supabase
    .from("routines")
    .select("position")
    .eq("is_archived", false)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? -1) + 1;
}

// ─── Rutinas ───────────────────────────────────────────────────

export async function createRoutine(
  _prev: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  const parsed = parseRoutineForm(formData);
  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("routines")
    .insert({ ...parsed.data, position: await nextRoutinePosition(supabase) })
    .select("id")
    .single();

  if (error) return { status: "error", message: GENERIC_ERROR };

  revalidateAll();
  redirect(`/rutinas/${data.id}`);
}

export async function updateRoutine(
  routineId: string,
  _prev: RoutineFormState,
  formData: FormData,
): Promise<RoutineFormState> {
  if (!idSchema.safeParse(routineId).success) {
    return { status: "error", message: "Rutina inválida." };
  }
  const parsed = parseRoutineForm(formData);
  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("routines")
    .update(parsed.data)
    .eq("id", routineId);

  if (error) return { status: "error", message: GENERIC_ERROR };

  revalidateAll();
  return { status: "saved" };
}

export async function moveRoutine(
  routineId: string,
  direction: MoveDirection,
): Promise<ActionResult> {
  if (
    !idSchema.safeParse(routineId).success ||
    !moveDirectionSchema.safeParse(direction).success
  ) {
    return fail("Datos inválidos.");
  }

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("routines")
    .select("id")
    .eq("is_archived", false)
    .order("position")
    .order("created_at");
  if (error) return fail(GENERIC_ERROR);

  const order = moveItem(data.map((r) => r.id), routineId, direction);
  const results = await Promise.all(
    order.map((id, position) =>
      supabase.from("routines").update({ position }).eq("id", id),
    ),
  );
  if (results.some((r) => r.error)) return fail(GENERIC_ERROR);

  revalidateAll();
  return ok();
}

export async function setRoutineArchived(
  routineId: string,
  archived: boolean,
): Promise<ActionResult> {
  if (!idSchema.safeParse(routineId).success) return fail("Rutina inválida.");

  const { supabase } = await requireUser();
  // Al restaurar, la rutina vuelve al final de la lista.
  const update = archived
    ? { is_archived: true }
    : { is_archived: false, position: await nextRoutinePosition(supabase) };

  const { error } = await supabase
    .from("routines")
    .update(update)
    .eq("id", routineId);
  if (error) return fail(GENERIC_ERROR);

  revalidateAll();
  return ok();
}

// ─── Ejercicios de una rutina ──────────────────────────────────

export async function addRoutineExercises(
  routineId: string,
  exerciseIds: string[],
): Promise<ActionResult> {
  const parsed = z
    .object({ routineId: idSchema, exerciseIds: z.array(idSchema).min(1).max(50) })
    .safeParse({ routineId, exerciseIds });
  if (!parsed.success) return fail("Elegí al menos un ejercicio.");

  const { supabase } = await requireUser();

  const { data: current, error: currentError } = await supabase
    .from("routine_exercises")
    .select("exercise_id, position")
    .eq("routine_id", routineId);
  if (currentError) return fail(GENERIC_ERROR);

  const already = new Set(current.map((re) => re.exercise_id));
  const toAdd = [...new Set(parsed.data.exerciseIds)].filter((id) => !already.has(id));
  let position = Math.max(-1, ...current.map((re) => re.position)) + 1;

  if (toAdd.length > 0) {
    const { error } = await supabase.from("routine_exercises").insert(
      toAdd.map((exerciseId) => ({
        routine_id: routineId,
        exercise_id: exerciseId,
        position: position++,
        target_sets: DEFAULT_TARGET.sets,
        target_reps_min: DEFAULT_TARGET.repsMin,
        target_reps_max: DEFAULT_TARGET.repsMax,
      })),
    );
    // RLS rechaza la inserción si la rutina no es del usuario.
    if (error) return fail(GENERIC_ERROR);
  }

  revalidateAll();
  redirect(`/rutinas/${routineId}`);
}

export async function updateRoutineExerciseTarget(
  routineExerciseId: string,
  target: TargetInput,
): Promise<ActionResult> {
  if (!idSchema.safeParse(routineExerciseId).success) return fail("Datos inválidos.");
  const parsed = targetSchema.safeParse(target);
  if (!parsed.success) return fail(firstIssue(parsed.error));

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("routine_exercises")
    .update({
      target_sets: parsed.data.sets,
      target_reps_min: parsed.data.repsMin,
      target_reps_max: parsed.data.repsMax,
    })
    .eq("id", routineExerciseId)
    .select("id");
  if (error || data.length === 0) return fail(GENERIC_ERROR);

  revalidateAll();
  return ok();
}

export async function moveRoutineExercise(
  routineExerciseId: string,
  direction: MoveDirection,
): Promise<ActionResult> {
  if (
    !idSchema.safeParse(routineExerciseId).success ||
    !moveDirectionSchema.safeParse(direction).success
  ) {
    return fail("Datos inválidos.");
  }

  const { supabase } = await requireUser();
  const { data: row, error: rowError } = await supabase
    .from("routine_exercises")
    .select("routine_id")
    .eq("id", routineExerciseId)
    .maybeSingle();
  if (rowError || !row) return fail(GENERIC_ERROR);

  const { data, error } = await supabase
    .from("routine_exercises")
    .select("id")
    .eq("routine_id", row.routine_id)
    .order("position")
    .order("created_at");
  if (error) return fail(GENERIC_ERROR);

  const order = moveItem(data.map((re) => re.id), routineExerciseId, direction);
  const results = await Promise.all(
    order.map((id, position) =>
      supabase.from("routine_exercises").update({ position }).eq("id", id),
    ),
  );
  if (results.some((r) => r.error)) return fail(GENERIC_ERROR);

  revalidateAll();
  return ok();
}

export async function removeRoutineExercise(
  routineExerciseId: string,
): Promise<ActionResult> {
  if (!idSchema.safeParse(routineExerciseId).success) return fail("Datos inválidos.");

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("routine_exercises")
    .delete()
    .eq("id", routineExerciseId);
  if (error) return fail(GENERIC_ERROR);

  revalidateAll();
  return ok();
}
