-- Aplicada a mano desde el SQL Editor de Supabase (el MCP rechaza sentencias con DELETE);
-- no figura en supabase_migrations.schema_migrations.

-- Fase 2: funciones para la sesión en vivo y el historial.
-- Todas son SECURITY INVOKER: corren con los permisos del usuario y respetan RLS.

-- ─────────────────────────────────────────────────────────────
-- start_workout: crea la sesión y copia los ejercicios de la rutina, todo junto.
-- p_routine_id null = sesión libre. Si ya hay una sesión en curso, el índice
-- único parcial hace fallar el insert (23505).
-- ─────────────────────────────────────────────────────────────
create or replace function public.start_workout(p_routine_id uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_workout_id uuid;
begin
  if p_routine_id is not null and not exists (
    select 1 from public.routines r
    where r.id = p_routine_id and not r.is_archived
  ) then
    raise exception 'routine not found' using errcode = 'P0002';
  end if;

  insert into public.workouts (routine_id)
  values (p_routine_id)
  returning id into v_workout_id;

  if p_routine_id is not null then
    insert into public.workout_exercises (workout_id, exercise_id, position)
    select v_workout_id,
           re.exercise_id,
           (row_number() over (order by re.position, re.created_at) - 1)::int
    from public.routine_exercises re
    where re.routine_id = p_routine_id;
  end if;

  return v_workout_id;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- finish_workout: cierra una sesión en curso.
-- - Saca los ejercicios sin series confirmadas.
-- - Si no queda ninguna serie, borra la sesión y devuelve 'discarded'.
-- - Renumera las series 1..n por ejercicio (en vivo se pueden confirmar salteadas).
-- - Guarda finished_at y devuelve 'finished'.
-- ─────────────────────────────────────────────────────────────
create or replace function public.finish_workout(p_workout_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_finished_at timestamptz;
begin
  select w.finished_at into v_finished_at
  from public.workouts w
  where w.id = p_workout_id
  for update;

  if not found then
    raise exception 'workout not found' using errcode = 'P0002';
  end if;
  if v_finished_at is not null then
    return 'finished';
  end if;

  delete from public.workout_exercises we
  where we.workout_id = p_workout_id
    and not exists (
      select 1 from public.workout_sets s where s.workout_exercise_id = we.id
    );

  if not exists (
    select 1 from public.workout_exercises we where we.workout_id = p_workout_id
  ) then
    delete from public.workouts w where w.id = p_workout_id;
    return 'discarded';
  end if;

  update public.workout_sets s
  set set_number = r.rn
  from (
    select s2.id,
           (row_number() over (
             partition by s2.workout_exercise_id order by s2.set_number
           ))::int as rn
    from public.workout_sets s2
    join public.workout_exercises we on we.id = s2.workout_exercise_id
    where we.workout_id = p_workout_id
  ) r
  where s.id = r.id and s.set_number <> r.rn;

  update public.workouts w
  set finished_at = greatest(now(), w.started_at)
  where w.id = p_workout_id;

  return 'finished';
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- delete_workout_set: borra una serie y corre las siguientes un número para
-- abajo, para que queden 1..n sin huecos.
-- ─────────────────────────────────────────────────────────────
create or replace function public.delete_workout_set(p_set_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_workout_exercise_id uuid;
  v_set_number int;
begin
  delete from public.workout_sets s
  where s.id = p_set_id
  returning s.workout_exercise_id, s.set_number
  into v_workout_exercise_id, v_set_number;

  if not found then
    raise exception 'set not found' using errcode = 'P0002';
  end if;

  update public.workout_sets s
  set set_number = s.set_number - 1
  where s.workout_exercise_id = v_workout_exercise_id
    and s.set_number > v_set_number;
end;
$$;

-- ─────────────────────────────────────────────────────────────
-- get_last_sets: para cada ejercicio, las series de la última sesión TERMINADA
-- que lo incluye con al menos una serie (de cualquier rutina). Es la base de la
-- precarga y de la referencia "Anterior: 60 kg × 8".
-- p_exclude_workout_id: la sesión actual, para no compararla consigo misma.
-- ─────────────────────────────────────────────────────────────
create or replace function public.get_last_sets(
  p_exercise_ids uuid[],
  p_exclude_workout_id uuid default null
)
returns table (
  exercise_id uuid,
  workout_id uuid,
  started_at timestamptz,
  set_number int,
  weight_kg numeric,
  reps int
)
language sql
stable
security invoker
set search_path = ''
as $$
  with last_exercise as (
    select distinct on (we.exercise_id)
           we.id,
           we.exercise_id,
           w.id as workout_id,
           w.started_at
    from public.workout_exercises we
    join public.workouts w on w.id = we.workout_id
    where we.exercise_id = any (p_exercise_ids)
      and w.finished_at is not null
      and (p_exclude_workout_id is null or w.id <> p_exclude_workout_id)
      and exists (
        select 1 from public.workout_sets s where s.workout_exercise_id = we.id
      )
    order by we.exercise_id, w.started_at desc
  )
  select le.exercise_id, le.workout_id, le.started_at, s.set_number, s.weight_kg, s.reps
  from last_exercise le
  join public.workout_sets s on s.workout_exercise_id = le.id
  order by le.exercise_id, s.set_number;
$$;

-- ─────────────────────────────────────────────────────────────
-- Permisos: solo usuarios autenticados.
-- ─────────────────────────────────────────────────────────────
revoke execute on function public.start_workout(uuid) from public, anon;
revoke execute on function public.finish_workout(uuid) from public, anon;
revoke execute on function public.delete_workout_set(uuid) from public, anon;
revoke execute on function public.get_last_sets(uuid[], uuid) from public, anon;

grant execute on function public.start_workout(uuid) to authenticated;
grant execute on function public.finish_workout(uuid) to authenticated;
grant execute on function public.delete_workout_set(uuid) to authenticated;
grant execute on function public.get_last_sets(uuid[], uuid) to authenticated;
