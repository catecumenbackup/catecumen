-- ════════════════════════════════════════════════════════════════════════════
--  Control de acceso a videos — v2 (ajuste pedido por Enyoria, oct-2026)
--
--  BLOQUEO: un video se bloquea automáticamente cuando el alumno APRUEBA su
--  evaluación con el mínimo de 8 (aprobar_video). Si no la acredita, no se bloquea.
--  TOPE DURO: aun sin aprobar, un video no puede permanecer abierto más de 72 h
--  desde el primer acceso. Pasado ese tope (o aprobado), queda BLOQUEADO y se
--  solicita reapertura al admin (otra ventana de 72 h).
--
--  RASTREO: device_id en descargas, límite diario de descargas, aviso de
--  descargas anómalas al admin, y registro de reproducción offline.
--
--  Correr DESPUÉS de control-acceso-videos.sql. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

-- ── Nuevos campos del modelo de acceso ──────────────────────────────────────
alter table public.accesos_video add column if not exists primer_acceso  timestamptz;
alter table public.accesos_video add column if not exists aprobado       boolean not null default false;
alter table public.accesos_video add column if not exists reabierto_hasta timestamptz;

alter table public.descargas_log add column if not exists device_id text;

-- admin_descargas_listar cambia su tipo de retorno (añade device_id) → recrear.
drop function if exists public.admin_descargas_listar(text,int);

-- ── Estado de acceso (y arranca el reloj de 72 h al primer acceso) ──────────
create or replace function public.mi_acceso_video(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; v_puede boolean; v_pend boolean; v_deadline timestamptz;
begin
  if uid is null then return jsonb_build_object('puede_ver', false, 'sin_sesion', true); end if;

  select * into r from accesos_video where usuario_id = uid and video_id = p_video_id;
  if r is null then
    insert into accesos_video (usuario_id, video_id, primer_acceso, actualizado)
      values (uid, p_video_id, now(), now())
    on conflict (usuario_id, video_id) do nothing;
    select * into r from accesos_video where usuario_id = uid and video_id = p_video_id;
  elsif r.primer_acceso is null and not r.aprobado then
    update accesos_video set primer_acceso = now(), actualizado = now()
      where usuario_id = uid and video_id = p_video_id;
    r.primer_acceso := now();
  end if;

  if r.reabierto_hasta is not null and r.reabierto_hasta > now() then
    v_puede := true;  v_deadline := r.reabierto_hasta;                 -- ventana concedida por admin
  elsif r.aprobado then
    v_puede := false; v_deadline := null;                             -- aprobó la evaluación → bloqueado
  elsif r.primer_acceso is not null and now() > r.primer_acceso + interval '72 hours' then
    v_puede := false; v_deadline := r.primer_acceso + interval '72 hours'; -- tope de 72 h vencido
  else
    v_puede := true;  v_deadline := coalesce(r.primer_acceso, now()) + interval '72 hours';
  end if;

  select exists(select 1 from solicitudes_acceso
                 where usuario_id = uid and video_id = p_video_id and estado = 'pendiente')
    into v_pend;

  return jsonb_build_object(
    'puede_ver', v_puede,
    'aprobado', coalesce(r.aprobado, false),
    'abierto_hasta', v_deadline,
    'restante_horas', case when v_puede and v_deadline is not null and v_deadline > now()
                           then round(extract(epoch from (v_deadline - now()))/3600.0, 1) else null end,
    'solicitud_pendiente', coalesce(v_pend, false)
  );
end $$;
grant execute on function public.mi_acceso_video(uuid) to authenticated;

-- ── Aprobar el video (evaluación ≥ 8) → lo BLOQUEA ──────────────────────────
create or replace function public.aprobar_video(p_video_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into accesos_video (usuario_id, video_id, aprobado, primer_acceso, actualizado)
    values (uid, p_video_id, true, coalesce((select primer_acceso from accesos_video
             where usuario_id = uid and video_id = p_video_id), now()), now())
  on conflict (usuario_id, video_id) do update
    set aprobado = true, reabierto_hasta = null, actualizado = now();
end $$;
grant execute on function public.aprobar_video(uuid) to authenticated;

-- ── Aprobar/rechazar solicitud: al aprobar, abre ventana de 72 h ────────────
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
    insert into accesos_video (usuario_id, video_id, reabierto_hasta, actualizado)
      values (s.usuario_id, s.video_id, now() + interval '72 hours', now())
    on conflict (usuario_id, video_id) do update
      set reabierto_hasta = now() + interval '72 hours', actualizado = now();
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

-- ── Límite diario de descargas (configurable por ajuste) ────────────────────
create or replace function public.puedo_descargar(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_lim int; v_cnt int;
begin
  if uid is null then return jsonb_build_object('permitido', false); end if;
  v_lim := coalesce((select (valor->>'n')::int from ajustes where clave = 'descargas_limite_dia'), 5);
  select count(*) into v_cnt from descargas_log
    where usuario_id = uid and resultado = 'exito' and creado > now() - interval '24 hours';
  return jsonb_build_object('permitido', v_cnt < v_lim, 'restantes', greatest(0, v_lim - v_cnt), 'limite', v_lim);
end $$;
grant execute on function public.puedo_descargar(uuid) to authenticated;

-- ── Registrar descarga/reproducción (+ device_id + aviso de anomalía) ───────
create or replace function public.registrar_descarga(
  p_video_id uuid, p_resultado text, p_ua text default null, p_device_id text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_disp text; v_lim int; v_cnt int; v_email text;
begin
  if uid is null then return; end if;
  if p_resultado not in ('intento','exito','reproduccion_offline') then return; end if;
  v_disp := case when coalesce(p_ua,'') ~* 'mobile|android|iphone|ipad|ipod|windows phone'
                 then 'movil' else 'escritorio' end;
  insert into descargas_log (usuario_id, video_id, resultado, dispositivo, device_id)
    values (uid, p_video_id, p_resultado, v_disp, p_device_id);

  if p_resultado = 'exito' then
    v_lim := coalesce((select (valor->>'n')::int from ajustes where clave = 'descargas_limite_dia'), 5);
    select count(*) into v_cnt from descargas_log
      where usuario_id = uid and resultado = 'exito' and creado > now() - interval '24 hours';
    if v_cnt >= v_lim then
      -- Aviso al admin, una vez por día por usuario (evita spam).
      if not exists (select 1 from notificaciones_admin
                       where tipo = 'descarga_anomala' and detalle->>'usuario_id' = uid::text
                         and creado > now() - interval '24 hours') then
        select email into v_email from usuarios where id = uid;
        begin
          insert into notificaciones_admin (tipo, titulo, detalle)
            values ('descarga_anomala', 'Descargas elevadas de un alumno',
                    jsonb_build_object('email', v_email, 'usuario_id', uid, 'descargas_24h', v_cnt));
        exception when others then null; end;
      end if;
    end if;
  end if;
end $$;
grant execute on function public.registrar_descarga(uuid,text,text,text) to authenticated;

-- ── ADMIN: listar descargas (ahora con device_id) ───────────────────────────
create or replace function public.admin_descargas_listar(p_q text default null, p_limite int default 200)
returns table (id bigint, email text, nombre text, video_id uuid, sacramento text, orden int,
               resultado text, dispositivo text, device_id text, creado timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select d.id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           d.video_id, sac.nombre_es, v.orden, d.resultado, d.dispositivo, d.device_id, d.creado
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

-- ── ADMIN: resumen de descargas por usuario (dispositivos distintos) ────────
create or replace function public.admin_descargas_resumen(p_dias int default 30)
returns table (email text, nombre text, exitos bigint, intentos bigint,
               dispositivos bigint, ultima timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           count(*) filter (where d.resultado = 'exito')   as exitos,
           count(*) filter (where d.resultado = 'intento') as intentos,
           count(distinct d.device_id)                     as dispositivos,
           max(d.creado)                                   as ultima
      from descargas_log d left join usuarios u on u.id = d.usuario_id
     where d.creado > now() - make_interval(days => greatest(1, p_dias))
     group by u.email, trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,''))
     order by exitos desc, intentos desc;
end $$;

-- Semilla del límite diario de descargas (editable en ajustes).
insert into public.ajustes (clave, valor)
  values ('descargas_limite_dia', '{"n": 5}'::jsonb)
on conflict (clave) do nothing;
