-- scripts/directorio-mx.sql
-- Filtros del directorio por país y, para México, estado/municipio.
-- Añade columnas estado/municipio y amplía buscar_afiliados_texto.
-- Requiere scripts/directorio-afiliados.sql. Idempotente.

alter table public.parroquias add column if not exists estado    text;
alter table public.parroquias add column if not exists municipio text;
alter table public.diocesis  add column if not exists estado    text;
alter table public.diocesis  add column if not exists municipio text;

-- Reemplaza la versión anterior (3 args) por una con país/estado/municipio.
drop function if exists public.buscar_afiliados_texto(text, text, int);

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
language sql security definer set search_path = public
as $$
  select * from (
    select 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable, p.pais,
           p.direccion, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono, p.lat, p.lng
      from public.parroquias p
     where p.aprobada and (p_tipo is null or p_tipo = 'parroquia')
       and (p_q is null or p_q = '' or (p.nombre ilike '%'||p_q||'%' or coalesce(p.direccion,'') ilike '%'||p_q||'%'))
       and (p_pais is null or p_pais = '' or p.pais ilike p_pais)
       -- estado/municipio: casa contra la columna estructurada O la dirección libre
       and (p_estado is null or p_estado = '' or (coalesce(p.estado,'')||' '||coalesce(p.direccion,'')) ilike '%'||p_estado||'%')
       and (p_municipio is null or p_municipio = '' or (coalesce(p.municipio,'')||' '||coalesce(p.direccion,'')) ilike '%'||p_municipio||'%')
    union all
    select 'diocesis'::text, d.nombre, d.nombre_obispo, d.pais,
           d.direccion, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono), d.lat, d.lng
      from public.diocesis d
     where d.aprobada and (p_tipo is null or p_tipo = 'diocesis')
       and (p_q is null or p_q = '' or (d.nombre ilike '%'||p_q||'%' or coalesce(d.direccion,'') ilike '%'||p_q||'%'))
       and (p_pais is null or p_pais = '' or d.pais ilike p_pais)
       and (p_estado is null or p_estado = '' or (coalesce(d.estado,'')||' '||coalesce(d.direccion,'')) ilike '%'||p_estado||'%')
       and (p_municipio is null or p_municipio = '' or (coalesce(d.municipio,'')||' '||coalesce(d.direccion,'')) ilike '%'||p_municipio||'%')
  ) s
  order by s.pais, s.nombre
  limit p_limite;
$$;

grant execute on function public.buscar_afiliados_texto(text, text, text, text, text, int) to anon, authenticated;
