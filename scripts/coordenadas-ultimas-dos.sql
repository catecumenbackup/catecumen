-- scripts/coordenadas-ultimas-dos.sql
--
-- Cierra los dos últimos huecos de coordenada del directorio diocesano.
-- Ambas las tomó Enyoria a mano sobre el mapa el 10-sep-2026, sobre el techo
-- del templo, así que van como 'templo' y sin marca de revisión.
--
-- Con esto las 136 fichas del directorio quedan localizadas.
--
-- Idempotente: solo escribe donde lat está vacío.

begin;

update public.directorio_parroquias d
   set lat = v.lat, lng = v.lng,
       geo_precision = 'templo',
       geo_revisar   = false,
       estado_dato   = 'coordenada tomada a mano sobre el mapa el 2026-09-10 (no hay pin publicado de este templo en ninguna fuente)',
       updated_at    = now()
  from (values
  -- Anillo Vial III Km 4+188.5, El Marqués. Cae a 6.9 km al noreste del centro
  -- de Querétaro, sobre el trazo del Anillo Vial — coherente con la dirección.
  ('parroquia-el-senor-de-la-misericordia', 20.612662, -100.328985),
  -- Rancho Viejo (Espíritu Santo), Victoria, Gto. Cae a 37.9 km de la cabecera
  -- municipal, dentro de la Sierra Gorda guanajuatense que atiende la Diócesis
  -- de Querétaro (decanato Nuestra Señora de los Remedios). Ver la nota final.
  ('parroquia-del-espiritu-santo-rancho-viejo', 21.546243, -100.161067)
) as v(id, lat, lng)
 where d.id = v.id and d.lat is null;

-- Comprobación. Esperado: sin_coordenada = 0.
select count(*)                                                as total,
       count(*) filter (where lat is null)                     as sin_coordenada,
       count(*) filter (where geo_precision = 'templo')        as pin_de_templo,
       count(*) filter (where geo_precision = 'localidad')     as pin_de_localidad,
       count(*) filter (where geo_revisar)                     as por_revisar,
       count(*) filter (where parroco is null or parroco = '') as sin_parroco
  from public.directorio_parroquias
 where activo;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- UNA DISCREPANCIA QUE CONVIENE DEJAR ANOTADA, no corregida
--
-- El pin de Rancho Viejo queda a 37.9 km de la cabecera de Victoria, Gto.,
-- hacia el NORTE. La ficha de pueblosamerica describe esa localidad como
-- situada a 37.3 km de la cabecera pero al SUR.
--
-- La distancia coincide casi exactamente; el rumbo no. Lo más probable es que
-- el rumbo de esa ficha esté mal, sobre todo porque la porción de Guanajuato
-- que atiende la Diócesis de Querétaro es la Sierra Gorda, al norte. Y una
-- coordenada leída en el mapa por quien busca el templo vale más que el texto
-- de un directorio de localidades.
--
-- Se deja el pin. Si algún día alguien reporta que la parroquia no está ahí,
-- este comentario explica por dónde empezar a buscar.
