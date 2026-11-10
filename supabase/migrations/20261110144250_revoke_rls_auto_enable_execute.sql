-- rls_auto_enable() es la función de Supabase que usa el event trigger
-- `ensure_rls` para activar RLS en cada tabla nueva de public.
-- Es SECURITY DEFINER y estaba expuesta por /rest/v1/rpc a anon y authenticated.
-- El event trigger sigue funcionando: no necesita que esos roles puedan ejecutarla.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
