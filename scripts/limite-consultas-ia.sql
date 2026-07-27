-- scripts/limite-consultas-ia.sql
-- Límite de consultas a Magisterium AI por alumno: 10 cada 7 días (ventana móvil).
-- A prueba de manipulación: la tabla no tiene políticas RLS (nadie la toca
-- directamente); solo estas funciones SECURITY DEFINER acceden, y siempre por
-- auth.uid(), así el usuario solo puede afectar su propio conteo.
-- Idempotente y re-ejecutable.

-- ── Tabla de bitácora (una fila por consulta exitosa) ───────────────────────
create table if not exists public.consultas_ia (
  id          bigint generated always as identity primary key,
  usuario_id  uuid        not null,
  created_at  timestamptz not null default now()
);
create index if not exists idx_consultas_ia_user_time
  on public.consultas_ia (usuario_id, created_at desc);

alter table public.consultas_ia enable row level security;
-- Sin políticas a propósito: el acceso es solo vía las funciones de abajo.

-- ── ¿Cuántas ha usado el alumno en la ventana? (solo lectura) ───────────────
create or replace function public.consultas_ia_disponibles(
  p_limite int default 10,
  p_dias   int default 7
) returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  n   int;
begin
  if uid is null then
    return json_build_object('usadas', p_limite, 'limite', p_limite);
  end if;
  select count(*) into n
    from public.consultas_ia
   where usuario_id = uid
     and created_at > now() - make_interval(days => p_dias);
  return json_build_object('usadas', n, 'limite', p_limite);
end;
$$;

-- ── Registrar una consulta consumida (se llama SOLO tras respuesta exitosa) ──
create or replace function public.registrar_consulta_ia()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.consultas_ia (usuario_id) values (uid);
end;
$$;

grant execute on function public.consultas_ia_disponibles(int, int) to authenticated;
grant execute on function public.registrar_consulta_ia() to authenticated;
