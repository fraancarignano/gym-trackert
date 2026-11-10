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

/** Primer mensaje de error de un safeParse fallido. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos.";
}
