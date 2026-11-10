import "server-only";
import { requireUser } from "@/lib/auth";
import { MUSCLE_GROUPS, type Equipment, type MuscleGroup } from "@/lib/constants";

export type CatalogExercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isOwn: boolean;
};

const groupOrder = new Map<string, number>(MUSCLE_GROUPS.map((g, i) => [g, i]));

/** Catálogo activo: ejercicios globales + propios no archivados, por grupo y nombre. */
export async function getCatalog(): Promise<CatalogExercise[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("exercises")
    .select("id, name, muscle_group, equipment, user_id")
    .eq("is_archived", false);

  if (error) throw error;

  return data
    .map((row) => ({
      id: row.id,
      name: row.name,
      muscleGroup: row.muscle_group as MuscleGroup,
      equipment: row.equipment as Equipment,
      isOwn: row.user_id !== null,
    }))
    .sort(
      (a, b) =>
        (groupOrder.get(a.muscleGroup) ?? 99) - (groupOrder.get(b.muscleGroup) ?? 99) ||
        a.name.localeCompare(b.name, "es"),
    );
}
