-- ════════════════════════════════════════════════════════════════════════════
--  Accesos por ubicación (país/ciudad) para la estadística del admin.
--  ANÓNIMO: NO guarda la IP ni liga al usuario. El frontend obtiene país/ciudad
--  por geolocalización de IP (fetch a https://ipwho.is/) SOLO si el usuario aceptó
--  cookies de analítica, una vez por sesión, y lo registra con la RPC de abajo.
--  Idempotente. Correr en el SQL Editor de Supabase.
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.accesos_geo (
  id          bigserial primary key,
  pais        text,
  pais_codigo text,
  ciudad      text,
  creado      timestamptz not null default now()
);
alter table public.accesos_geo enable row level security;  -- escritura/lectura solo por las RPC de abajo
create index if not exists idx_accesos_geo_creado on public.accesos_geo(creado desc);

-- Registro público (lo llama el frontend). Descarta entradas sin país.
create or replace function public.registrar_acceso_geo(p_pais text, p_pais_codigo text, p_ciudad text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(btrim(p_pais),'')='' then return; end if;
  insert into accesos_geo(pais, pais_codigo, ciudad)
    values (left(p_pais,80), left(p_pais_codigo,8), nullif(left(btrim(p_ciudad),120),''));
end $$;
grant execute on function public.registrar_acceso_geo(text,text,text) to anon, authenticated;

-- Agregado para el panel: {total, paises:[{pais,codigo,n}], ciudades:[{ciudad,pais,n}]}.
create or replace function public.admin_estadisticas_accesos(p_dias int default 90)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select jsonb_build_object(
    'total', (select count(*) from accesos_geo where creado > now() - make_interval(days=>greatest(1,p_dias))),
    'paises', (select coalesce(jsonb_agg(x),'[]'::jsonb) from (
        select pais, max(pais_codigo) as codigo, count(*)::int as n
        from accesos_geo where creado > now() - make_interval(days=>greatest(1,p_dias)) and pais is not null
        group by pais order by n desc limit 50) x),
    'ciudades', (select coalesce(jsonb_agg(x),'[]'::jsonb) from (
        select ciudad, max(pais) as pais, count(*)::int as n
        from accesos_geo where creado > now() - make_interval(days=>greatest(1,p_dias)) and ciudad is not null
        group by ciudad order by n desc limit 50) x)
  ) into v;
  return v;
end $$;
