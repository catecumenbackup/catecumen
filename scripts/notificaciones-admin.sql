-- scripts/notificaciones-admin.sql
-- Avisos para el administrador dentro del panel: nuevos registros/preinscripciones,
-- solicitudes de soporte y consultas al catequista. Campana con no-leídos + lista.
-- Requiere: public.es_admin(). Idempotente.

create table if not exists public.notificaciones_admin (
  id      uuid primary key default gen_random_uuid(),
  tipo    text not null,          -- 'registro' | 'preinscripcion' | 'soporte' | 'consulta'
  titulo  text not null,
  detalle jsonb,
  ref_id  text,
  leida   boolean not null default false,
  creado  timestamptz default now()
);
create index if not exists idx_notif_admin_no_leidas
  on public.notificaciones_admin (creado desc) where leida = false;

-- RLS: sin política de SELECT (solo se leen por las RPCs SECURITY DEFINER del admin).
-- INSERT abierto: soporte/consulta se generan sin sesión de admin; los registros los
-- insertan las edge functions con service-role (que ignora RLS).
alter table public.notificaciones_admin enable row level security;
drop policy if exists notif_admin_insert on public.notificaciones_admin;
create policy notif_admin_insert on public.notificaciones_admin
  for insert to anon, authenticated with check (true);
grant insert on public.notificaciones_admin to anon, authenticated;

-- ── Admin: contador de no leídas (para el badge) ────────────────────────────
create or replace function public.admin_notificaciones_no_leidas()
returns integer language sql security definer set search_path = public stable as $$
  select case when public.es_admin()
              then (select count(*)::int from public.notificaciones_admin where leida = false)
              else 0 end;
$$;
grant execute on function public.admin_notificaciones_no_leidas() to authenticated;

-- ── Admin: listar (últimas 100) ─────────────────────────────────────────────
create or replace function public.admin_notificaciones_listar(p_solo_no_leidas boolean default false)
returns setof public.notificaciones_admin
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  return query
  select * from public.notificaciones_admin
   where (not p_solo_no_leidas or leida = false)
   order by creado desc
   limit 100;
end; $$;
grant execute on function public.admin_notificaciones_listar(boolean) to authenticated;

-- ── Admin: marcar una / todas como leídas ───────────────────────────────────
create or replace function public.admin_notificacion_leida(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  update public.notificaciones_admin set leida = true where id = p_id;
end; $$;
grant execute on function public.admin_notificacion_leida(uuid) to authenticated;

create or replace function public.admin_notificaciones_leer_todas()
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  update public.notificaciones_admin set leida = true where leida = false;
end; $$;
grant execute on function public.admin_notificaciones_leer_todas() to authenticated;
