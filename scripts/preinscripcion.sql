-- scripts/preinscripcion.sql
-- Sistema de PREINSCRIPCIÓN (Fase 1: captura + control del admin + espera).
-- El alumno se preinscribe SIN pago; queda con estado 'preinscrito' y ve una
-- pantalla de espera. Cuando el admin "abre la plataforma", los preinscritos
-- completan el pago para activarse (Fase 2 — conversión, ver produccion.md).
--
-- Requiere: public.es_admin(), public.admin_log, public.usuarios.
-- Idempotente y re-ejecutable.

-- ── Ajustes globales (clave/valor) ──────────────────────────────────────────
create table if not exists public.ajustes (
  clave      text primary key,
  valor      jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
-- Fila del modo preinscripción (arranca APAGADO: nada cambia hasta activarlo).
insert into public.ajustes(clave, valor)
values ('preinscripcion', jsonb_build_object('activa', false))
on conflict (clave) do nothing;

-- Lectura pública de un ajuste (el frontend la lee al arrancar).
create or replace function public.obtener_ajuste(p_clave text)
returns jsonb language sql security definer set search_path = public stable as $$
  select valor from public.ajustes where clave = p_clave;
$$;
grant execute on function public.obtener_ajuste(text) to anon, authenticated;

-- Guardar un ajuste (solo admin).
create or replace function public.admin_guardar_ajuste(p_clave text, p_valor jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text;
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  select a.email into v_email from public.admins a where a.user_id = auth.uid();
  insert into public.ajustes(clave, valor, updated_at)
  values (p_clave, p_valor, now())
  on conflict (clave) do update set valor = excluded.valor, updated_at = now();
  -- admin_log.detalle es jsonb → guardamos el valor del ajuste tal cual.
  insert into public.admin_log(admin_id, admin_email, accion, entidad, entidad_id, detalle)
  values (auth.uid(), v_email, 'ajuste_guardar', 'ajustes', p_clave, p_valor);
end; $$;
grant execute on function public.admin_guardar_ajuste(text, jsonb) to authenticated;

-- ── Estado de inscripción del usuario ───────────────────────────────────────
-- Los usuarios existentes quedan como 'activo' (no se ven afectados).
-- Los nuevos preinscritos entran como 'preinscrito'.
alter table public.usuarios add column if not exists estado_inscripcion text not null default 'activo';
-- Precio previsto guardado al preinscribirse (lo usa la conversión de Fase 2).
-- Se añade aquí para que el INSERT de la preinscripción no falle antes de Fase 2.
alter table public.usuarios add column if not exists importe_previsto jsonb;
-- Defensivo: marca de tiempo de alta (para ordenar la lista de preinscritos).
alter table public.usuarios add column if not exists created_at timestamptz default now();

-- ── Listado de preinscritos (solo admin) ────────────────────────────────────
create or replace function public.admin_preinscritos_listar(p_q text default null)
returns table(
  id uuid, nombre text, apellido text, email text, tipo_usuario text,
  pais_residencia text, sacramentos_elegidos jsonb, registro_id text,
  codigo_pais_tel text, telefono text, creado timestamptz
)
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  return query
  -- Casts explícitos: la columna real puede ser varchar y RETURNS TABLE exige
  -- que el tipo coincida EXACTAMENTE (si no: "structure of query does not match").
  select u.id::uuid, u.nombre::text, u.apellido::text, u.email::text, u.tipo_usuario::text,
         u.pais_residencia::text, to_jsonb(u.sacramentos_elegidos) as sacramentos_elegidos, u.registro_id::text,
         u.codigo_pais_tel::text, u.telefono::text, u.created_at::timestamptz
    from public.usuarios u
   where coalesce(u.estado_inscripcion, 'activo') = 'preinscrito'
     and coalesce(u.suspendido, false) = false
     and coalesce(u.eliminado, false)  = false
     and (p_q is null or p_q = '' or
          concat_ws(' ', u.nombre, u.apellido, u.email, u.pais_residencia, u.registro_id)
            ilike '%'||p_q||'%')
   order by u.created_at desc nulls last, u.nombre;
end; $$;
grant execute on function public.admin_preinscritos_listar(text) to authenticated;
