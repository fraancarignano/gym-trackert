-- Gym Tracker V1: schema inicial con RLS.

-- ─────────────────────────────────────────────────────────────
-- exercises: catálogo global (user_id null) + ejercicios propios
-- ─────────────────────────────────────────────────────────────
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  muscle_group text not null check (
    muscle_group in ('Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps',
                     'Piernas', 'Glúteos', 'Gemelos', 'Abdominales')
  ),
  equipment text not null check (
    equipment in ('Barra', 'Mancuernas', 'Polea', 'Máquina', 'Peso corporal')
  ),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sin nombres repetidos (sin distinguir mayúsculas) dentro del catálogo global
-- ni dentro de los ejercicios de cada usuario.
create unique index exercises_global_name_key
  on public.exercises (lower(name)) where user_id is null;
create unique index exercises_user_name_key
  on public.exercises (user_id, lower(name)) where user_id is not null;

-- ─────────────────────────────────────────────────────────────
-- routines
-- ─────────────────────────────────────────────────────────────
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  notes text,
  position integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create index routines_user_position_idx on public.routines (user_id, position);

-- ─────────────────────────────────────────────────────────────
-- routine_exercises: ejercicios de una rutina con su objetivo (ej. 4 × 8–10)
-- ─────────────────────────────────────────────────────────────
create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position integer not null default 0,
  target_sets integer not null check (target_sets between 1 and 20),
  target_reps_min integer not null check (target_reps_min between 1 and 100),
  target_reps_max integer not null check (target_reps_max between 1 and 100),
  created_at timestamptz not null default now(),
  constraint routine_exercises_reps_range check (target_reps_max >= target_reps_min),
  constraint routine_exercises_unique_exercise unique (routine_id, exercise_id)
);

create index routine_exercises_routine_position_idx
  on public.routine_exercises (routine_id, position);
create index routine_exercises_exercise_id_idx
  on public.routine_exercises (exercise_id);

-- ─────────────────────────────────────────────────────────────
-- workouts: sesiones. routine_id null = sesión libre; finished_at null = en curso
-- ─────────────────────────────────────────────────────────────
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id uuid references public.routines (id) on delete set null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  constraint workouts_finished_after_start check (finished_at is null or finished_at >= started_at)
);

-- Una sola sesión en curso por usuario.
create unique index workouts_one_in_progress_per_user
  on public.workouts (user_id) where finished_at is null;
create index workouts_user_started_at_idx
  on public.workouts (user_id, started_at desc);
create index workouts_routine_id_idx
  on public.workouts (routine_id);

-- ─────────────────────────────────────────────────────────────
-- workout_exercises: ejercicios hechos en una sesión
-- ─────────────────────────────────────────────────────────────
create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete restrict,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index workout_exercises_exercise_id_idx
  on public.workout_exercises (exercise_id);
create index workout_exercises_workout_position_idx
  on public.workout_exercises (workout_id, position);

-- ─────────────────────────────────────────────────────────────
-- workout_sets: solo series confirmadas
-- ─────────────────────────────────────────────────────────────
create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  set_number integer not null check (set_number > 0),
  weight_kg numeric(6, 2) not null check (weight_kg >= 0),
  reps integer not null check (reps > 0),
  created_at timestamptz not null default now(),
  -- Diferida para poder renumerar series dentro de una misma transacción.
  constraint workout_sets_unique_number unique (workout_exercise_id, set_number)
    deferrable initially deferred
);

-- ─────────────────────────────────────────────────────────────
-- body_metrics: peso corporal y medidas, un registro por fecha
-- ─────────────────────────────────────────────────────────────
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  measured_on date not null,
  weight_kg numeric(5, 2) check (weight_kg > 0),
  waist_cm numeric(5, 2) check (waist_cm > 0),
  chest_cm numeric(5, 2) check (chest_cm > 0),
  arm_cm numeric(5, 2) check (arm_cm > 0),
  thigh_cm numeric(5, 2) check (thigh_cm > 0),
  hip_cm numeric(5, 2) check (hip_cm > 0),
  created_at timestamptz not null default now(),
  constraint body_metrics_one_per_day unique (user_id, measured_on),
  constraint body_metrics_has_value check (
    num_nonnulls(weight_kg, waist_cm, chest_cm, arm_cm, thigh_cm, hip_cm) > 0
  )
);

-- ─────────────────────────────────────────────────────────────
-- Permisos: solo usuarios autenticados; anon no accede a nada.
-- ─────────────────────────────────────────────────────────────
revoke all on public.exercises, public.routines, public.routine_exercises,
  public.workouts, public.workout_exercises, public.workout_sets,
  public.body_metrics from anon;

grant select, insert, update, delete on public.exercises, public.routines,
  public.routine_exercises, public.workouts, public.workout_exercises,
  public.workout_sets, public.body_metrics to authenticated;

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────
alter table public.exercises enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_metrics enable row level security;

-- exercises: se ve el catálogo global y los propios; solo se modifican los propios.
create policy "exercises_select_global_or_own" on public.exercises
  for select to authenticated
  using (user_id is null or user_id = (select auth.uid()));

create policy "exercises_insert_own" on public.exercises
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "exercises_update_own" on public.exercises
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "exercises_delete_own" on public.exercises
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- Tablas raíz con user_id: todo solo sobre filas propias.
create policy "routines_all_own" on public.routines
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "workouts_all_own" on public.workouts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "body_metrics_all_own" on public.body_metrics
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- routine_exercises: propiedad a través de la rutina; el ejercicio debe ser visible.
create policy "routine_exercises_all_own" on public.routine_exercises
  for all to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_exercises.routine_id
        and r.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.exercises e
      where e.id = routine_exercises.exercise_id
        and (e.user_id is null or e.user_id = (select auth.uid()))
    )
  );

-- workout_exercises: propiedad a través del workout; el ejercicio debe ser visible.
create policy "workout_exercises_all_own" on public.workout_exercises
  for all to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_exercises.workout_id
        and w.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.exercises e
      where e.id = workout_exercises.exercise_id
        and (e.user_id is null or e.user_id = (select auth.uid()))
    )
  );

-- workout_sets: propiedad a través de workout_exercises → workouts.
create policy "workout_sets_all_own" on public.workout_sets
  for all to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where we.id = workout_sets.workout_exercise_id
        and w.user_id = (select auth.uid())
    )
  );
