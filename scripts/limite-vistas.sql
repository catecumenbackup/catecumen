-- ════════════════════════════════════════════════════════════════════════════
--  Tope de visualizaciones por video (pedido por Enyoria, oct-2026)
--
--  Además del bloqueo por aprobación (≥8) y del tope de 72 h, cada video admite
--  un MÁXIMO de 3 reproducciones. A la 3ª se bloquea, aunque no hayan pasado las
--  72 h. Una reapertura del admin da una ventana nueva Y reinicia el contador.
--
--  Correr DESPUÉS de control-acceso-v2.sql. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.accesos_video add column if not exists vistas int not null default 0;

-- ── Estado de acceso (ahora incluye el tope de 3 vistas) ────────────────────
create or replace function public.mi_acceso_video(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; v_puede boolean; v_pend boolean;
        v_deadline timestamptz; v_motivo text := null; c_max int := 3;
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

  if r.aprobado then
    v_puede := false; v_deadline := null;                                   -- aprobó → bloqueado
  elsif coalesce(r.vistas,0) >= c_max then
    v_puede := false; v_deadline := null; v_motivo := 'limite_vistas';      -- 3 vistas → bloqueado
  elsif r.reabierto_hasta is not null and r.reabierto_hasta > now() then
    v_puede := true;  v_deadline := r.reabierto_hasta;                      -- ventana concedida por admin
  elsif r.primer_acceso is not null and now() > r.primer_acceso + interval '72 hours' then
    v_puede := false; v_deadline := r.primer_acceso + interval '72 hours';  -- tope de 72 h vencido
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

-- ── Registrar una reproducción (incrementa el contador) ─────────────────────
-- La llama el frontend al INICIAR la reproducción. Devuelve el estado de vistas.
-- No incrementa si ya está aprobado o si ya se alcanzó el tope (idempotente al tope).
create or replace function public.registrar_vista(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; c_max int := 3;
begin
  if uid is null then return jsonb_build_object('ok', false); end if;
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

-- ── Reapertura del admin: también reinicia el contador de vistas ────────────
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
    insert into accesos_video (usuario_id, video_id, reabierto_hasta, vistas, actualizado)
      values (s.usuario_id, s.video_id, now() + interval '72 hours', 0, now())
    on conflict (usuario_id, video_id) do update
      set reabierto_hasta = now() + interval '72 hours', vistas = 0, actualizado = now();
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
grant execute on function public.admin_resolver_solicitud(bigint, boolean) to authenticated;
