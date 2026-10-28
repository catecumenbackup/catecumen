-- ════════════════════════════════════════════════════════════════════════════
--  Plazo máximo para concluir la formación + prórrogas (Enyoria, oct-2026).
--
--  Plazo según número de sacramentos elegidos (configurable en `ajustes`):
--    1 sacramento → 3 meses · 2 → 4 meses · 3 (o más) → 6 meses.
--  El bloque común (Kerygma + Tronco + Confesión + Unción) se cursa una sola vez.
--  El conteo arranca en el PRIMER ACCESO al curso (iniciar_formacion). Al vencer,
--  el acceso se bloquea; el alumno puede SOLICITAR una prórroga que el admin
--  aprueba con un número de días (por defecto 30). Todo queda en auditoría.
--
--  Correr en el SQL Editor de Supabase. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.usuarios add column if not exists formacion_inicio timestamptz;
alter table public.usuarios add column if not exists formacion_limite timestamptz;

insert into public.ajustes (clave, valor)
  values ('plazo_formacion', '{"1":3,"2":4,"3":6}'::jsonb)
on conflict (clave) do nothing;
insert into public.ajustes (clave, valor)
  values ('prorroga_dias', '{"n":30}'::jsonb)
on conflict (clave) do nothing;

create table if not exists public.solicitudes_prorroga (
  id           bigserial primary key,
  usuario_id   uuid not null,
  motivo       text,
  estado       text not null default 'pendiente',  -- pendiente|aprobada|rechazada
  creado       timestamptz not null default now(),
  resuelto     timestamptz,
  resuelto_por uuid,
  dias_concedidos int
);
create unique index if not exists solicitudes_prorroga_pend
  on public.solicitudes_prorroga (usuario_id) where estado = 'pendiente';
create index if not exists solicitudes_prorroga_estado on public.solicitudes_prorroga (estado, creado desc);
alter table public.solicitudes_prorroga enable row level security;

-- ── Nº de sacramentos elegidos (soporta array u objeto) ─────────────────────
create or replace function public._num_sacramentos(p jsonb)
returns int language sql immutable set search_path = public as $$
  select case jsonb_typeof(p)
    when 'array'  then jsonb_array_length(p)
    when 'object' then (select count(*)::int from jsonb_object_keys(p))
    else 0 end;
$$;

-- ── Iniciar el plazo en el primer acceso (idempotente) ──────────────────────
create or replace function public.iniciar_formacion()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u record; n int; m int; lim timestamptz;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;
  select formacion_inicio, formacion_limite, sacramentos_elegidos into u from usuarios where id = uid;
  if u.formacion_inicio is not null then
    return jsonb_build_object('ok', true, 'inicio', u.formacion_inicio, 'limite', u.formacion_limite);
  end if;
  n := greatest(1, least(3, _num_sacramentos(u.sacramentos_elegidos)));
  m := coalesce((select (valor->>n::text)::int from ajustes where clave = 'plazo_formacion'),
                case n when 1 then 3 when 2 then 4 else 6 end);
  lim := now() + make_interval(months => m);
  update usuarios set formacion_inicio = now(), formacion_limite = lim where id = uid and formacion_inicio is null;
  return jsonb_build_object('ok', true, 'inicio', now(), 'limite', lim, 'meses', m, 'sacramentos', n);
end $$;
grant execute on function public.iniciar_formacion() to authenticated;

-- ── Estado del plazo del alumno ─────────────────────────────────────────────
create or replace function public.mi_formacion()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u record; v_pend boolean;
begin
  if uid is null then return jsonb_build_object('sin_sesion', true); end if;
  select formacion_inicio, formacion_limite into u from usuarios where id = uid;
  select exists(select 1 from solicitudes_prorroga where usuario_id = uid and estado = 'pendiente') into v_pend;
  return jsonb_build_object(
    'inicio', u.formacion_inicio,
    'limite', u.formacion_limite,
    'vencido', u.formacion_limite is not null and now() > u.formacion_limite,
    'dias_restantes', case when u.formacion_limite is not null
                           then ceil(extract(epoch from (u.formacion_limite - now()))/86400.0)::int else null end,
    'solicitud_pendiente', coalesce(v_pend, false)
  );
end $$;
grant execute on function public.mi_formacion() to authenticated;

-- ── Solicitar prórroga ──────────────────────────────────────────────────────
create or replace function public.solicitar_prorroga(p_motivo text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_id bigint; v_email text; v_nombre text;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;
  insert into solicitudes_prorroga (usuario_id, motivo)
    values (uid, left(p_motivo, 500))
  on conflict (usuario_id) where estado = 'pendiente' do nothing
  returning id into v_id;
  if v_id is not null then
    select email, trim(coalesce(nombre,'')||' '||coalesce(apellido,'')) into v_email, v_nombre from usuarios where id = uid;
    begin
      insert into notificaciones_admin (tipo, titulo, detalle, ref_id)
        values ('prorroga', 'Solicitud de prórroga de plazo',
                jsonb_build_object('email', v_email, 'nombre', v_nombre, 'motivo', left(p_motivo,500)), v_id::text);
    exception when others then null; end;
  end if;
  return jsonb_build_object('ok', true, 'estado', 'pendiente');
end $$;
grant execute on function public.solicitar_prorroga(text) to authenticated;

-- ── ADMIN: listar solicitudes de prórroga ───────────────────────────────────
create or replace function public.admin_prorrogas_listar(p_estado text default 'pendiente')
returns table (id bigint, usuario_id uuid, email text, nombre text, motivo text,
               limite timestamptz, estado text, creado timestamptz, resuelto timestamptz, dias_concedidos int)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select s.id, s.usuario_id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           s.motivo, u.formacion_limite, s.estado, s.creado, s.resuelto, s.dias_concedidos
      from solicitudes_prorroga s left join usuarios u on u.id = s.usuario_id
     where (p_estado is null or p_estado = 'todas' or s.estado = p_estado)
     order by s.creado desc;
end $$;

-- ── ADMIN: aprobar (extender N días) o rechazar ─────────────────────────────
create or replace function public.admin_resolver_prorroga(p_id bigint, p_aprobar boolean, p_dias int default null)
returns void
language plpgsql security definer set search_path = public as $$
declare s record; v_dias int; v_base timestamptz;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select * into s from solicitudes_prorroga where id = p_id;
  if s is null then raise exception 'solicitud no encontrada'; end if;
  if s.estado <> 'pendiente' then raise exception 'la solicitud ya fue resuelta'; end if;

  if p_aprobar then
    v_dias := coalesce(p_dias, (select (valor->>'n')::int from ajustes where clave = 'prorroga_dias'), 30);
    -- Si ya venció, extiende desde hoy; si no, desde el límite vigente.
    select greatest(coalesce(formacion_limite, now()), now()) into v_base from usuarios where id = s.usuario_id;
    update usuarios set formacion_limite = v_base + make_interval(days => v_dias) where id = s.usuario_id;
    update solicitudes_prorroga set estado='aprobada', resuelto=now(), resuelto_por=auth.uid(), dias_concedidos=v_dias where id=p_id;
  else
    update solicitudes_prorroga set estado='rechazada', resuelto=now(), resuelto_por=auth.uid() where id=p_id;
  end if;

  begin
    insert into admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              'resolver_prorroga', 'solicitud_prorroga', p_id::text,
              jsonb_build_object('aprobada', p_aprobar, 'dias', v_dias, 'usuario_id', s.usuario_id));
  exception when others then null; end;
end $$;

-- ── ADMIN: fijar/ajustar manualmente el límite de un alumno ─────────────────
create or replace function public.admin_fijar_limite(p_usuario_id uuid, p_limite timestamptz)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  update usuarios set formacion_limite = p_limite,
         formacion_inicio = coalesce(formacion_inicio, now()) where id = p_usuario_id;
  begin
    insert into admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              'fijar_limite_formacion', 'usuario', p_usuario_id::text, jsonb_build_object('limite', p_limite));
  exception when others then null; end;
end $$;

-- ── ADMIN: contador de prórrogas pendientes (badge) ─────────────────────────
create or replace function public.admin_prorrogas_pendientes()
returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return (select count(*) from solicitudes_prorroga where estado = 'pendiente');
end $$;
