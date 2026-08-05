-- scripts/directorio-flexible.sql
-- Búsqueda por texto MÁS FLEXIBLE para el directorio de afiliados:
--   • sin acentos      ("queretaro" encuentra "Querétaro")   -> unaccent
--   • sin mayúsculas   ("PARROQUIA" = "parroquia")           -> lower
--   • palabras en cualquier orden y en distintos campos      -> tokens (AND)
--     ("guadalupe cdmx" casa "Parroquia ... Guadalupe, CDMX")
--   • tolerante a erratas ("queretato", "guadalup")          -> pg_trgm word_similarity
--
-- Requiere: scripts/directorio-afiliados.sql y scripts/directorio-mx.sql
-- (columnas aprobada/lat/lng/estado/municipio). Idempotente y re-ejecutable.

-- Extensiones en el esquema 'extensions' (misma convención que pgcrypto).
create schema if not exists extensions;
create extension if not exists unaccent  schema extensions;
create extension if not exists pg_trgm   schema extensions;

-- Reemplaza la versión previa (misma firma de 6 args).
drop function if exists public.buscar_afiliados_texto(text, text, text, text, text, int);

create or replace function public.buscar_afiliados_texto(
  p_q         text default null,
  p_tipo      text default null,
  p_pais      text default null,
  p_estado    text default null,
  p_municipio text default null,
  p_limite    int  default 60
) returns table(
  tipo text, nombre text, responsable text, pais text, direccion text,
  email text, telefono text, lat double precision, lng double precision
)
-- search_path incluye 'extensions' para ver unaccent()/word_similarity().
language sql security definer set search_path = public, extensions
as $$
  with q as (
    select
      nullif(extensions.unaccent(lower(trim(coalesce(p_q,'')))), '')        as qn,       -- consulta normalizada
      nullif(extensions.unaccent(lower(trim(coalesce(p_estado,'')))), '')   as est_n,
      nullif(extensions.unaccent(lower(trim(coalesce(p_municipio,'')))), '')as mun_n
  )
  select * from (
    -- ── Parroquias ──────────────────────────────────────────────────────────
    select 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable, p.pais,
           p.direccion, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono, p.lat, p.lng
      from public.parroquias p
      cross join q
      cross join lateral (select extensions.unaccent(lower(concat_ws(' ',
           p.nombre, p.pais, p.direccion, p.estado, p.municipio))) as hay) h
     where p.aprobada and (p_tipo is null or p_tipo = 'parroquia')
       and (p_pais is null or p_pais = '' or p.pais ilike p_pais)
       and (q.est_n is null or h.hay like '%'||q.est_n||'%')
       and (q.mun_n is null or h.hay like '%'||q.mun_n||'%')
       and (
         q.qn is null
         -- todas las palabras de la consulta aparecen en el texto combinado
         or (select bool_and(h.hay like '%'||t||'%')
               from unnest(regexp_split_to_array(q.qn, '\s+')) t where t <> '')
         -- o es "parecido" (tolera erratas) si la consulta tiene ≥4 caracteres
         or (length(q.qn) >= 4 and extensions.word_similarity(q.qn, h.hay) > 0.35)
       )
    union all
    -- ── Diócesis ────────────────────────────────────────────────────────────
    select 'diocesis'::text, d.nombre, d.nombre_obispo, d.pais,
           d.direccion, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono), d.lat, d.lng
      from public.diocesis d
      cross join q
      cross join lateral (select extensions.unaccent(lower(concat_ws(' ',
           d.nombre, d.pais, d.direccion, d.estado, d.municipio))) as hay) h
     where d.aprobada and (p_tipo is null or p_tipo = 'diocesis')
       and (p_pais is null or p_pais = '' or d.pais ilike p_pais)
       and (q.est_n is null or h.hay like '%'||q.est_n||'%')
       and (q.mun_n is null or h.hay like '%'||q.mun_n||'%')
       and (
         q.qn is null
         or (select bool_and(h.hay like '%'||t||'%')
               from unnest(regexp_split_to_array(q.qn, '\s+')) t where t <> '')
         or (length(q.qn) >= 4 and extensions.word_similarity(q.qn, h.hay) > 0.35)
       )
  ) s
  order by s.pais, s.nombre
  limit p_limite;
$$;

grant execute on function public.buscar_afiliados_texto(text, text, text, text, text, int) to anon, authenticated;
