-- ════════════════════════════════════════════════════════════════════════════
--  REVISOR ECLESIÁSTICO (Enyoria, nov-2026)
--
--  Un sacerdote entra como REVISOR para auditar el contenido:
--    · VE TODO el catálogo, SIN tope de 3 vistas, SIN caducidad de 72 h y SIN
--      exigir evaluación ni plazo de formación.
--    · CONSERVA toda la protección anti-piratería: token de Bunny (firmar-video),
--      marca de agua dinámica y descarga cifrada — la descarga se PERMITE pero se
--      REGISTRA (monitoreo).
--    · Toda su actividad queda registrada para monitoreo del admin (login, apertura
--      y fin de cada video, intentos/éxitos de descarga, comentarios).
--    · Puede enviar COMENTARIOS de revisor directamente al admin.
--
--  tipo_usuario = 'revisor'. Las cuentas las crea la edge function `crear-revisor`
--  (solo admin) y el sacerdote fija su contraseña por enlace de invitación.
--
--  Correr DESPUÉS de: control-acceso-v2.sql, limite-vistas.sql, plazo-formacion.sql,
--  notificaciones-admin.sql. Idempotente y re-ejecutable.
--  NO añadir al final una llamada a una RPC protegida por es_admin() (revierte).
-- ════════════════════════════════════════════════════════════════════════════

-- ── Permitir tipo_usuario='revisor' en el CHECK de usuarios ─────────────────
-- (el CHECK original solo admitía catecumeno/prebautismal/padrino/catequista).
alter table public.usuarios drop constraint if exists usuarios_tipo_usuario_check;
alter table public.usuarios add constraint usuarios_tipo_usuario_check
  check (tipo_usuario = any (array['catecumeno','prebautismal','padrino','catequista','revisor']));

-- ── Helper: ¿esta cuenta es revisor? ────────────────────────────────────────
create or replace function public.es_revisor(p_uid uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.usuarios
     where id = coalesce(p_uid, auth.uid()) and tipo_usuario = 'revisor'
       and coalesce(suspendido,false) = false and coalesce(eliminado,false) = false
  );
$$;
grant execute on function public.es_revisor(uuid) to authenticated;

-- ── ADMIN: revocar / reactivar el acceso de un revisor ──────────────────────
-- Revocar = suspendido=true (bloquea el login en handleLoginSuccess Y, por el
-- filtro de arriba, es_revisor() deja de concederle el acceso ilimitado).
create or replace function public.admin_revisor_acceso(p_usuario_id uuid, p_revocar boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  update usuarios
     set suspendido = p_revocar,
         suspendido_en = case when p_revocar then now() else null end,
         suspendido_motivo = case when p_revocar then 'Acceso de revisor revocado por el administrador' else null end
   where id = p_usuario_id and tipo_usuario='revisor';
  begin
    insert into admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id=auth.uid()),
              case when p_revocar then 'revisor.revocado' else 'revisor.reactivado' end,
              'usuarios', p_usuario_id::text, jsonb_build_object('revocar', p_revocar));
  exception when others then null; end;
end $$;
grant execute on function public.admin_revisor_acceso(uuid, boolean) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  BYPASS DE LÍMITES PARA REVISORES (reproduce el cuerpo vigente + rama revisor)
-- ════════════════════════════════════════════════════════════════════════════

-- ── mi_acceso_video: el revisor siempre puede ver, sin topes ────────────────
create or replace function public.mi_acceso_video(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; v_puede boolean; v_pend boolean;
        v_deadline timestamptz; v_motivo text := null; c_max int := 3;
begin
  if uid is null then return jsonb_build_object('puede_ver', false, 'sin_sesion', true); end if;

  -- REVISOR: acceso total, sin tope de vistas ni de 72 h, sin bloqueo por aprobación.
  if es_revisor(uid) then
    return jsonb_build_object(
      'puede_ver', true, 'aprobado', false, 'motivo', null,
      'vistas', 0, 'vistas_max', null, 'vistas_restantes', null,
      'abierto_hasta', null, 'restante_horas', null,
      'solicitud_pendiente', false, 'revisor', true);
  end if;

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

  if coalesce(r.vistas,0) >= c_max then
    v_puede := false; v_deadline := null; v_motivo := 'limite_vistas';
  elsif r.reabierto_hasta is not null and r.reabierto_hasta > now() then
    v_puede := true;  v_deadline := r.reabierto_hasta;
  elsif r.aprobado then
    v_puede := false; v_deadline := null;
  elsif r.primer_acceso is not null and now() > r.primer_acceso + interval '72 hours' then
    v_puede := false; v_deadline := r.primer_acceso + interval '72 hours';
  else
    v_puede := true;  v_deadline := coalesce(r.primer_acceso, now()) + interval '72 hours';
  end if;

  select exists(select 1 from solicitudes_acceso
                 where usuario_id = uid and video_id = p_video_id and estado = 'pendiente')
    into v_pend;

  return jsonb_build_object(
    'puede_ver', v_puede,
    'aprobado', coalesce(r.aprobado, false),
    'motivo', v_motivo,
    'vistas', coalesce(r.vistas, 0),
    'vistas_max', c_max,
    'vistas_restantes', greatest(0, c_max - coalesce(r.vistas, 0)),
    'abierto_hasta', v_deadline,
    'restante_horas', case when v_puede and v_deadline is not null and v_deadline > now()
                           then round(extract(epoch from (v_deadline - now()))/3600.0, 1) else null end,
    'solicitud_pendiente', coalesce(v_pend, false)
  );
end $$;
grant execute on function public.mi_acceso_video(uuid) to authenticated;

-- ── registrar_vista: para el revisor NO cuenta (vistas ilimitadas) ──────────
create or replace function public.registrar_vista(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; c_max int := 3;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;

  if es_revisor(uid) then
    return jsonb_build_object('ok', true, 'revisor', true,
      'vistas', 0, 'vistas_max', null, 'vistas_restantes', null);
  end if;

  insert into accesos_video (usuario_id, video_id, primer_acceso, actualizado)
    values (uid, p_video_id, now(), now())
  on conflict (usuario_id, video_id) do nothing;
  select * into r from accesos_video where usuario_id = uid and video_id = p_video_id;
  if coalesce(r.aprobado,false) or coalesce(r.vistas,0) >= c_max then
    return jsonb_build_object('ok', true, 'vistas', coalesce(r.vistas,0), 'vistas_max', c_max,
                              'vistas_restantes', greatest(0, c_max - coalesce(r.vistas,0)));
  end if;
  update accesos_video set vistas = coalesce(vistas,0) + 1, actualizado = now()
    where usuario_id = uid and video_id = p_video_id
    returning vistas into r.vistas;
  return jsonb_build_object('ok', true, 'vistas', r.vistas, 'vistas_max', c_max,
                            'vistas_restantes', greatest(0, c_max - r.vistas));
end $$;
grant execute on function public.registrar_vista(uuid) to authenticated;

-- ── puedo_descargar: el revisor descarga sin límite diario (pero se registra) ─
create or replace function public.puedo_descargar(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_lim int; v_cnt int;
begin
  if uid is null then return jsonb_build_object('permitido', false); end if;

  if es_revisor(uid) then
    return jsonb_build_object('permitido', true, 'restantes', null, 'limite', null, 'revisor', true);
  end if;

  v_lim := coalesce((select (valor->>'n')::int from ajustes where clave = 'descargas_limite_dia'), 5);
  select count(*) into v_cnt from descargas_log
    where usuario_id = uid and resultado = 'exito' and creado > now() - interval '24 hours';
  return jsonb_build_object('permitido', v_cnt < v_lim, 'restantes', greatest(0, v_lim - v_cnt), 'limite', v_lim);
end $$;
grant execute on function public.puedo_descargar(uuid) to authenticated;

-- ── iniciar_formacion: el revisor no arranca plazo (sin caducidad global) ────
create or replace function public.iniciar_formacion()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u record; n int; m int; lim timestamptz;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;
  if es_revisor(uid) then return jsonb_build_object('ok', true, 'revisor', true); end if;
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

-- ── mi_formacion: para el revisor nunca está vencido ────────────────────────
create or replace function public.mi_formacion()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); u record; v_pend boolean;
begin
  if uid is null then return jsonb_build_object('sin_sesion', true); end if;
  if es_revisor(uid) then
    return jsonb_build_object('inicio', null, 'limite', null, 'vencido', false,
                              'dias_restantes', null, 'solicitud_pendiente', false, 'revisor', true);
  end if;
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

-- ════════════════════════════════════════════════════════════════════════════
--  MONITOREO: actividad del revisor
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.revisor_actividad (
  id          bigserial primary key,
  usuario_id  uuid not null,
  tipo        text not null,          -- login | video_abierto | video_fin | descarga_intento | comentario | ...
  video_id    uuid,
  detalle     jsonb not null default '{}'::jsonb,
  creado      timestamptz not null default now()
);
alter table public.revisor_actividad enable row level security;  -- sin políticas: solo vía RPC SECURITY DEFINER
create index if not exists idx_revisor_actividad_user on public.revisor_actividad (usuario_id, creado desc);

-- El propio revisor registra su actividad (solo si realmente es revisor).
create or replace function public.registrar_actividad_revisor(
  p_tipo text, p_video_id uuid default null, p_detalle jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not es_revisor(uid) then return; end if;
  insert into revisor_actividad (usuario_id, tipo, video_id, detalle)
    values (uid, left(coalesce(p_tipo,'?'),40), p_video_id, coalesce(p_detalle,'{}'::jsonb));
end $$;
grant execute on function public.registrar_actividad_revisor(text, uuid, jsonb) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  COMENTARIOS del revisor → al admin
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.revisor_comentarios (
  id          bigserial primary key,
  usuario_id  uuid not null,
  video_id    uuid,
  contexto    text,                   -- etiqueta legible (sección/tema) para el admin
  comentario  text not null,
  leido       boolean not null default false,
  creado      timestamptz not null default now()
);
alter table public.revisor_comentarios enable row level security;  -- sin políticas: solo vía RPC
create index if not exists idx_revisor_coment_creado on public.revisor_comentarios (creado desc);

create or replace function public.revisor_comentar(
  p_video_id uuid, p_contexto text, p_comentario text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); v_email text; v_nombre text;
begin
  if uid is null then return jsonb_build_object('ok', false, 'error', 'sin_sesion'); end if;
  if not es_revisor(uid) then return jsonb_build_object('ok', false, 'error', 'no_revisor'); end if;
  if coalesce(btrim(p_comentario),'') = '' then return jsonb_build_object('ok', false, 'error', 'vacio'); end if;

  insert into revisor_comentarios (usuario_id, video_id, contexto, comentario)
    values (uid, p_video_id, left(coalesce(p_contexto,''),160), left(p_comentario, 4000));

  insert into revisor_actividad (usuario_id, tipo, video_id, detalle)
    values (uid, 'comentario', p_video_id, jsonb_build_object('contexto', left(coalesce(p_contexto,''),160)));

  -- Aviso al admin (panel de Avisos).
  select email, trim(coalesce(nombre,'')||' '||coalesce(apellido,'')) into v_email, v_nombre
    from usuarios where id = uid;
  begin
    insert into notificaciones_admin (tipo, titulo, detalle)
      values ('revisor_comentario', 'Comentario de revisor eclesiástico',
              jsonb_build_object('email', v_email, 'nombre', v_nombre, 'usuario_id', uid,
                                 'contexto', left(coalesce(p_contexto,''),160),
                                 'extracto', left(p_comentario, 200)));
  exception when others then null; end;

  return jsonb_build_object('ok', true);
end $$;
grant execute on function public.revisor_comentar(uuid, text, text) to authenticated;

-- ════════════════════════════════════════════════════════════════════════════
--  ADMIN: alta/monitoreo/comentarios de revisores
-- ════════════════════════════════════════════════════════════════════════════

-- Lista de revisores con resumen de actividad.
drop function if exists public.admin_revisores_listar();
create function public.admin_revisores_listar()
returns table (usuario_id uuid, email text, nombre text, creado timestamptz, suspendido boolean,
               ultima_actividad timestamptz, n_actividades bigint,
               n_comentarios bigint, n_comentarios_no_leidos bigint,
               n_descargas bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select u.id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           u.created_at as creado, coalesce(u.suspendido,false) as suspendido,
           (select max(a.creado) from revisor_actividad a where a.usuario_id = u.id) as ultima_actividad,
           (select count(*) from revisor_actividad a where a.usuario_id = u.id) as n_actividades,
           (select count(*) from revisor_comentarios c where c.usuario_id = u.id) as n_comentarios,
           (select count(*) from revisor_comentarios c where c.usuario_id = u.id and not c.leido) as n_comentarios_no_leidos,
           (select count(*) from descargas_log d where d.usuario_id = u.id) as n_descargas
      from usuarios u
     where u.tipo_usuario = 'revisor'
     order by ultima_actividad desc nulls last, u.created_at desc;
end $$;

-- Línea de tiempo de actividad de un revisor (incluye descargas de descargas_log).
create or replace function public.admin_revisor_actividad(p_usuario_id uuid, p_limite int default 300)
returns table (fuente text, tipo text, video_id uuid, sacramento text, orden int,
               detalle jsonb, creado timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select * from (
      select 'actividad'::text as fuente, a.tipo, a.video_id,
             sac.nombre_es as sacramento, v.orden, a.detalle, a.creado
        from revisor_actividad a
        left join videos v on v.id = a.video_id
        left join sacramentos sac on sac.id = v.sacramento_id
       where a.usuario_id = p_usuario_id
      union all
      select 'descarga'::text as fuente, d.resultado as tipo, d.video_id,
             sac.nombre_es as sacramento, v.orden,
             jsonb_build_object('dispositivo', d.dispositivo, 'device_id', d.device_id) as detalle,
             d.creado
        from descargas_log d
        left join videos v on v.id = d.video_id
        left join sacramentos sac on sac.id = v.sacramento_id
       where d.usuario_id = p_usuario_id
    ) t
    order by t.creado desc
    limit greatest(1, least(p_limite, 1000));
end $$;

-- Comentarios recibidos (todos o de un revisor), más recientes primero.
create or replace function public.admin_revisor_comentarios(p_usuario_id uuid default null, p_limite int default 200)
returns table (id bigint, usuario_id uuid, email text, nombre text,
               video_id uuid, sacramento text, orden int, contexto text,
               comentario text, leido boolean, creado timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select c.id, c.usuario_id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           c.video_id, sac.nombre_es, v.orden, c.contexto, c.comentario, c.leido, c.creado
      from revisor_comentarios c
      left join usuarios u on u.id = c.usuario_id
      left join videos v on v.id = c.video_id
      left join sacramentos sac on sac.id = v.sacramento_id
     where p_usuario_id is null or c.usuario_id = p_usuario_id
     order by c.creado desc
     limit greatest(1, least(p_limite, 1000));
end $$;

-- Marcar un comentario como leído.
create or replace function public.admin_revisor_comentario_leido(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  update revisor_comentarios set leido = true where id = p_id;
end $$;

-- Badge: comentarios de revisor sin leer.
create or replace function public.admin_revisor_comentarios_no_leidos()
returns bigint
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return (select count(*) from revisor_comentarios where not leido);
end $$;

-- Verificación segura (no usa auth.uid, no revierte):
-- select count(*) as revisores from public.usuarios where tipo_usuario='revisor';
