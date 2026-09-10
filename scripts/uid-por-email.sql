-- scripts/uid-por-email.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Helper para las edge functions: resuelve el id de auth.users por correo.
--
-- MOTIVO: activar-pago / stripe-webhook / preinscribir resolvían un auth.user
-- "huérfano" (de un intento previo) con supabase.auth.admin.listUsers(), que está
-- PAGINADO (50 por página) y solo miraba la primera página. Con >50 usuarios en
-- producción, el .find() fallaba → un usuario que PAGÓ podía quedar sin cuenta.
-- Esta RPC hace la búsqueda directa por email, sin paginación.
--
-- Seguridad: SECURITY DEFINER (lee auth.users, fuera del alcance de PostgREST).
-- Se REVOCA de public/anon/authenticated y solo se concede a service_role, que
-- es el rol con el que las edge functions llaman (service-role key). Así no queda
-- expuesta como endpoint público (evita enumeración de correos → uid).
--
-- Idempotente. Correr en Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.uid_por_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.uid_por_email(text) from public, anon, authenticated;
grant execute on function public.uid_por_email(text) to service_role;
