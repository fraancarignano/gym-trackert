import "server-only";
import { requireUser } from "@/lib/auth";
import type { BodyMetric } from "@/lib/calc/body";
import { fetchAll } from "@/lib/data/progress";

const num = (v: number | null) => (v === null ? null : Number(v));

/** Todas las mediciones del usuario, de la más nueva a la más vieja. */
export async function getBodyMetrics(): Promise<BodyMetric[]> {
  const { supabase } = await requireUser();
  const rows = await fetchAll((from, to) =>
    supabase
      .from("body_metrics")
      .select("id, measured_on, weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm")
      .order("measured_on", { ascending: false })
      .range(from, to),
  );
  return rows.map((r) => ({
    id: r.id,
    measuredOn: r.measured_on,
    weightKg: num(r.weight_kg),
    waistCm: num(r.waist_cm),
    chestCm: num(r.chest_cm),
    armCm: num(r.arm_cm),
    thighCm: num(r.thigh_cm),
    hipCm: num(r.hip_cm),
  }));
}
