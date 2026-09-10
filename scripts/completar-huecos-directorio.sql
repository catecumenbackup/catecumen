-- scripts/completar-huecos-directorio.sql
--
-- Cierra los últimos huecos del directorio diocesano: las 10 parroquias sin
-- coordenada y las que quedaron sin párroco.
--
-- CÓMO SE OBTUVO CADA DATO
-- Nada se geocodificó. Cada coordenada es un objeto publicado que se verificó
-- uno por uno: se abrió la ficha de la fuente y se comprobó que el NOMBRE y el
-- MUNICIPIO coincidieran con los de nuestro registro. Ese control descartó un
-- pin (ver el bloque de rechazos al final).
--
--   'templo'    el pin es del establecimiento. Direcciones corroboradas contra
--               la que ya teníamos en la base. 3 fichas.
--   'localidad' no hay templo cartografiado; es el centro del pueblo o de la
--               colonia, a cientos de metros. Quedan con geo_revisar = true.
--               7 fichas.
--
-- Idempotente: solo escribe donde el campo está vacío.

begin;

-- ── Coordenadas de establecimiento (el pin es el edificio) ──────────────────
update public.directorio_parroquias d
   set lat = v.lat, lng = v.lng,
       geo_precision = 'templo',
       geo_revisar   = false,
       updated_at    = now()
  from (values
  -- Calle Margarita Maza de Juárez, Col. Buenavista — coincide con la dirección
  -- que ya teníamos. Fuente: mexicoo.mx/parroquia-san-jose-buenavista-3605220
  ('parroquia-de-san-jose-san-jose-buenavista', 20.819889, -100.467515),
  -- Xocoyotzin 209, Col. Azteca — teníamos el Nº 208, misma cuadra.
  -- Fuente: buscarmisas.com.mx/queretaro/santiago-de-queretaro/templo-cristo-de-la-montana/
  ('templo-cristo-de-la-montana', 20.558919, -100.384043),
  -- Calle Marqués de Cadereyta, Col. Lomas del Marqués — coincide.
  -- Fuente: mexicoo.mx/templo-de-san-judas-tadeo-3609090
  ('templo-de-san-judas-tadeo', 20.608328, -100.366112)
) as v(id, lat, lng)
 where d.id = v.id and d.lat is null;

-- ── Coordenadas de localidad (centro del pueblo o de la colonia) ────────────
-- Cada nodo se verificó: nombre y municipio coinciden con el registro.
update public.directorio_parroquias d
   set lat = v.lat, lng = v.lng,
       geo_precision = 'localidad',
       geo_revisar   = true,
       updated_at    = now()
  from (values
  -- «San Nicolás de la Torre», alias «La Torre», Amealco, 1 060 hab.
  ('parroquia-de-la-inmaculada-concepcion-la-torre', 20.078056, -100.101389),
  -- «General Lázaro Cárdenas (El Colorado)», El Marqués, 4 320 hab.
  ('parroquia-de-nuestra-senora-de-guadalupe-el-colorado', 20.563170, -100.245240),
  -- «Amazcala», El Marqués, 5 770 hab.
  ('parroquia-de-san-alfonso-maria-de-ligorio', 20.700820, -100.261600),
  -- «Agua Zarca», Landa de Matamoros, 1 310 hab.
  ('parroquia-del-inmaculado-corazon-de-maria-agua-zarca', 21.218056, -99.094722),
  -- «Satélite», barrio de Santiago de Querétaro — la ficha dice Col. Satélite.
  ('parroquia-de-nuestra-senora-de-la-paz', 20.640075, -100.449993),
  -- «El Salitre», colonia de Santiago de Querétaro, 4 410 hab.
  ('parroquia-santa-ana', 20.666460, -100.421790),
  -- «Santa Lucía», San Juan del Río, 784 hab.
  ('parroquia-de-santa-lucia', 20.315040, -100.058710)
) as v(id, lat, lng)
 where d.id = v.id and d.lat is null;

-- ── Párrocos ───────────────────────────────────────────────────────────────
-- Solo se escriben donde el campo está vacío. Fuentes: los directorios por
-- decanato de diocesisqro.org y cancilleriadiocesisqro.org.
--
-- NO se incluye la Parroquia de Nuestra Señora de la Paz a propósito: tres
-- páginas de la propia diócesis dan tres párrocos distintos para ella, y el
-- más reciente de los tres es el mismo sacerdote que nuestra base ya tiene
-- como párroco de la Esperanza en Colón. Una de las dos está mal y no se
-- resuelve leyendo más páginas. Ver la nota del final.
update public.directorio_parroquias d
   set parroco = v.parroco, updated_at = now()
  from (values
  ('parroquia-de-la-inmaculada-concepcion-la-torre',       'Pbro. Alfonso Muñoz Torres'),
  ('parroquia-de-nuestra-senora-de-guadalupe-el-colorado', 'Pbro. Ezequiel Muñoz García'),
  ('parroquia-de-san-alfonso-maria-de-ligorio',            'Pbro. J. Martín Felipe Reséndiz Salinas'),
  ('parroquia-el-senor-de-la-misericordia',                'Pbro. Noé Rodolfo Castillo Maldonado'),
  ('parroquia-del-inmaculado-corazon-de-maria-agua-zarca', 'Pbro. Lic. Fernando Piña Hernández'),
  ('parroquia-de-san-jose-san-jose-buenavista',            'Pbro. Miguel Cano Nolasco'),
  ('parroquia-de-santa-teresa-del-nino-jesus',             'Pbro. Lic. Francisco Hernández Ramírez'),
  ('parroquia-santa-ana',                                  'Pbro. Javier Francisco Hernández Calvario'),
  ('parroquia-de-santa-lucia',                             'Pbro. Lic. José Guadalupe Reséndiz Mejía'),
  ('parroquia-del-espiritu-santo-rancho-viejo',            'Pbro. Víctor Balderas Jiménez')
) as v(id, parroco)
 where d.id = v.id and (d.parroco is null or d.parroco = '');

-- ── Comprobación ───────────────────────────────────────────────────────────
select count(*)                                                  as total,
       count(*) filter (where lat is null)                       as sin_coordenada,
       count(*) filter (where geo_precision = 'templo')          as pin_de_templo,
       count(*) filter (where geo_precision = 'localidad')       as pin_de_localidad,
       count(*) filter (where parroco is null or parroco = '')   as sin_parroco
  from public.directorio_parroquias
 where activo;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- LO QUE NO SE ESCRIBIÓ, Y POR QUÉ
--
-- 1 · parroquia-de-santa-teresa-del-nino-jesus — PIN RECHAZADO.
--     La búsqueda devolvió un nodo llamado «El Campanario» a 20.617260,
--     -100.348610. Al abrir la ficha resultó ser un caserío de 474 habitantes
--     en el municipio de EL MARQUÉS — no el Fraccionamiento El Campanario de
--     Santiago de Querétaro donde está la parroquia. Mismo nombre, otro lugar,
--     otro municipio. Escribirlo habría puesto un pin plausible y falso.
--     Queda sin coordenada.
--
-- 2 · parroquia-el-senor-de-la-misericordia (Anillo Vial III, El Marqués) —
--     erigida en 2023, sin pin publicado en ninguna fuente.
--
-- 3 · parroquia-del-espiritu-santo-rancho-viejo (Victoria, Gto.) — sin pin
--     publicado.
--
--     Para estas tres: la coordenada exacta se consigue con una llamada a la
--     parroquia, o abriendo la dirección en Google Maps y copiando el pin.
--
-- 4 · El párroco de la Parroquia de Nuestra Señora de la Paz (Col. Satélite).
--     Tres fuentes de la diócesis, tres nombres:
--       · diocesisqro.org, directorio decanal ... Pbro. Bernardo Reséndiz Vizcaya (2022)
--       · cancilleriadiocesisqro.org, decanato .. Pbro. José Rodrigo López Cepeda (sin fecha)
--       · cancilleriadiocesisqro.org, ficha ..... Pbro. Lic. Iván García Avendaño (10/03/2025)
--     El tercero es el más reciente, PERO es el mismo sacerdote que esta base
--     ya registra como párroco de la Parroquia de Nuestra Señora de la
--     Esperanza (Esperanza), en Colón. Un párroco no lleva dos parroquias en
--     ciudades distintas, así que uno de los dos registros está desactualizado.
--     Se deja el campo vacío hasta confirmarlo por teléfono con la Curia
--     (442 224 0738). Cuando lo tengas:
--
--       update public.directorio_parroquias
--          set parroco = '<nombre confirmado>',
--              estado_dato = 'párroco confirmado por teléfono el <fecha>',
--              updated_at = now()
--        where id = 'parroquia-de-nuestra-senora-de-la-paz';
