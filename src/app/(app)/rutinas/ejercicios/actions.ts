"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/action-result";
import { escapeLike } from "@/lib/text";
import {
  exerciseSchema,
  firstIssue,
  idSchema,
  type ExerciseInput,
} from "@/lib/validation/schemas";

/**
 * Crea un ejercicio propio. Si ya existía uno propio archivado con el mismo
 * nombre, lo reactiva con el grupo y equipo nuevos en vez de duplicarlo.
 */
export async function createExercise(
  input: ExerciseInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = exerciseSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const { name, muscleGroup, equipment } = parsed.data;

  const { supabase, userId } = await requireUser();

  // RLS devuelve solo ejercicios globales y propios.
  const { data: existing, error: lookupError } = await supabase
    .from("exercises")
    .select("id, user_id, is_archived")
    .ilike("name", escapeLike(name));
  if (lookupError) return fail(GENERIC_ERROR);

  if (existing.some((e) => e.user_id === null)) {
    return fail("Ya existe un ejercicio con ese nombre en el catálogo.");
  }

  const own = existing.find((e) => e.user_id === userId);
  if (own && !own.is_archived) {
    return fail("Ya tenés un ejercicio con ese nombre.");
  }

  if (own) {
    const { error } = await supabase
      .from("exercises")
      .update({ is_archived: false, muscle_group: muscleGroup, equipment })
      .eq("id", own.id);
    if (error) return fail(GENERIC_ERROR);
    revalidatePath("/", "layout");
    return ok({ id: own.id });
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert({ name, muscle_group: muscleGroup, equipment })
    .select("id")
    .single();

  if (error) {
    return fail(
      error.code === "23505"
        ? "Ya tenés un ejercicio con ese nombre."
        : GENERIC_ERROR,
    );
  }

  revalidatePath("/", "layout");
  return ok({ id: data.id });
}

/** Archiva un ejercicio propio: deja de aparecer en el catálogo, el historial lo sigue mostrando. */
export async function archiveExercise(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("Ejercicio inválido.");
  const { supabase, userId } = await requireUser();

  const { data, error } = await supabase
    .from("exercises")
    .update({ is_archived: true })
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");

  if (error) return fail(GENERIC_ERROR);
  if (data.length === 0) return fail("Solo podés archivar ejercicios propios.");

  revalidatePath("/", "layout");
  return ok();
}
