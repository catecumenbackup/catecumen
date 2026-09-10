-- scripts/normalizar-geo-precision.sql
--
-- Unifica el vocabulario de `geo_precision`, que hoy mezcla tres jergas según
-- qué script escribió cada fila:
--
--   templo                38   nuestra curación manual, sep-2026
--   denue_inegi           30   ficha del DENUE emparejada por NOMBRE
--   denue_inegi_dir       23   ficha del DENUE emparejada por DIRECCIÓN
--   localidad             18   nuestra curación manual, sep-2026
--   place_of_worship      15   nodo de OpenStreetMap
--   osm_place_of_worship  11   nodo de OpenStreetMap
--   church                 1   nodo de OpenStreetMap
--                        ───
--                        136
--
-- El problema no es cosmético: la columna mezcla DOS PREGUNTAS distintas.
--   · ¿Qué clase de objeto es el pin?  (el edificio, o el centro del pueblo)
--   · ¿De dónde salió y cómo se emparejó?
-- Meterlas en una sola columna obliga a conocer la historia de cada script
-- para leer el dato, que es justo lo que pasó hoy.
--
-- La separamos:
--   geo_precision  → qué es el pin.     'templo' | 'localidad'
--   geo_fuente     → de dónde salió.    columna nueva, conserva el origen
--
-- Nada se pierde: el valor viejo se guarda en geo_fuente antes de tocar nada.
-- Ninguna coordenada se mueve. Idempotente.

begin;

-- ── 1 · Columna nueva ──────────────────────────────────────────────────────
alter table public.directorio_parroquias
  add column if not exists geo_fuente text;

comment on column public.directorio_parroquias.geo_fuente is
  'De dónde salió la coordenada: denue_nombre | denue_direccion | osm | curacion_manual. Complementa geo_precision, que dice QUÉ es el pin, no de dónde viene.';
comment on column public.directorio_parroquias.geo_precision is
  'Qué representa el pin: templo = el edificio o establecimiento; localidad = el centro del pueblo o de la colonia, a cientos de metros. Ver geo_fuente para el origen.';

-- ── 2 · Guarda el origen ANTES de normalizar ───────────────────────────────
update public.directorio_parroquias
   set geo_fuente = case geo_precision
                      when 'denue_inegi'          then 'denue_nombre'
                      when 'denue_inegi_dir'      then 'denue_direccion'
                      when 'place_of_worship'     then 'osm'
                      when 'osm_place_of_worship' then 'osm'
                      when 'church'               then 'osm'
                      when 'templo'               then 'curacion_manual'
                      when 'localidad'            then 'curacion_manual'
                    end
 where geo_precision is not null
   and geo_fuente is null;

-- ── 3 · Normaliza el vocabulario ───────────────────────────────────────────
-- Todo lo que apunta a un edificio o establecimiento pasa a 'templo':
--   · DENUE — coordenada levantada en campo por el INEGI en el domicilio.
--   · OSM   — nodo de un templo cartografiado.
-- 'localidad' se queda como está.
update public.directorio_parroquias
   set geo_precision = 'templo',
       updated_at    = now()
 where geo_precision in ('denue_inegi', 'denue_inegi_dir',
                         'place_of_worship', 'osm_place_of_worship', 'church');

-- ── 4 · Candado para que no vuelva a pasar ─────────────────────────────────
-- Sin esto, el próximo script que escriba 'ROOFTOP' o 'amenity=church' vuelve
-- a fracturar el vocabulario y nadie se entera hasta meses después.
-- Si algún día necesitas un valor nuevo, añádelo aquí a propósito — o quita el
-- candado con:  alter table public.directorio_parroquias drop constraint geo_precision_valida;
alter table public.directorio_parroquias
  drop constraint if exists geo_precision_valida;
alter table public.directorio_parroquias
  add constraint geo_precision_valida
  check (geo_precision is null or geo_precision in ('templo', 'localidad'));

-- ── 5 · Comprobación ───────────────────────────────────────────────────────
-- Esperado: templo 118 · localidad 18. Y por fuente: denue_nombre 30,
-- denue_direccion 23, osm 27, curacion_manual 56.
select coalesce(geo_precision, '(nulo)') as geo_precision,
       coalesce(geo_fuente,   '(nulo)') as geo_fuente,
       count(*)                          as fichas,
       count(*) filter (where geo_revisar) as por_revisar
  from public.directorio_parroquias
 where activo
 group by 1, 2
 order by 1, 3 desc;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- LO QUE ESTO NO ARREGLA, Y CONVIENE SABER
--
-- Los 27 pines de OSM se emparejaron por PARECIDO DE NOMBRE, y ese método
-- falla de una forma silenciosa: le asigna el mismo templo a dos parroquias de
-- nombre parecido. El archivo `parroquias_geo_osm.sql` que quedó en la raíz del
-- repo contiene ejemplos reales de ese fallo —«Nuestra Señora de Guadalupe» y
-- «...de Guadalupe (El Colorado)» con coordenada IDÉNTICA, estando a 20 km una
-- de otra— y por fortuna nunca se ejecutó: hoy la base tiene 0 coordenadas
-- repetidas.
--
-- Pero los 27 que SÍ entraron salieron del mismo método. Que no haya duplicados
-- no prueba que cada uno esté en su templo; solo que no chocan entre sí. El
-- control que falta es comparar cada pin con el municipio declarado en su
-- ficha. Si quieres, se hace y se revisan solo los que discrepen.
