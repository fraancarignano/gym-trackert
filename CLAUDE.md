@AGENTS.md

# Gym Tracker

PWA personal, mobile-first, para registrar entrenamientos de gimnasio y ver la progresión por ejercicio. Un solo usuario (el dueño), con auth para sincronizar celular y computadora. La especificación completa es "Gym Tracker — Especificación V1" (la tiene Franco). Se trabaja una fase por vez y cada fase cierra con su criterio de aceptación, un commit y el OK de Franco.

## Estado

- [x] Fase 0: base del proyecto (Next.js, shadcn/ui, Supabase, schema + RLS, seed, magic link, navegación inferior)
- [ ] Fase 1: ejercicios y rutinas
- [ ] Fase 2: sesión en vivo e historial
- [ ] Fase 3: progreso y récords
- [ ] Fase 4: peso y medidas
- [ ] Fase 5: PWA y deploy en Vercel

## Stack

- Next.js 16 (App Router, Turbopack, **Cache Components + Partial Prefetching activados**, React Compiler) + TypeScript estricto.
- Supabase (Postgres + Auth) con `@supabase/ssr`. Proyecto `ykvyaukvcaxptpfgsjpm`.
- Tailwind CSS 4 + shadcn/ui (estilo `base-nova`, sobre Base UI, no Radix). Íconos `lucide-react`. Toasts con `sonner`.
- Zod para validar formularios y Server Actions. Vitest para tests unitarios. Recharts para gráficos (a partir de la Fase 3).

## Comandos

```bash
npm run dev        # http://localhost:3000
npm run build
npm run lint
npm run typecheck  # next typegen + tsc
npm test           # vitest run
```

## Estructura

- `src/proxy.ts` + `src/lib/supabase/proxy.ts`: en Next 16, `middleware` pasó a llamarse **proxy**. Refresca la sesión con `getClaims()` y redirige a `/login` en todas las rutas salvo `/login` y `/auth/*`.
- `src/lib/supabase/server.ts` (Server Components / Actions / Route Handlers) y `client.ts` (navegador). Crear un cliente por request. Nunca usar `getSession()` en el servidor para autorizar: usar `getClaims()` o `getUser()`.
- `src/lib/supabase/database.types.ts`: generado, no editar a mano.
- `src/app/(auth)/login`: magic link (Server Action `sendMagicLink`).
- `src/app/auth/confirm/route.ts`: destino del magic link. Acepta `token_hash` + `type` (plantilla de email personalizada, sirve aunque el link se abra en otro dispositivo) y `code` (PKCE).
- `src/app/(app)/`: layout con la navegación inferior (`components/bottom-nav.tsx`) y las pestañas Inicio, Rutinas, Progreso, Historial y Cuerpo. La sesión en vivo (`entrenar/[workoutId]`) va fuera de este grupo, en pantalla completa sin navegación.
- `src/lib/calc/`: cálculos puros (1RM, volumen, récords, rutina sugerida), con tests `*.test.ts`.
- `supabase/migrations/`: un archivo por migración aplicada, `<version>_<nombre>.sql`, donde la versión es la que devuelve `list_migrations`. `supabase/seed.sql` es el catálogo global (44 ejercicios).

## Convenciones

- Código, tablas y variables en inglés; textos de la interfaz en español (Argentina, con voseo).
- Mobile-first, una mano: acciones principales con `<Button size="xl">` (h-12), teclado numérico (`inputMode="decimal"` / `"numeric"`).
- Siempre modo oscuro (`<html class="dark">`). No hay selector de tema.
- Fechas en `America/Argentina/Cordoba`, formato dd/mm/aaaa. Peso en kg con hasta 2 decimales, medidas en cm.
- Lecturas en Server Components; escrituras en Server Actions validadas con Zod.
- Cache Components: leer cookies (o sea, cualquier consulta a Supabase en el servidor) solo dentro de un `<Suspense>`. Si no, el build falla. No hacer `await` de datos de sesión en el nivel superior de un layout.

## Base de datos

- Todo cambio de schema se hace por el MCP de Supabase con `apply_migration`. El mismo SQL se guarda en `supabase/migrations/` y se muestra a Franco **antes** de aplicarlo.
- Después de cada migración: regenerar los tipos con `generate_typescript_types` y guardarlos en `database.types.ts`, y correr `get_advisors` (security) para corregir lo que marque.
- Nunca usar la service role key ni desactivar RLS.
- Las 7 tablas tienen RLS. `anon` no tiene permisos; `authenticated` tiene CRUD filtrado por las políticas. Las tablas hijas verifican la propiedad a través del padre con `exists (...)`.
- Las tablas raíz (`routines`, `workouts`, `body_metrics`) y `exercises` tienen `user_id default auth.uid()`: no hace falta mandarlo al insertar.
- Un ejercicio usado en el historial no se borra (FK `on delete restrict`): se archiva.
- Restricciones a tener en cuenta en la UI:
  - Hay una sola sesión en curso por usuario (`workouts_one_in_progress_per_user`).
  - `unique(routine_id, exercise_id)` en `routine_exercises`.
  - `unique(workout_exercise_id, set_number)`: es diferida, así que se puede renumerar en una transacción.
  - Un registro por fecha en `body_metrics`.
  - Los nombres de ejercicio son únicos sin distinguir mayúsculas.
- Los récords y estadísticas no se guardan: se calculan desde `workout_sets`.

## Fuera de alcance (no implementar)

- Lo de la V2: sugerencias con IA, timer de descanso, modo offline, exportar datos.
- Multiusuario, nutrición y cardio, apps nativas, y campos por serie además de peso y reps.
