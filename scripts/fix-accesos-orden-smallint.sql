-- fix-accesos-orden-smallint.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Arregla "structure of query does not match function result type" en la pestaña
-- 🔓 Accesos del panel. Causa: videos.orden es SMALLINT, pero admin_solicitudes_listar
-- y admin_descargas_listar declaran `orden int` en su RETURNS TABLE. Al devolver el
-- valor, Postgres ve smallint≠integer y falla en tiempo de ejecución.
-- Solución: castear v.orden::int en el cuerpo (sin cambiar la firma declarada).
-- Idempotente. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

drop function if exists public.admin_solicitudes_listar(text);
drop function if exists public.admin_descargas_listar(text, int);

-- ── Solicitudes de reapertura ───────────────────────────────────────────────
create or replace function public.admin_solicitudes_listar(p_estado text default 'pendiente')
returns table (id bigint, usuario_id uuid, email text, nombre text, video_id uuid,
               sacramento text, orden int, estado text, creado timestamptz, resuelto timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select s.id, s.usuario_id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           s.video_id, sac.nombre_es, v.orden::int, s.estado, s.creado, s.resuelto
      from solicitudes_acceso s
      left join usuarios u      on u.id = s.usuario_id
      left join videos v        on v.id = s.video_id
      left join sacramentos sac on sac.id = v.sacramento_id
     where (p_estado is null or p_estado = 'todas' or s.estado = p_estado)
     order by s.creado desc;
end $$;

-- ── Descargas registradas (incluye device_id) ──────────────────────────────
create or replace function public.admin_descargas_listar(p_q text default null, p_limite int default 200)
returns table (id bigint, email text, nombre text, video_id uuid, sacramento text, orden int,
               resultado text, dispositivo text, device_id text, creado timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select d.id, u.email,
           trim(coalesce(u.nombre,'')||' '||coalesce(u.apellido,'')) as nombre,
           d.video_id, sac.nombre_es, v.orden::int, d.resultado, d.dispositivo, d.device_id, d.creado
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

grant execute on function public.admin_solicitudes_listar(text)     to authenticated;
grant execute on function public.admin_descargas_listar(text, int)  to authenticated;
