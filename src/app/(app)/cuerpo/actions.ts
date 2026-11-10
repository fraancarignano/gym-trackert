"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { fail, GENERIC_ERROR, ok, type ActionResult } from "@/lib/action-result";
import { formatIsoDate, todayIsoDate } from "@/lib/format";
import {
  bodyMetricSchema,
  firstIssue,
  idSchema,
  type BodyMetricInput,
} from "@/lib/validation/schemas";

/** Crea una medición, o la actualiza si se pasa `id`. Una sola por fecha. */
export async function saveBodyMetric(
  input: BodyMetricInput,
  id?: string | null,
): Promise<ActionResult> {
  if (id && !idSchema.safeParse(id).success) return fail("Medición inválida.");
  const parsed = bodyMetricSchema.safeParse(input);
  if (!parsed.success) return fail(firstIssue(parsed.error));
  const m = parsed.data;
  if (m.measuredOn > todayIsoDate()) return fail("La fecha no puede ser futura.");

  const row = {
    measured_on: m.measuredOn,
    weight_kg: m.weightKg,
    waist_cm: m.waistCm,
    chest_cm: m.chestCm,
    arm_cm: m.armCm,
    thigh_cm: m.thighCm,
    hip_cm: m.hipCm,
  };

  const { supabase } = await requireUser();
  const { error } = id
    ? await supabase.from("body_metrics").update(row).eq("id", id)
    : await supabase.from("body_metrics").insert(row);

  if (error) {
    return fail(
      error.code === "23505"
        ? `Ya hay una medición del ${formatIsoDate(m.measuredOn)}: editala desde la lista.`
        : GENERIC_ERROR,
    );
  }

  revalidatePath("/cuerpo");
  return ok();
}

export async function deleteBodyMetric(id: string): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return fail("Medición inválida.");
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("body_metrics").delete().eq("id", id).select("id");
  if (error) return fail(GENERIC_ERROR);
  if (data.length === 0) return fail("La medición no existe.");
  revalidatePath("/cuerpo");
  return ok();
}
