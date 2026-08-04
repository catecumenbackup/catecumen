-- scripts/directorio-afiliados.sql
-- Buscador público de PARROQUIAS y DIÓCESIS afiliadas, con geolocalización y
-- búsqueda por cercanía. Expone SOLO datos públicos (nombre, responsable, país,
-- dirección, contacto) — nunca los datos bancarios de las parroquias.
-- Idempotente y re-ejecutable.

-- ── 1) Coordenadas + bandera de aprobación en ambas tablas ──────────────────
alter table public.parroquias add column if not exists lat       double precision;
alter table public.parroquias add column if not exists lng       double precision;
alter table public.parroquias add column if not exists aprobada  boolean not null default false;
alter table public.diocesis  add column if not exists lat       double precision;
alter table public.diocesis  add column if not exists lng       double precision;
alter table public.diocesis  add column if not exists aprobada  boolean not null default false;

-- Índices para filtrar rápido lo aprobado y con coordenadas.
create index if not exists idx_parroquias_geo on public.parroquias (aprobada) where lat is not null;
create index if not exists idx_diocesis_geo   on public.diocesis  (aprobada) where lat is not null;

-- ⚠️ Moderación: por seguridad, una afiliación NO aparece en el directorio
-- público hasta que un admin la apruebe. Para aprobar las existentes de golpe
-- (si ya las revisaste), ejecuta:
--     update public.parroquias set aprobada = true;
--     update public.diocesis  set aprobada = true;

-- ── 2) Búsqueda por CERCANÍA (Haversine, sin PostGIS) ───────────────────────
create or replace function public.buscar_afiliados_cercanos(
  p_lat     double precision,
  p_lng     double precision,
  p_tipo    text    default null,   -- 'parroquia' | 'diocesis' | null (ambas)
  p_radio_km numeric default 300,
  p_limite  int     default 60
) returns table(
  tipo text, nombre text, responsable text, pais text, direccion text,
  email text, telefono text, lat double precision, lng double precision,
  distancia_km numeric
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable, p.pais,
           p.direccion, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono, p.lat, p.lng
      from public.parroquias p
     where p.aprobada and p.lat is not null and p.lng is not null
       and (p_tipo is null or p_tipo = 'parroquia')
    union all
    select 'diocesis'::text, d.nombre, d.nombre_obispo, d.pais,
           d.direccion, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono), d.lat, d.lng
      from public.diocesis d
     where d.aprobada and d.lat is not null and d.lng is not null
       and (p_tipo is null or p_tipo = 'diocesis')
  ),
  condist as (
    select b.*,
      round((6371 * acos(least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(b.lat))
      ))))::numeric, 1) as distancia_km
    from base b
  )
  select tipo, nombre, responsable, pais, direccion, email, telefono, lat, lng, distancia_km
    from condist
   where distancia_km <= p_radio_km
   order by distancia_km asc
   limit p_limite;
$$;

-- ── 3) Búsqueda por TEXTO (nombre / país / dirección) ───────────────────────
create or replace function public.buscar_afiliados_texto(
  p_q     text,
  p_tipo  text default null,
  p_limite int  default 60
) returns table(
  tipo text, nombre text, responsable text, pais text, direccion text,
  email text, telefono text, lat double precision, lng double precision
)
language sql
security definer
set search_path = public
as $$
  select * from (
    select 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable, p.pais,
           p.direccion, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono, p.lat, p.lng
      from public.parroquias p
     where p.aprobada and (p_tipo is null or p_tipo = 'parroquia')
       and (p_q is null or p_q = '' or
            (p.nombre ilike '%'||p_q||'%' or p.pais ilike '%'||p_q||'%' or coalesce(p.direccion,'') ilike '%'||p_q||'%'))
    union all
    select 'diocesis'::text, d.nombre, d.nombre_obispo, d.pais,
           d.direccion, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono), d.lat, d.lng
      from public.diocesis d
     where d.aprobada and (p_tipo is null or p_tipo = 'diocesis')
       and (p_q is null or p_q = '' or
            (d.nombre ilike '%'||p_q||'%' or d.pais ilike '%'||p_q||'%' or coalesce(d.direccion,'') ilike '%'||p_q||'%'))
  ) s
  order by s.pais, s.nombre
  limit p_limite;
$$;

-- Público: cualquiera (incluso sin sesión) puede consultar el directorio.
grant execute on function public.buscar_afiliados_cercanos(double precision, double precision, text, numeric, int) to anon, authenticated;
grant execute on function public.buscar_afiliados_texto(text, text, int) to anon, authenticated;
