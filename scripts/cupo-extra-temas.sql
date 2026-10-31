-- cupo-extra-temas.sql — Solicitud de CUPO EXTRA de temas por día, CON APROBACIÓN
-- del admin (patrón de la reapertura de 72 h). Correr DESPUÉS de limite-temas-dia.sql.
-- El alumno pide cupo extra para HOY; el admin aprueba (N temas extra) o rechaza;
-- `puedo_abrir_tema` suma el extra aprobado del día al límite base. Idempotente.

create table if not exists public.solicitudes_cupo (
  id          bigserial primary key,
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  fecha       date not null,
  extra       int  not null default 1,
  estado      text not null default 'pendiente',   -- pendiente | aprobada | rechazada
  creado      timestamptz not null default now(),
  resuelto    timestamptz,
  resuelto_por uuid
);
create unique index if not exists solicitudes_cupo_pend
  on public.solicitudes_cupo (usuario_id, fecha) where estado = 'pendiente';
create index if not exists solicitudes_cupo_estado
  on public.solicitudes_cupo (estado, creado desc);
alter table public.solicitudes_cupo enable row level security;  -- solo por RPC

-- ── Alumno: solicitar cupo extra para HOY ───────────────────────────────────
create or replace function public.solicitar_cupo_extra()
returns jsonb language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_tz text; v_today date;
        v_id bigint; v_estado text; v_email text; v_nombre text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'motivo', 'sin_sesion'); end if;
  v_tz := coalesce((select (valor->>'tz') from ajustes where clave = 'temas_limite_dia'), 'America/Mexico_City');
  v_today := (now() at time zone v_tz)::date;

  select id, estado into v_id, v_estado
    from solicitudes_cupo where usuario_id = uid and fecha = v_today
    order by creado desc limit 1;
  if v_estado = 'aprobada'  then return jsonb_build_object('ok', true, 'estado', 'aprobada'); end if;
  if v_estado = 'pendiente' then return jsonb_build_object('ok', true, 'estado', 'pendiente'); end if;

  insert into solicitudes_cupo (usuario_id, fecha) values (uid, v_today) returning id into v_id;
  begin
    select email, trim(coalesce(nombre,'') || ' ' || coalesce(apellido,'')) into v_email, v_nombre
      from usuarios where id = uid;
    insert into notificaciones_admin (tipo, titulo, detalle, ref_id)
      values ('cupo_extra', 'Solicitud de cupo diario',
              jsonb_build_object('usuario_id', uid, 'email', v_email, 'nombre', v_nombre, 'fecha', v_today),
              v_id::text);
  exception when others then null; end;
  return jsonb_build_object('ok', true, 'estado', 'pendiente', 'id', v_id);
end $$;
grant execute on function public.solicitar_cupo_extra() to authenticated;

-- ── Admin: listar solicitudes de cupo ───────────────────────────────────────
create or replace function public.admin_cupos_listar(p_estado text default 'pendiente')
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(t) order by t.creado desc), '[]'::jsonb) from (
    select s.id, s.usuario_id, s.fecha, s.extra, s.estado, s.creado, s.resuelto,
           u.email, trim(coalesce(u.nombre,'') || ' ' || coalesce(u.apellido,'')) as nombre
      from solicitudes_cupo s left join usuarios u on u.id = s.usuario_id
     where (p_estado is null or p_estado = '' or s.estado = p_estado)
  ) t);
end $$;
grant execute on function public.admin_cupos_listar(text) to authenticated;

-- ── Admin: resolver (aprobar con N temas extra, o rechazar) ──────────────────
create or replace function public.admin_resolver_cupo(p_id bigint, p_aprobar boolean, p_extra int default 1)
returns void language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select * into s from solicitudes_cupo where id = p_id;
  if s is null then raise exception 'solicitud no encontrada'; end if;
  if p_aprobar then
    update solicitudes_cupo set estado='aprobada', extra=greatest(1, coalesce(p_extra,1)),
           resuelto=now(), resuelto_por=auth.uid() where id = p_id;
  else
    update solicitudes_cupo set estado='rechazada', resuelto=now(), resuelto_por=auth.uid() where id = p_id;
  end if;
  begin
    insert into admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              case when p_aprobar then 'cupo.aprobado' else 'cupo.rechazado' end,
              'solicitudes_cupo', p_id::text,
              jsonb_build_object('usuario_id', s.usuario_id, 'fecha', s.fecha, 'extra', p_extra));
  exception when others then null; end;
end $$;
grant execute on function public.admin_resolver_cupo(bigint, boolean, int) to authenticated;

-- ── puedo_abrir_tema (versión final): límite base + extra APROBADO de hoy ─────
create or replace function public.puedo_abrir_tema(p_video_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_sac uuid; v_orden int; v_idioma text;
  v_lim int; v_tz text; v_today date; v_extra int;
  g_start int; g_first timestamptz; v_hoy int; v_this_today boolean; v_pend boolean;
begin
  if uid is null then return jsonb_build_object('permitido', true, 'sin_sesion', true); end if;
  select sacramento_id, orden, idioma into v_sac, v_orden, v_idioma from videos where id = p_video_id;
  if v_sac is null then return jsonb_build_object('permitido', true); end if;

  v_lim := coalesce((select (valor->>'n')::int from ajustes where clave = 'temas_limite_dia'), 2);
  v_tz  := coalesce((select (valor->>'tz')     from ajustes where clave = 'temas_limite_dia'), 'America/Mexico_City');
  v_today := (now() at time zone v_tz)::date;
  -- Cupo extra APROBADO para hoy (suma).
  v_extra := coalesce((select sum(extra) from solicitudes_cupo
                        where usuario_id = uid and fecha = v_today and estado = 'aprobada'), 0);
  v_lim := v_lim + v_extra;
  g_start := ((v_orden - 1) / 4) * 4 + 1;

  select min(a.primer_acceso) into g_first
    from accesos_video a join videos vv on vv.id = a.video_id
   where a.usuario_id = uid and vv.sacramento_id = v_sac and vv.idioma = v_idioma
     and vv.orden between g_start and g_start + 3;

  if g_first is not null and (g_first at time zone v_tz)::date < v_today then
    return jsonb_build_object('permitido', true, 'continuacion', true, 'limite', v_lim);
  end if;
  v_this_today := g_first is not null and (g_first at time zone v_tz)::date = v_today;

  select count(*) into v_hoy from (
    select vv.sacramento_id, ((vv.orden - 1) / 4) as grupo
      from accesos_video a join videos vv on vv.id = a.video_id
     where a.usuario_id = uid
     group by vv.sacramento_id, ((vv.orden - 1) / 4)
    having (min(a.primer_acceso) at time zone v_tz)::date = v_today
  ) t;

  -- ¿tiene una solicitud de cupo PENDIENTE hoy? (para informar al frontend)
  select exists(select 1 from solicitudes_cupo
                 where usuario_id = uid and fecha = v_today and estado = 'pendiente') into v_pend;

  if v_this_today then
    return jsonb_build_object('permitido', true, 'temas_hoy', v_hoy, 'limite', v_lim);
  elsif v_hoy < v_lim then
    return jsonb_build_object('permitido', true, 'temas_hoy', v_hoy, 'limite', v_lim, 'nuevo', true);
  else
    return jsonb_build_object('permitido', false, 'motivo', 'limite_temas_dia',
                              'temas_hoy', v_hoy, 'limite', v_lim, 'solicitud_pendiente', v_pend);
  end if;
end $$;
grant execute on function public.puedo_abrir_tema(uuid) to authenticated;
