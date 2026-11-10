"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const emailSchema = z.email({ message: "Ingresá un email válido." });

async function getOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = emailSchema.safeParse(
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${await getOrigin()}/auth/confirm` },
  });

  if (error) {
    const message =
      error.status === 429
        ? "Pediste demasiados links seguidos. Esperá unos minutos y probá de nuevo."
        : "No pudimos enviar el link. Probá de nuevo en un momento.";
    return { status: "error", message };
  }

  return { status: "sent", email: parsed.data };
}

export type CodeState = { error: string | null };

const codeSchema = z.object({
  email: emailSchema,
  // Supabase manda códigos de 6 dígitos por defecto (configurable hasta 10).
  token: z.string().regex(/^\d{6,10}$/, { message: "El código tiene 6 dígitos." }),
});

/**
 * Entrar con el código del email en vez del link. Sirve en la app instalada en
 * iPhone, que no comparte la sesión con Safari: el código se tipea ahí mismo.
 */
export async function verifyLoginCode(
  _prev: CodeState,
  formData: FormData,
): Promise<CodeState> {
  const parsed = codeSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    token: String(formData.get("token") ?? "").replace(/\D/g, ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: "email",
  });
  if (error) {
    return {
      error:
        error.status === 429
          ? "Demasiados intentos. Esperá unos minutos."
          : "El código no es válido o ya venció. Pedí uno nuevo.",
    };
  }

  redirect("/");
}
