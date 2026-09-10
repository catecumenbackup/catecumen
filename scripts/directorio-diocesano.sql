-- scripts/directorio-diocesano.sql
--
-- Suma el DIRECTORIO DIOCESANO al buscador público de afiliados.
--
-- Hasta ahora el buscador mostraba solo organizaciones ya afiliadas
-- (`parroquias` y `diocesis` con aprobada = true). Con esto muestra también las
-- 136 sedes de la Diócesis de Querétaro que están en `directorio_parroquias`,
-- marcadas como NO afiliadas, para que quien busca encuentre su parroquia
-- aunque todavía no tenga convenio — y el embudo quede a la vista.
--
-- Ambas funciones ganan una columna: `afiliada boolean`. El front pinta el
-- marcador verde cuando es true y rojo cuando es false.
--
-- Como cambia el tipo de retorno hay que DROP antes del CREATE; `create or
-- replace` no puede cambiar la forma de la tabla devuelta.
--
-- Requiere: directorio-afiliados.sql, directorio-mx.sql, directorio-flexible.sql
-- y la tabla directorio_parroquias (sql/01_esquema.sql del paquete).
-- Idempotente y re-ejecutable.

-- ── 1) Cercanía ─────────────────────────────────────────────────────────────
drop function if exists public.buscar_afiliados_cercanos(double precision, double precision, text, numeric, int);

create function public.buscar_afiliados_cercanos(
  p_lat      double precision,
  p_lng      double precision,
  p_tipo     text    default null,   -- 'parroquia' | 'diocesis' | null (ambas)
  p_radio_km numeric default 300,
  p_limite   int     default 60
) returns table(
  tipo text, nombre text, responsable text, pais text, direccion text,
  email text, telefono text, lat double precision, lng double precision,
  afiliada boolean, distancia_km numeric
)
language sql security definer set search_path = public
as $$
  with base as (
    select 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable, p.pais,
           p.direccion, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono,
           p.lat, p.lng, true as afiliada
      from public.parroquias p
     where p.aprobada and p.lat is not null and p.lng is not null
       and (p_tipo is null or p_tipo = 'parroquia')
    union all
    select 'diocesis'::text, d.nombre, d.nombre_obispo, d.pais,
           d.direccion, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono), d.lat, d.lng, true
      from public.diocesis d
     where d.aprobada and d.lat is not null and d.lng is not null
       and (p_tipo is null or p_tipo = 'diocesis')
    union all
    -- Directorio diocesano: las que aún no tienen convenio.
    select 'parroquia'::text, dp.nombre, dp.parroco, coalesce(dp.pais, 'México'),
           dp.direccion, dp.email,
           dp.telefono, dp.lat, dp.lng, false
      from public.directorio_parroquias dp
     where dp.activo and dp.lat is not null and dp.lng is not null
       and (p_tipo is null or p_tipo = 'parroquia')
       -- si ya está afiliada, viene de la rama de arriba: no duplicar
       and (dp.parroquia_id is null
            or not exists (select 1 from public.parroquias p
                            where p.id = dp.parroquia_id and p.aprobada))
  ),
  condist as (
    select b.*,
      round((6371 * acos(least(1, greatest(-1,
        cos(radians(p_lat)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(p_lng))
        + sin(radians(p_lat)) * sin(radians(b.lat))
      ))))::numeric, 1) as distancia_km
    from base b
  )
  select tipo, nombre, responsable, pais, direccion, email, telefono, lat, lng,
         afiliada, distancia_km
    from condist
   where distancia_km <= p_radio_km
   -- las afiliadas primero a igual distancia
   order by distancia_km asc, afiliada desc
   limit p_limite;
$$;

grant execute on function public.buscar_afiliados_cercanos(double precision, double precision, text, numeric, int) to anon, authenticated;

-- ── 2) Texto (versión flexible: sin acentos, tokens, tolerante a erratas) ───
drop function if exists public.buscar_afiliados_texto(text, text, text, text, text, int);

create function public.buscar_afiliados_texto(
  p_q         text default null,
  p_tipo      text default null,
  p_pais      text default null,
  p_estado    text default null,
  p_municipio text default null,
  p_limite    int  default 200
) returns table(
  tipo text, nombre text, responsable text, pais text, direccion text,
  email text, telefono text, lat double precision, lng double precision,
  afiliada boolean
)
language sql security definer set search_path = public, extensions
as $$
  with q as (
    select
      nullif(extensions.unaccent(lower(trim(coalesce(p_q,'')))), '')         as qn,
      nullif(extensions.unaccent(lower(trim(coalesce(p_estado,'')))), '')    as est_n,
      nullif(extensions.unaccent(lower(trim(coalesce(p_municipio,'')))), '') as mun_n
  )
  select * from (
    -- ── Parroquias afiliadas ────────────────────────────────────────────────
    select 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable, p.pais,
           p.direccion, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono,
           p.lat, p.lng, true as afiliada
      from public.parroquias p
      cross join q
      cross join lateral (select extensions.unaccent(lower(concat_ws(' ',
           p.nombre, p.pais, p.direccion, p.estado, p.municipio))) as hay) h
     where p.aprobada and (p_tipo is null or p_tipo = 'parroquia')
       and (p_pais is null or p_pais = '' or p.pais ilike p_pais)
       and (q.est_n is null or h.hay like '%'||q.est_n||'%')
       and (q.mun_n is null or h.hay like '%'||q.mun_n||'%')
       and (q.qn is null
         or (select bool_and(h.hay like '%'||t||'%')
               from unnest(regexp_split_to_array(q.qn, '\s+')) t where t <> '')
         or (length(q.qn) >= 4 and extensions.word_similarity(q.qn, h.hay) > 0.35))
    union all
    -- ── Diócesis afiliadas ──────────────────────────────────────────────────
    select 'diocesis'::text, d.nombre, d.nombre_obispo, d.pais,
           d.direccion, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono), d.lat, d.lng, true
      from public.diocesis d
      cross join q
      cross join lateral (select extensions.unaccent(lower(concat_ws(' ',
           d.nombre, d.pais, d.direccion, d.estado, d.municipio))) as hay) h
     where d.aprobada and (p_tipo is null or p_tipo = 'diocesis')
       and (p_pais is null or p_pais = '' or d.pais ilike p_pais)
       and (q.est_n is null or h.hay like '%'||q.est_n||'%')
       and (q.mun_n is null or h.hay like '%'||q.mun_n||'%')
       and (q.qn is null
         or (select bool_and(h.hay like '%'||t||'%')
               from unnest(regexp_split_to_array(q.qn, '\s+')) t where t <> '')
         or (length(q.qn) >= 4 and extensions.word_similarity(q.qn, h.hay) > 0.35))
    union all
    -- ── Directorio diocesano: aún sin convenio ──────────────────────────────
    select 'parroquia'::text, dp.nombre, dp.parroco, coalesce(dp.pais, 'México'),
           dp.direccion, dp.email, dp.telefono, dp.lat, dp.lng, false
      from public.directorio_parroquias dp
      cross join q
      cross join lateral (select extensions.unaccent(lower(concat_ws(' ',
           dp.nombre, coalesce(dp.pais,'México'), dp.direccion, dp.estado,
           dp.municipio, dp.decanato, dp.parroco))) as hay) h
     where dp.activo and (p_tipo is null or p_tipo = 'parroquia')
       and (dp.parroquia_id is null
            or not exists (select 1 from public.parroquias p
                            where p.id = dp.parroquia_id and p.aprobada))
       and (p_pais is null or p_pais = '' or coalesce(dp.pais,'México') ilike p_pais)
       and (q.est_n is null or h.hay like '%'||q.est_n||'%')
       and (q.mun_n is null or h.hay like '%'||q.mun_n||'%')
       and (q.qn is null
         or (select bool_and(h.hay like '%'||t||'%')
               from unnest(regexp_split_to_array(q.qn, '\s+')) t where t <> '')
         or (length(q.qn) >= 4 and extensions.word_similarity(q.qn, h.hay) > 0.35))
  ) s
  -- las afiliadas primero; el resto por país y nombre
  order by s.afiliada desc, s.pais, s.nombre
  limit p_limite;
$$;

grant execute on function public.buscar_afiliados_texto(text, text, text, text, text, int) to anon, authenticated;

-- ── Comprobación ────────────────────────────────────────────────────────────
-- No usa RPC protegida por es_admin(), así que no puede revertir el script.
--
-- Las DOS filas deben decir tiene_afiliada = true. Si el script llegó hasta
-- aquí sin error, quedó instalado.
select p.proname                                          as funcion,
       pg_get_function_result(p.oid) like '%afiliada%'     as tiene_afiliada
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and p.proname in ('buscar_afiliados_texto','buscar_afiliados_cercanos')
   and pg_get_function_arguments(p.oid) like '%p_limite%'
 order by 1;
