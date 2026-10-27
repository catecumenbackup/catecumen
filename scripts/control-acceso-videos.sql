-- ════════════════════════════════════════════════════════════════════════════
--  Control de acceso a videos (ventana de 72 h + reapertura por admin) y
--  registro de descargas (con correo del usuario).
--
--  Reglas:
--   • Un video es accesible mientras NO esté concluido.
--   • Al concluirlo, el alumno elige: conservar el acceso 72 h más, o cerrarlo ya.
--   • Vencida la ventana (o cerrado), el video queda BLOQUEADO; para volver a verlo
--     debe SOLICITAR al admin otra apertura de 72 h, que el admin aprueba o rechaza.
--   • Cada intento/éxito de descarga queda registrado con el usuario (correo).
--
--  Correr en el SQL Editor de Supabase. Idempotente.
--  NO llamar al final a RPCs es_admin() (auth.uid() es null en el editor y revierte).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Tablas ──────────────────────────────────────────────────────────────────
create table if not exists public.descargas_log (
  id          bigserial primary key,
  usuario_id  uuid not null,
  video_id    uuid,
  resultado   text not null,            -- 'intento' | 'exito'
  dispositivo text,
  creado      timestamptz not null default now()
);
create index if not exists descargas_log_usuario on public.descargas_log (usuario_id, creado desc);
create index if not exists descargas_log_creado  on public.descargas_log (creado desc);

create table if not exists public.accesos_video (
  usuario_id   uuid not null,
  video_id     uuid not null,
  completado   boolean not null default false,
  acceso_hasta timestamptz,             -- ventana activa; null = sin ventana
  actualizado  timestamptz not null default now(),
  primary key (usuario_id, video_id)
);

create table if not exists public.solicitudes_acceso (
  id           bigserial primary key,
  usuario_id   uuid not null,
  video_id     uuid not null,
  estado       text not null default 'pendiente',  -- pendiente|aprobada|rechazada
  creado       timestamptz not null default now(),
  resuelto     timestamptz,
  resuelto_por uuid
);
-- Una sola solicitud PENDIENTE por (usuario, video).
create unique index if not exists solicitudes_acceso_pend
  on public.solicitudes_acceso (usuario_id, video_id) where estado = 'pendiente';
create index if not exists solicitudes_acceso_estado on public.solicitudes_acceso (estado, creado desc);

-- RLS activo SIN políticas: todo el acceso pasa por las RPC SECURITY DEFINER.
alter table public.descargas_log      enable row level security;
alter table public.accesos_video      enable row level security;
alter table public.solicitudes_acceso enable row level security;

-- ── Registrar intento/éxito de descarga ─────────────────────────────────────
create or replace function public.registrar_descarga(
  p_video_id uuid, p_resultado text, p_ua text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_disp text;
begin
  if uid is null then return; end if;
  if p_resultado not in ('intento','exito') then return; end if;
  v_disp := case when coalesce(p_ua,'') ~* 'mobile|android|iphone|ipad|ipod|windows phone'
                 then 'movil' else 'escritorio' end;
  insert into descargas_log (usuario_id, video_id, resultado, dispositivo)
    values (uid, p_video_id, p_resultado, v_disp);
end $$;
grant execute on function public.registrar_descarga(uuid,text,text) to authenticated;

-- ── Estado de acceso del usuario a un video ─────────────────────────────────
create or replace function public.mi_acceso_video(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; v_puede boolean; v_pend boolean;
begin
  if uid is null then return jsonb_build_object('puede_ver', false, 'sin_sesion', true); end if;
  select * into r from accesos_video where usuario_id = uid and video_id = p_video_id;
  v_puede := (r is null) or (r.completado is false)
             or (r.acceso_hasta is not null and r.acceso_hasta > now());
  select exists(select 1 from solicitudes_acceso
                 where usuario_id = uid and video_id = p_video_id and estado = 'pendiente')
    into v_pend;
  return jsonb_build_object(
    'puede_ver', v_puede,
    'completado', coalesce(r.completado, false),
    'acceso_hasta', r.acceso_hasta,
    'restante_horas', case when r.acceso_hasta is not null and r.acceso_hasta > now()
                           then round(extract(epoch from (r.acceso_hasta - now()))/3600.0, 1) else null end,
    'solicitud_pendiente', coalesce(v_pend, false)
  );
end $$;
grant execute on function public.mi_acceso_video(uuid) to authenticated;

-- ── Concluir un video: conservar 72 h más o cerrar ya ───────────────────────
create or replace function public.concluir_video(p_video_id uuid, p_extender boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_hasta timestamptz;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;
  v_hasta := case when p_extender then now() + interval '72 hours' else now() end;
  insert into accesos_video (usuario_id, video_id, completado, acceso_hasta, actualizado)
    values (uid, p_video_id, true, v_hasta, now())
  on conflict (usuario_id, video_id) do update
    set completado = true, acceso_hasta = excluded.acceso_hasta, actualizado = now();
  return jsonb_build_object('ok', true, 'acceso_hasta', v_hasta, 'extendido', p_extender);
end $$;
grant execute on function public.concluir_video(uuid, boolean) to authenticated;

-- ── Solicitar reapertura (otra ventana de 72 h) ─────────────────────────────
create or replace function public.solicitar_reapertura(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_email text; v_nombre text; v_id bigint;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;
  insert into solicitudes_acceso (usuario_id, video_id)
    values (uid, p_video_id)
  on conflict (usuario_id, video_id) where estado = 'pendiente' do nothing
  returning id into v_id;
  -- Aviso al admin (la tabla notificaciones_admin acepta INSERT; es SECURITY DEFINER).
  if v_id is not null then
    select email, coalesce(nombre,'')||' '||coalesce(apellido,'') into v_email, v_nombre
      from usuarios where id = uid;
    begin
      insert into notificaciones_admin (tipo, titulo, detalle, ref_id)
        values ('reapertura', 'Solicitud de reapertura de video',
                jsonb_build_object('email', v_email, 'nombre', trim(v_nombre), 'video_id', p_video_id),
                v_id::text);
    exception when others then null; -- si la tabla no existe en algún entorno, no romper
    end;
  end if;
  return jsonb_build_object('ok', true, 'estado', 'pendiente');
end $$;
grant execute on function public.solicitar_reapertura(uuid) to authenticated;

-- ── ADMIN: listar solicitudes de reapertura ─────────────────────────────────
create or replace function public.admin_solicitudes_listar(p_estado text default 'pendiente')
returns table (id bigint, usuario_id uuid, email text, nombre text, video_id uuid,
               sacramento text, orden int, estado text, creado timestamptz, resuelto timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select s.id, s.usuario_id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           s.video_id, sac.nombre_es, v.orden, s.estado, s.creado, s.resuelto
      from solicitudes_acceso s
      left join usuarios u    on u.id = s.usuario_id
      left join videos v      on v.id = s.video_id
      left join sacramentos sac on sac.id = v.sacramento_id
     where (p_estado is null or p_estado = 'todas' or s.estado = p_estado)
     order by s.creado desc;
end $$;

-- ── ADMIN: aprobar / rechazar una solicitud ─────────────────────────────────
create or replace function public.admin_resolver_solicitud(p_id bigint, p_aprobar boolean)
returns void
language plpgsql security definer set search_path = public as $$
declare s record;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select * into s from solicitudes_acceso where id = p_id;
  if s is null then raise exception 'solicitud no encontrada'; end if;
  if s.estado <> 'pendiente' then raise exception 'la solicitud ya fue resuelta'; end if;

  if p_aprobar then
    insert into accesos_video (usuario_id, video_id, completado, acceso_hasta, actualizado)
      values (s.usuario_id, s.video_id, true, now() + interval '72 hours', now())
    on conflict (usuario_id, video_id) do update
      set acceso_hasta = now() + interval '72 hours', completado = true, actualizado = now();
    update solicitudes_acceso set estado='aprobada', resuelto=now(), resuelto_por=auth.uid() where id=p_id;
  else
    update solicitudes_acceso set estado='rechazada', resuelto=now(), resuelto_por=auth.uid() where id=p_id;
  end if;

  begin
    insert into admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              'resolver_solicitud_acceso', 'solicitud_acceso', p_id::text,
              jsonb_build_object('aprobada', p_aprobar, 'usuario_id', s.usuario_id, 'video_id', s.video_id));
  exception when others then null;
  end;
end $$;

-- ── ADMIN: contador de solicitudes pendientes (badge) ───────────────────────
create or replace function public.admin_solicitudes_pendientes()
returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return (select count(*) from solicitudes_acceso where estado = 'pendiente');
end $$;

-- ── ADMIN: listar descargas (con correo) ────────────────────────────────────
create or replace function public.admin_descargas_listar(p_q text default null, p_limite int default 200)
returns table (id bigint, email text, nombre text, video_id uuid, sacramento text, orden int,
               resultado text, dispositivo text, creado timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select d.id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           d.video_id, sac.nombre_es, v.orden, d.resultado, d.dispositivo, d.creado
      from descargas_log d
      left join usuarios u      on u.id = d.usuario_id
      left join videos v        on v.id = d.video_id
      left join sacramentos sac on sac.id = v.sacramento_id
     where p_q is null or p_q = ''
        or u.email ilike '%'||p_q||'%'
        or trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) ilike '%'||p_q||'%'
     order by d.creado desc
     limit greatest(1, least(p_limite, 1000));
end $$;
