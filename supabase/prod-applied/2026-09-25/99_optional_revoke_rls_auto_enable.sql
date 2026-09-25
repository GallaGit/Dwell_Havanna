-- OPCIONAL, fuera del SQL canónico. NO forma parte del plan obligatorio.
-- Advisor de prod (WARN 0028/0029): public.rls_auto_enable() es SECURITY DEFINER y
-- ejecutable por anon/authenticated vía /rest/v1/rpc/rls_auto_enable.
-- Es la función del event trigger `ensure_rls` que Supabase crea por defecto;
-- al devolver event_trigger no puede ejecutarse fuera de un trigger, así que el riesgo
-- práctico es nulo, pero esto limpia el aviso sin tocar el event trigger:
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
