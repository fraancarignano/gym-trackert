@AGENTS.md

# Gym Tracker

PWA personal, mobile-first, para registrar entrenamientos de gimnasio y ver la progresión por ejercicio. Un solo usuario (el dueño), con auth para sincronizar celular y computadora. La especificación completa es "Gym Tracker — Especificación V1" (la tiene Franco). Se trabaja una fase por vez y cada fase cierra con su criterio de aceptación, un commit y el OK de Franco.

## Estado

- [x] Fase 0: base del proyecto (Next.js, shadcn/ui, Supabase, schema + RLS, seed, magic link, navegación inferior)
- [x] Fase 1: ejercicios y rutinas
- [x] Fase 2: sesión en vivo e historial
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
- `src/app/auth/confirm/route.ts`: destino del magic link.
  - Acepta `code` (PKCE). Es lo que manda la plantilla por defecto: el link se tiene que abrir en el mismo navegador donde se pidió.
  - También acepta `token_hash` + `type`, que requiere una plantilla personalizada. Supabase solo deja editar plantillas con SMTP propio, que todavía no está configurado.
- `src/app/(app)/`: layout con la navegación inferior (`components/bottom-nav.tsx`) y las pestañas Inicio, Rutinas, Progreso, Historial y Cuerpo. La sesión en vivo (`entrenar/[workoutId]`) va fuera de este grupo, en pantalla completa sin navegación.
- `src/app/(app)/rutinas/`:
  - `page.tsx`: lista de rutinas, que se reordena con subir/bajar y tiene una sección de archivadas para restaurarlas.
  - `nueva/`: crear rutina.
  - `[id]/`: editor (ejercicios con objetivo, datos, archivar).
  - `[id]/agregar/`: catálogo en modo selección.
  - `ejercicios/`: catálogo en modo navegación.
  - Las Server Actions están en `rutinas/actions.ts` y `rutinas/ejercicios/actions.ts`.
- `src/components/exercises/exercise-catalog.tsx`: catálogo reutilizable, con `mode: "browse" | "pick"`. Busca sin distinguir tildes y filtra por grupo muscular. En modo `pick` recibe `onConfirm(ids)`: una Server Action bindeada en el editor de rutina, o una función del cliente en la sesión en vivo.
- `src/app/(app)/page.tsx` (Inicio):
  - Si hay una sesión en curso, muestra el banner "Retomar entrenamiento" y oculta las opciones para empezar.
  - Si no, muestra las rutinas activas y "Sesión libre", que llaman a `startWorkout`.
  - Abajo, el resumen del último entrenamiento.
- `src/app/entrenar/` (pantalla completa, fuera de `(app)`):
  - `[workoutId]/`: sesión en vivo. El componente cliente es `components/workout/live-workout.tsx` y lleva su propio estado de filas.
  - `[workoutId]/resumen/`: resumen al terminar.
  - `actions.ts`: Server Actions de la sesión. Las de series no revalidan; empezar, terminar y descartar sí.
- `src/app/(app)/historial/`: lista de sesiones terminadas y `[id]/` con el detalle editable (`components/history/workout-editor.tsx`). Las Server Actions de `historial/actions.ts` revalidan.
- `src/lib/workout-sets.ts`: guardar, agregar y borrar series, compartido por la sesión en vivo y el historial.
- `src/lib/data/workouts.ts`: lecturas de sesiones. `loadLiveExercises()` arma cada ejercicio con su objetivo (de la rutina), la vez anterior (`get_last_sets`) y lo ya confirmado.
- `src/lib/calc/prefill.ts`: reglas de precarga (`buildInitialRows`, `suggestSet`, `plannedRowCount`).
- `src/lib/calc/volume.ts`: volumen.
- `src/lib/format.ts`: formato es-AR (coma decimal, fechas en hora de Córdoba) y `parseDecimal`/`toInputValue` para inputs.
- `src/lib/data/`: lecturas del servidor (`server-only`). Arrancan con `requireUser()` (`src/lib/auth.ts`) y devuelven tipos de dominio en camelCase.
- `src/lib/validation/schemas.ts`: esquemas Zod compartidos entre cliente y Server Actions.
- `src/lib/action-result.ts`: las Server Actions que se llaman desde eventos devuelven `ActionResult` (`{ ok, data } | { ok: false, error }`) y no tiran excepciones.
- `src/lib/calc/`: cálculos puros (1RM, volumen, récords, rutina sugerida), con tests `*.test.ts`.
- Componentes reutilizables:
  - `NumberStepper` (− / + grande con teclado numérico, enteros).
  - `ValueStepper` (− / + basado en texto, con coma decimal; para peso y reps).
  - `ElapsedTimer`.
  - `WorkoutStats`.
  - `SetEditDialog`.
  - `ErrorView` (usado por los `error.tsx`, que en esta versión de Next reciben `retry`).
  - `NativeSelect`.
  - `ConfirmDialog`.
  - `MoveButtons`.
  - `PageHeader` (con `backHref`).
  - `EmptyState`.
  - `ListSkeleton`.
- `supabase/migrations/`: un archivo por migración aplicada, `<version>_<nombre>.sql`, donde la versión es la que devuelve `list_migrations`. `supabase/seed.sql` es el catálogo global (44 ejercicios).

## Convenciones

- Código, tablas y variables en inglés; textos de la interfaz en español (Argentina, con voseo).
- Mobile-first, una mano: acciones principales con `<Button size="xl">` (h-12), teclado numérico (`inputMode="decimal"` / `"numeric"`).
- Siempre modo oscuro (`<html class="dark">`). No hay selector de tema.
- Fechas en `America/Argentina/Cordoba`, formato dd/mm/aaaa. Peso en kg con hasta 2 decimales, medidas en cm.
- Lecturas en Server Components; escrituras en Server Actions validadas con Zod.
- Cache Components:
  - Leer cookies (o sea, cualquier consulta a Supabase en el servidor), `params` o `usePathname()` solo dentro de un `<Suspense>`. Si no, el build falla.
  - Patrón de página: el `page.tsx` es síncrono (encabezado + `<Suspense>`) y le pasa la promesa de `params` a un componente async adentro del boundary.
  - No hacer `await` de datos de sesión en el nivel superior de un layout.
- Después de mutar, las Server Actions llaman a `revalidatePath("/", "layout")`. La app es de un solo usuario y tiene pocas rutas, así que se refresca todo.
- Reordenar: `moveItem()` (`src/lib/reorder.ts`) en el cliente (con `useOptimistic`) y en el servidor, que reescribe `position` como 0..n-1.
- Shadcn usa Base UI: para componer, usar la prop `render` en vez de `asChild`. Si `shadcn add` pide sobrescribir `button.tsx`, después hay que volver a agregar la variante `size="xl"`.
- Archivos con barras invertidas (regex, escapes): escribirlos con la herramienta de edición, no con heredocs de bash, porque bash se come las barras.

## Base de datos

- Todo cambio de schema se hace por el MCP de Supabase con `apply_migration`. El mismo SQL se guarda en `supabase/migrations/` y se muestra a Franco **antes** de aplicarlo.
- **Limitación del MCP:**
  - `apply_migration` y `execute_sql` rechazan solos ("declined") el SQL que contiene `DELETE`, aunque esté dentro del cuerpo de una función.
  - En ese caso Franco lo corre a mano en el SQL Editor de Supabase. Después se verifica con el MCP, se regeneran los tipos y se corre el advisor.
  - Esas migraciones no figuran en `list_migrations`; el archivo lo aclara en su encabezado (ej. `20261110150317_workout_functions.sql`).
- Funciones (todas `SECURITY INVOKER`, `search_path = ''`, solo `authenticated`):
  - `start_workout(routine_id)`: crea la sesión y copia los ejercicios de la rutina.
  - `finish_workout(id)`: saca los ejercicios sin series y renumera las series. Si no quedan series, borra la sesión y devuelve `'discarded'`.
  - `delete_workout_set(id)`: borra la serie y renumera las siguientes.
  - `get_last_sets(exercise_ids, exclude_workout_id)`: series de la última sesión terminada de cada ejercicio.
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

## Sesión en vivo (decisiones)

- **Filas por ejercicio:** `target_sets` de la rutina. Sin objetivo (sesión libre o ejercicio agregado en la sesión), las series de la vez anterior, o 1 si nunca se hizo.
- **Filas sin confirmar:** son solo estado del cliente. Al retomar, se rearman con lo confirmado más la precarga.
- **Número de serie:** cada fila guarda su serie con `set_number` = número de fila, así que se pueden confirmar salteadas. `finish_workout` las renumera 1..n.
- **Quitar serie:** quita la última fila. Si estaba confirmada, la borra después de pedir confirmación. Un ejercicio solo se puede quitar de la sesión si no tiene series confirmadas.
- **Peso corporal:** si el ejercicio es de peso corporal y no tiene historial, el peso arranca en 0.
- **Botones +/-:** peso de a 2,5 kg (`WEIGHT_STEP_KG`) y reps de a 1.

## Fuera de alcance (no implementar)

- Lo de la V2: sugerencias con IA, timer de descanso, modo offline, exportar datos.
- Multiusuario, nutrición y cardio, apps nativas, y campos por serie además de peso y reps.
