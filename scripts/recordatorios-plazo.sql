-- recordatorios-plazo.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Recordatorios automáticos de vencimiento del plazo de formación.
-- Un cron diario (pg_cron) llama a la edge function `recordar-plazo`, que pide
-- a `plazo_recordatorios_pendientes()` la lista de alumnos que acaban de entrar
-- en una franja de aviso (30/15/7/1 días para vencer) y a los que aún NO se les
-- ha enviado ese aviso; envía el correo (Resend) y marca el hito como enviado.
--
-- Depende de scripts/plazo-formacion.sql (usuarios.formacion_limite).
-- Correr en el SQL Editor de Supabase. Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.recordatorios_plazo (
  usuario_id uuid not null,
  hito       int  not null,                 -- 30 | 15 | 7 | 1 (días para vencer)
  enviado    timestamptz not null default now(),
  primary key (usuario_id, hito)
);
alter table public.recordatorios_plazo enable row level security;
-- Sin políticas: solo service-role (la edge function) escribe/lee.

-- ── Alumnos con un aviso de plazo pendiente de enviar ───────────────────────
-- Devuelve, por alumno, el hito (franja) MÁS urgente en que se encuentra hoy y
-- que todavía no se le ha notificado. Uno por alumno y ejecución.
create or replace function public.plazo_recordatorios_pendientes()
returns table(usuario_id uuid, email text, nombre text, idioma text,
              limite timestamptz, dias_restantes int, hito int)
language sql security definer set search_path = public as $$
  with bands(h) as (values (30),(15),(7),(1))
  select q.id, q.email, q.nombre, q.idioma, q.limite, q.d, q.hito
  from (
    select u.id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           u.idioma, u.formacion_limite as limite,
           ceil(extract(epoch from (u.formacion_limite - now()))/86400.0)::int as d,
           (select min(h) from bands
              where h >= ceil(extract(epoch from (u.formacion_limite - now()))/86400.0)::int) as hito
    from public.usuarios u
    where u.formacion_limite is not null
      and now() < u.formacion_limite
      and coalesce(u.estado_inscripcion,'activo') = 'activo'
      and coalesce(u.suspendido,false) = false
      and coalesce(u.eliminado,false)  = false
      and u.email is not null
  ) q
  where q.hito is not null
    and q.d <= 30
    and not exists (
      select 1 from public.recordatorios_plazo r
      where r.usuario_id = q.id and r.hito = q.hito);
$$;

-- ── Marcar un hito como ya notificado (idempotente) ─────────────────────────
create or replace function public.plazo_recordatorio_marcar(p_usuario uuid, p_hito int)
returns void
language sql security definer set search_path = public as $$
  insert into public.recordatorios_plazo (usuario_id, hito)
  values (p_usuario, p_hito)
  on conflict (usuario_id, hito) do nothing;
$$;

-- Solo el service-role (la edge function) debe usarlas: exponen correos.
revoke execute on function public.plazo_recordatorios_pendientes()       from public, anon, authenticated;
revoke execute on function public.plazo_recordatorio_marcar(uuid,int)    from public, anon, authenticated;
grant  execute on function public.plazo_recordatorios_pendientes()       to service_role;
grant  execute on function public.plazo_recordatorio_marcar(uuid,int)    to service_role;
