import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Devuelve el cliente de Supabase y el id del usuario logueado.
 * Usar al principio de cada Server Action y de cada lectura protegida:
 * las Server Actions se pueden invocar por POST directo, más allá del proxy.
 */
export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}
