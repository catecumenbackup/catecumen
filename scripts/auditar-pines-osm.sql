-- scripts/auditar-pines-osm.sql
--
-- Auditoría de los pines del directorio. Solo LEE, no modifica nada.
--
-- Busca la forma en que falla el emparejamiento por parecido de nombre contra
-- OpenStreetMap: no deja la coordenada vacía —eso se vería— sino que deja UNA
-- coordenada plausible, la del templo equivocado. Dos síntomas la delatan:
--
--   A) El pin cae LEJOS del resto de las parroquias de su mismo municipio.
--   B) Dos parroquias distintas quedan casi encima una de otra.
--
-- El control no necesita ninguna fuente externa: usa como referencia el propio
-- directorio. El centroide de cada municipio se calcula EXCLUYENDO la ficha que
-- se está midiendo, para que un pin muy desviado no arrastre su propia vara.
--
-- Cómo leerlo: un valor alto no prueba que el pin esté mal —hay municipios
-- enormes, como Landa de Matamoros o Cadereyta— pero sí dice por dónde empezar
-- a mirar. Compara siempre contra la columna `fichas_del_municipio`: una
-- distancia de 20 km entre 2 fichas dice poco; entre 30, dice bastante.

with p as (
  select id, nombre, municipio, geo_fuente, geo_precision, lat, lng
    from public.directorio_parroquias
   where activo and lat is not null and lng is not null
),
-- Centroide del municipio sin contar la propia ficha.
con_centro as (
  select p.*,
         count(*)      over w                       as n_muni,
         (sum(lat)     over w - lat)
           / nullif(count(*) over w - 1, 0)         as c_lat,
         (sum(lng)     over w - lng)
           / nullif(count(*) over w - 1, 0)         as c_lng
    from p
  window w as (partition by municipio)
),
-- A) Distancia de cada ficha al centro de su municipio.
lejanas as (
  select 'A · lejos de su municipio'::text as chequeo,
         c.nombre,
         c.municipio,
         c.geo_fuente,
         c.n_muni                                   as fichas_del_municipio,
         round((6371 * acos(least(1, greatest(-1,
             cos(radians(c.lat)) * cos(radians(c.c_lat))
               * cos(radians(c.c_lng) - radians(c.lng))
           + sin(radians(c.lat)) * sin(radians(c.c_lat))
         ))))::numeric, 1)                          as km,
         null::text                                 as con_quien
    from con_centro c
   where c.c_lat is not null
),
-- B) Parejas de fichas a menos de 150 m una de otra.
pegadas as (
  select 'B · casi encima de otra'::text,
         a.nombre,
         a.municipio,
         a.geo_fuente,
         null::bigint,
         round((6371000 * acos(least(1, greatest(-1,
             cos(radians(a.lat)) * cos(radians(b.lat))
               * cos(radians(b.lng) - radians(a.lng))
           + sin(radians(a.lat)) * sin(radians(b.lat))
         ))))::numeric, 0)                          as km,   -- aquí son METROS
         b.nombre
    from p a
    join p b
      on a.id < b.id
     and (6371000 * acos(least(1, greatest(-1,
             cos(radians(a.lat)) * cos(radians(b.lat))
               * cos(radians(b.lng) - radians(a.lng))
           + sin(radians(a.lat)) * sin(radians(b.lat))
         )))) < 150
)
select * from (
  select * from lejanas where km > 12          -- umbral flojo a propósito
  union all
  select * from pegadas
) s
order by chequeo, km desc;
