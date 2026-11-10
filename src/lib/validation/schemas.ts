import { z } from "zod";
import { EQUIPMENT, LIMITS, MUSCLE_GROUPS } from "@/lib/constants";

export const idSchema = z.uuid();

const nameSchema = z
  .string()
  .trim()
  .min(1, { message: "Poné un nombre." })
  .max(LIMITS.nameMax, { message: `Máximo ${LIMITS.nameMax} caracteres.` });

export const exerciseSchema = z.object({
  name: nameSchema,
  muscleGroup: z.enum(MUSCLE_GROUPS, { message: "Elegí un grupo muscular." }),
  equipment: z.enum(EQUIPMENT, { message: "Elegí un equipo." }),
});
export type ExerciseInput = z.infer<typeof exerciseSchema>;

export const routineSchema = z.object({
  name: nameSchema,
  notes: z
    .string()
    .trim()
    .max(LIMITS.notesMax, { message: `Máximo ${LIMITS.notesMax} caracteres.` })
    .transform((value) => (value === "" ? null : value)),
});
export type RoutineInput = z.infer<typeof routineSchema>;

const intIn = (min: number, max: number, label: string) =>
  z.coerce
    .number({ message: `${label}: ingresá un número.` })
    .int({ message: `${label}: tiene que ser un número entero.` })
    .min(min, { message: `${label}: mínimo ${min}.` })
    .max(max, { message: `${label}: máximo ${max}.` });

export const targetSchema = z
  .object({
    sets: intIn(LIMITS.setsMin, LIMITS.setsMax, "Series"),
    repsMin: intIn(LIMITS.repsMin, LIMITS.repsMax, "Reps mínimas"),
    repsMax: intIn(LIMITS.repsMin, LIMITS.repsMax, "Reps máximas"),
  })
  .refine((t) => t.repsMax >= t.repsMin, {
    message: "Las reps máximas no pueden ser menores que las mínimas.",
    path: ["repsMax"],
  });
export type TargetInput = z.infer<typeof targetSchema>;

export const moveDirectionSchema = z.enum(["up", "down"]);

/** Peso y reps de una serie: peso ≥ 0 (0 = peso corporal) con hasta 2 decimales, reps > 0. */
export const setValuesSchema = z.object({
  weightKg: z
    .number({ message: "Completá el peso." })
    .min(0, { message: "El peso no puede ser negativo." })
    .max(9999.99, { message: "El peso es demasiado alto." })
    .transform((kg) => Math.round(kg * 100) / 100),
  reps: z
    .number({ message: "Completá las reps." })
    .int({ message: "Las reps tienen que ser un número entero." })
    .min(1, { message: "Las reps tienen que ser al menos 1." })
    .max(999, { message: "Demasiadas reps." }),
});
export type SetValuesInput = z.input<typeof setValuesSchema>;

const bodyValue = (min: number, max: number, label: string) =>
  z
    .number({ message: `${label}: ingresá un número.` })
    .min(min, { message: `${label}: mínimo ${min}.` })
    .max(max, { message: `${label}: máximo ${max}.` })
    .transform((v) => Math.round(v * 100) / 100)
    .nullable();

/** Medición corporal: fecha (no futura) y al menos un valor. Peso en kg, medidas en cm. */
export const bodyMetricSchema = z
  .object({
    measuredOn: z.iso.date({ message: "Elegí una fecha válida." }),
    weightKg: bodyValue(20, 400, "Peso"),
    waistCm: bodyValue(20, 300, "Cintura"),
    chestCm: bodyValue(20, 300, "Pecho"),
    armCm: bodyValue(10, 150, "Brazo"),
    thighCm: bodyValue(10, 200, "Muslo"),
    hipCm: bodyValue(20, 300, "Cadera"),
  })
  .refine(
    (m) => [m.weightKg, m.waistCm, m.chestCm, m.armCm, m.thighCm, m.hipCm].some((v) => v !== null),
    { message: "Cargá al menos el peso o una medida." },
  );
export type BodyMetricInput = z.input<typeof bodyMetricSchema>;

/** Primer mensaje de error de un safeParse fallido. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}
