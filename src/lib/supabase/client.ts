import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Cliente de Supabase para Client Components (corre en el navegador). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
