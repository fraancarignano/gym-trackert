/** Grupos musculares válidos (mismo orden que el check de la base). */
export const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Piernas",
  "Glúteos",
  "Gemelos",
  "Abdominales",
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

/** Equipos válidos (mismo orden que el check de la base). */
export const EQUIPMENT = [
  "Barra",
  "Mancuernas",
  "Polea",
  "Máquina",
  "Peso corporal",
] as const;
export type Equipment = (typeof EQUIPMENT)[number];

/** Objetivo por defecto al agregar un ejercicio a una rutina: 3 × 8–12. */
export const DEFAULT_TARGET = { sets: 3, repsMin: 8, repsMax: 12 } as const;

export const LIMITS = {
  nameMax: 100,
  notesMax: 500,
  setsMin: 1,
  setsMax: 20,
  repsMin: 1,
  repsMax: 100,
} as const;
