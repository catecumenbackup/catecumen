-- acceso-restringido-videos.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Acceso restringido por video (para cuentas de CORTESÍA): el admin puede dar
-- acceso TOTAL (todos los videos) o SOLO a una lista de videos elegida.
--   · usuarios.acceso_restringido = true  → el alumno solo ve los videos listados
--     en acceso_videos_usuario; cualquier otro queda bloqueado en mi_acceso_video
--     (y, por lo tanto, firmar-video tampoco firma su URL).
--   · false (por defecto, todos) → sin cambios: acceso normal a su curso.
-- Aplica a cualquier usuario, pero se expone en el alta de cortesía del panel.
-- Idempotente. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.usuarios add column if not exists acceso_restringido boolean not null default false;

create table if not exists public.acceso_videos_usuario (
  usuario_id uuid not null,
  video_id   uuid not null,
  creado     timestamptz not null default now(),
  primary key (usuario_id, video_id)
);
create index if not exists idx_acceso_videos_usuario on public.acceso_videos_usuario(usuario_id);
alter table public.acceso_videos_usuario enable row level security;
-- Sin políticas: solo service-role / RPCs de admin escriben; mi_acceso_video (SECURITY DEFINER) lee.

-- ── mi_acceso_video: añade el candado de acceso restringido AL INICIO ───────
create or replace function public.mi_acceso_video(p_video_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r record; v_puede boolean; v_pend boolean; v_deadline timestamptz;
begin
  if uid is null then return jsonb_build_object('puede_ver', false, 'sin_sesion', true); end if;

  -- Acceso restringido (cortesía con videos seleccionados): si el usuario está
  -- restringido y este video NO está en su lista, bloquear de inmediato.
  if exists(select 1 from usuarios u where u.id = uid and u.acceso_restringido = true)
     and not exists(select 1 from acceso_videos_usuario a
                    where a.usuario_id = uid and a.video_id = p_video_id) then
    return jsonb_build_object('puede_ver', false, 'restringido', true);
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

  if r.reabierto_hasta is not null and r.reabierto_hasta > now() then
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
    'abierto_hasta', v_deadline,
    'restante_horas', case when v_puede and v_deadline is not null and v_deadline > now()
                           then round(extract(epoch from (v_deadline - now()))/3600.0, 1) else null end,
    'solicitud_pendiente', coalesce(v_pend, false)
  );
end $$;
grant execute on function public.mi_acceso_video(uuid) to authenticated;

-- ── ADMIN: fijar el acceso (total o lista) de un usuario ────────────────────
create or replace function public.admin_fijar_acceso_videos(
  p_usuario uuid, p_restringido boolean, p_videos uuid[] default '{}')
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  update public.usuarios set acceso_restringido = coalesce(p_restringido, false) where id = p_usuario;
  delete from public.acceso_videos_usuario where usuario_id = p_usuario;
  if coalesce(p_restringido, false) and p_videos is not null and array_length(p_videos, 1) > 0 then
    insert into public.acceso_videos_usuario (usuario_id, video_id)
      select p_usuario, v from unnest(p_videos) v
    on conflict do nothing;
  end if;
  begin
    insert into admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              'fijar_acceso_videos', 'usuarios', p_usuario::text,
              jsonb_build_object('restringido', p_restringido, 'n_videos', coalesce(array_length(p_videos,1),0)));
  exception when others then null; end;
end $$;
grant execute on function public.admin_fijar_acceso_videos(uuid, boolean, uuid[]) to authenticated;

-- ── ADMIN: ver el acceso actual de un usuario ───────────────────────────────
create or replace function public.admin_acceso_videos_de(p_usuario uuid)
returns table(acceso_restringido boolean, video_id uuid)
language sql security definer set search_path = public as $$
  select
    (select u.acceso_restringido from public.usuarios u where u.id = p_usuario) as acceso_restringido,
    a.video_id
  from public.acceso_videos_usuario a
  where public.es_admin() and a.usuario_id = p_usuario;
$$;
grant execute on function public.admin_acceso_videos_de(uuid) to authenticated;
