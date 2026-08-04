-- scripts/admin-scholas.sql
-- RPCs de ADMIN para gestionar los recursos de las Scholas (pestaña del panel).
-- Requiere scripts/schola.sql. Todo protegido por es_admin(). Idempotente.

create or replace function public.admin_schola_listar(p_espacio text default null)
returns setof public.schola_recursos
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  return query
    select * from public.schola_recursos
     where (p_espacio is null or p_espacio = '' or espacio = p_espacio)
     order by espacio, categoria_orden, orden;
end $$;

create or replace function public.admin_schola_guardar(
  p_id bigint, p_espacio text, p_categoria_orden int,
  p_categoria jsonb, p_titulo jsonb, p_descripcion jsonb,
  p_tipo text, p_url text, p_orden int
) returns bigint
language plpgsql security definer set search_path = public as $$
declare nid bigint;
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  if p_id is null then
    insert into public.schola_recursos (espacio, categoria_orden,
      categoria_es, categoria_en, categoria_fr, categoria_de, categoria_pt, categoria_it,
      titulo_es, titulo_en, titulo_fr, titulo_de, titulo_pt, titulo_it,
      descripcion_es, descripcion_en, descripcion_fr, descripcion_de, descripcion_pt, descripcion_it,
      tipo, url, orden)
    values (p_espacio, coalesce(p_categoria_orden,0),
      p_categoria->>'es', p_categoria->>'en', p_categoria->>'fr', p_categoria->>'de', p_categoria->>'pt', p_categoria->>'it',
      p_titulo->>'es', p_titulo->>'en', p_titulo->>'fr', p_titulo->>'de', p_titulo->>'pt', p_titulo->>'it',
      p_descripcion->>'es', p_descripcion->>'en', p_descripcion->>'fr', p_descripcion->>'de', p_descripcion->>'pt', p_descripcion->>'it',
      p_tipo, p_url, coalesce(p_orden,0))
    returning id into nid;
  else
    update public.schola_recursos set
      espacio = p_espacio, categoria_orden = coalesce(p_categoria_orden,0),
      categoria_es=p_categoria->>'es', categoria_en=p_categoria->>'en', categoria_fr=p_categoria->>'fr',
      categoria_de=p_categoria->>'de', categoria_pt=p_categoria->>'pt', categoria_it=p_categoria->>'it',
      titulo_es=p_titulo->>'es', titulo_en=p_titulo->>'en', titulo_fr=p_titulo->>'fr',
      titulo_de=p_titulo->>'de', titulo_pt=p_titulo->>'pt', titulo_it=p_titulo->>'it',
      descripcion_es=p_descripcion->>'es', descripcion_en=p_descripcion->>'en', descripcion_fr=p_descripcion->>'fr',
      descripcion_de=p_descripcion->>'de', descripcion_pt=p_descripcion->>'pt', descripcion_it=p_descripcion->>'it',
      tipo=p_tipo, url=p_url, orden=coalesce(p_orden,0)
    where id = p_id
    returning id into nid;
  end if;
  return nid;
end $$;

create or replace function public.admin_schola_activo(p_id bigint, p_activo boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  update public.schola_recursos set activo = p_activo where id = p_id;
end $$;

create or replace function public.admin_schola_borrar(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  delete from public.schola_recursos where id = p_id;
end $$;

grant execute on function public.admin_schola_listar(text) to authenticated;
grant execute on function public.admin_schola_guardar(bigint, text, int, jsonb, jsonb, jsonb, text, text, int) to authenticated;
grant execute on function public.admin_schola_activo(bigint, boolean) to authenticated;
grant execute on function public.admin_schola_borrar(bigint) to authenticated;
