-- scripts/completar-directorio-diocesano.sql
--
-- Completa los huecos del directorio de la Diócesis de Querétaro con datos
-- que NO publica el sitio de la diócesis. Salieron de tres sitios:
--
--   · cancilleriadiocesisqro.org  — su directorio por decanato SÍ trae el
--     correo parroquial; es más completo que el de diocesisqro.org. Es la
--     fuente de la mayoría de los correos de abajo.
--   · el DENUE del INEGI, republicado en directorios comerciales — coordenada
--     levantada en campo del establecimiento, no geocodificación.
--   · OpenStreetMap y GCatholic — pines de templos ya cartografiados, y Plus
--     Codes publicados para las misiones franciscanas.
--
-- NADA se geocodificó: todas las coordenadas son un pin publicado de un
-- objeto real. Se respeta la regla del proyecto —un hueco antes que un pin
-- falso— con una distinción explícita en `geo_precision`:
--
--   'templo'    el pin es del edificio. 37 fichas.
--   'localidad' no hay templo cartografiado; es el centro de la localidad,
--               a unos cientos de metros. Quedan con geo_revisar = true.
--               12 fichas.
--
-- Idempotente: solo escribe donde el campo está vacío, así que volver a
-- correrlo no pisa correcciones hechas a mano después.

begin;

-- ── Coordenadas ─────────────────────────────────────────────────────────────
update public.directorio_parroquias d
   set lat = v.lat, lng = v.lng,
       geo_precision = v.prec,
       geo_revisar   = (v.prec <> 'templo'),
       updated_at    = now()
  from (values
  ('parroquia-del-sagrado-corazon-de-jesus-templo-de-santa-clara', 20.592031, -100.394517, 'templo'),   -- Parroquia del Sagrado Corazón de Jesús (Templo de Sa
  ('parroquia-del-misterio-de-pentecostes', 20.583104, -100.374119, 'templo'),   -- Parroquia del Misterio de Pentecostés
  ('parroquia-de-san-isidro-labrador', 20.598688, -100.376679, 'templo'),   -- Parroquia de San Isidro Labrador
  ('parroquia-de-nuestra-senora-de-san-juan-de-los-lagos', 20.572954, -100.386798, 'templo'),   -- Parroquia de Nuestra Señora de San Juan de los Lagos
  ('parroquia-de-nuestra-senora-de-guadalupe', 20.558914, -100.397258, 'templo'),   -- Parroquia de Nuestra Señora de Guadalupe
  ('parroquia-de-la-resurreccion-del-senor', 20.6037389, -100.3967948, 'templo'),   -- Parroquia de la Resurrección del Señor
  ('parroquia-san-jose', 20.6549548, -100.3820846, 'templo'),   -- Parroquia San José
  ('parroquia-de-san-felipe-de-jesus', 20.7663041, -100.3351289, 'templo'),   -- Parroquia de San Felipe de Jesús
  ('parroquia-de-san-miguel-arcangel', 20.60613, -100.42862, 'templo'),   -- Parroquia de San Miguel Arcángel
  ('parroquia-de-santa-maria-magdalena', 20.5979669, -100.4478677, 'templo'),   -- Parroquia de Santa María Magdalena
  ('parroquia-de-la-divina-providencia', 20.6261767, -100.4450664, 'templo'),   -- Parroquia de la Divina Providencia
  ('parroquia-de-la-sagrada-familia', 20.5715151, -100.4122606, 'templo'),   -- Parroquia de la Sagrada Familia
  ('parroquia-nuestra-senora-del-rosario', 20.4029257, -100.4216473, 'templo'),   -- Parroquia Nuestra Señora del Rosario
  ('parroquia-nuestra-senora-de-fatima', 20.5564897, -100.4142155, 'templo'),   -- Parroquia Nuestra Señora de Fátima
  ('parroquia-del-senor-de-la-piedad', 20.6770393, -100.4581710, 'templo'),   -- Parroquia del Señor de la Piedad
  ('parroquia-el-sagrado-corazon-de-jesus-puerto-de-aguirre', 20.8080381, -100.4295591, 'templo'),   -- Parroquia El Sagrado Corazón de Jesús (Puerto de Agu
  ('parroquia-de-san-miguel-arcangel-huimilpan', 20.3755460, -100.2744436, 'templo'),   -- Parroquia de San Miguel Arcángel (Huimilpan)
  ('santuario-de-la-preciosa-sangre-de-nuestro-senor-jesucristo', 20.1846875, -100.1679375, 'templo'),   -- Santuario de la Preciosa Sangre de Nuestro Señor Jes
  ('parroquia-de-san-pedro-san-pedro-ahuacatlan', 20.4349600, -99.9845200, 'templo'),   -- Parroquia de San Pedro (San Pedro Ahuacatlán)
  ('parroquia-santa-maria-de-guadalupe-pedro-escobedo', 20.5016814, -100.1444160, 'templo'),   -- Parroquia Santa María de Guadalupe (Pedro Escobedo)
  ('parroquia-de-san-jose-san-jose-galindo', 20.3970811, -100.0986797, 'templo'),   -- Parroquia de San José (San José Galindo)
  ('parroquia-del-santo-nino-de-praga', 20.4885547, -100.1865625, 'templo'),   -- Parroquia del Santo Niño de Praga
  ('parroquia-de-nuestra-senora-de-guadalupe-la-estancia', 20.4215777, -100.0686777, 'templo'),   -- Parroquia de Nuestra Señora de Guadalupe (La Estanci
  ('parroquia-de-san-jose-fuentezuelas', 20.5542953, -99.9804234, 'templo'),   -- Parroquia de San José (Fuentezuelas)
  ('parroquia-juan-pablo-ii', 20.3723725, -99.9135253, 'templo'),   -- Parroquia Juan Pablo II
  ('parroquia-cristo-rey-nuevo-espiritu', 20.4065425, -100.0163081, 'templo'),   -- Parroquia Cristo Rey (Nuevo Espíritu)
  ('parroquia-de-santiago-apostol-jalpan', 21.216680, -99.473892, 'templo'),   -- Parroquia de Santiago Apóstol (Jalpan)
  ('parroquia-de-nuestra-senora-de-la-luz-tancoyol', 21.399425, -99.329454, 'templo'),   -- Parroquia de Nuestra Señora de la Luz (Tancoyol)
  ('parroquia-de-la-purisima-concepcion-purisima-de-arista', 21.3106758, -99.5107407, 'templo'),   -- Parroquia de la Purísima Concepción (Purísima de Ari
  ('parroquia-de-santa-maria-de-guadalupe-ahuacatlan', 21.2145737, -99.5402565, 'templo'),   -- Parroquia de Santa María de Guadalupe (Ahuacatlán)
  ('parroquia-de-san-pedro-toliman', 20.9090695, -99.9305894, 'templo'),   -- Parroquia de San Pedro (Tolimán)
  ('parroquia-de-san-francisco-de-asis-tilaco', 21.163937, -99.191563, 'templo'),   -- Parroquia de San Francisco de Asís (Tilaco)
  ('parroquia-el-divino-salvador-doctor-mora', 21.1427092, -100.3177510, 'templo'),   -- Parroquia El Divino Salvador (Doctor Mora)
  ('parroquia-de-san-jose-san-jose-iturbide', 20.9993225, -100.3848581, 'templo'),   -- Parroquia de San José (San José Iturbide)
  ('parroquia-de-san-juan-bautista-victoria', 21.2118234, -100.2161079, 'templo'),   -- Parroquia de San Juan Bautista (Victoria)
  ('parroquia-de-san-francisco-de-asis-xichu', 21.2985764, -100.0593522, 'templo'),   -- Parroquia de San Francisco de Asís (Xichú)
  ('parroquia-de-santa-catarina', 21.1394499, -100.0664587, 'templo'),   -- Parroquia de Santa Catarina
  ('parroquia-beato-juan-diego', 20.8613889, -100.4188889, 'localidad'),   -- Parroquia Beato Juan Diego
  ('parroquia-de-santa-maria-amealco', 20.1878975, -100.1447470, 'localidad'),   -- Parroquia de Santa María (Amealco)
  ('parroquia-del-sagrado-corazon-lagunillas', 20.4615500, -100.2944400, 'localidad'),   -- Parroquia del Sagrado Corazón (Lagunillas)
  ('parroquia-de-san-antonio-de-padua-el-doctor', 20.85047, -99.58827, 'localidad'),   -- Parroquia de San Antonio de Padua (El Doctor)
  ('parroquia-de-nuestra-senora-de-los-dolores-maconi', 20.83456, -99.53349, 'localidad'),   -- Parroquia de Nuestra Señora de los Dolores (Maconí)
  ('parroquia-de-san-miguel-villa-progreso', 20.640445, -99.841293, 'localidad'),   -- Parroquia de San Miguel (Villa Progreso)
  ('parroquia-del-sagrado-corazon-el-zamorano', 20.80778, -100.11863, 'localidad'),   -- Parroquia del Sagrado Corazón (El Zamorano)
  ('parroquia-de-san-pedro-san-pedro-escanela', 21.12376, -99.52836, 'localidad'),   -- Parroquia de San Pedro (San Pedro Escanela)
  ('parroquia-de-santa-teresita-del-nino-jesus-la-florida', 21.4161425, -99.7361666, 'localidad'),   -- Parroquia de Santa Teresita del Niño Jesús (La Flori
  ('parroquia-de-san-miguel-san-miguel-palmas', 21.1002852, -99.9655698, 'localidad'),   -- Parroquia de San Miguel (San Miguel Palmas)
  ('parroquia-de-jesus-maria-atarjea', 21.2678289, -99.7191238, 'localidad'),   -- Parroquia de Jesús María (Atarjea)
  ('parroquia-de-nuestra-senora-del-carmen-el-galomo', 21.0582970, -100.4324821, 'localidad')   -- Parroquia de Nuestra Señora del Carmen (El Galomo)
) as v(id, lat, lng, prec)
 where d.id = v.id and d.lat is null;

-- ── Correos ─────────────────────────────────────────────────────────────────
update public.directorio_parroquias d
   set email = v.email, updated_at = now()
  from (values
  ('parroquia-de-nuestra-senora-del-rosario-del-rayo', 'elrayitoqro@hotmail.com'),   -- Parroquia de Nuestra Señora del Rosario del Ra
  ('parroquia-de-nuestra-senora-del-rosario-y-san-martin-caballe', 'san_martin_caballeroqro@outlook.com'),   -- Parroquia de Nuestra Señora del Rosario y San
  ('parroquia-san-pedro-apostol', 'psp_pedro1995@hotmail.com'),   -- Parroquia San Pedro Apóstol
  ('parroquia-de-la-purisima-concepcion', 'parroquiadelapurisimahercules@hotmail.com'),   -- Parroquia de la Purísima Concepción
  ('parroquia-de-santa-teresa-del-nino-jesus', 'pstateresadelninojesus@hotmail.com'),   -- Parroquia de Santa Teresa del Niño Jesús
  ('templo-de-san-judas-tadeo', 'pstateresadelninojesus@hotmail.com'),   -- Templo de San Judas Tadeo
  ('templo-de-nuestra-senora-de-guadalupe-salud-de-los-enfermos', 'pstateresadelninojesus@hotmail.com'),   -- Templo de Nuestra Señora de Guadalupe Salud de
  ('parroquia-misterio-de-la-encarnacion-del-hijo-de-dios', 'parroquia_lomabonita@hotmail.com'),   -- Parroquia Misterio de la Encarnación del Hijo
  ('parroquia-de-nuestra-senora-de-la-paz', 'ntrasradelapaz.satelite@gmail.com'),   -- Parroquia de Nuestra Señora de la Paz
  ('parroquia-de-san-miguel-arcangel', 'sanmiguelcarrillo@hotmail.com'),   -- Parroquia de San Miguel Arcángel
  ('parroquia-de-san-isidro-labrador', 'parroquiasanisidroqro@gmail.com'),   -- Parroquia de San Isidro Labrador
  ('parroquia-maria-madre-de-la-iglesia', 'mariamadre@prodigy.net.mx'),   -- Parroquia María Madre de la Iglesia
  ('parroquia-el-sagrado-corazon-de-jesus-puerto-de-aguirre', 'parroquiascpa@gmail.com'),   -- Parroquia El Sagrado Corazón de Jesús (Puerto
  ('parroquia-de-santa-maria-amealco', 'santamariaamealcoqro@gmail.com'),   -- Parroquia de Santa María (Amealco)
  ('parroquia-de-la-inmaculada-concepcion-la-torre', 'parroquiascpa@gmail.com'),   -- Parroquia de la Inmaculada Concepción (La Torr
  ('parroquia-de-la-natividad-del-senor', 'lanatividadsjr@hotmail.com'),   -- Parroquia de la Natividad del Señor
  ('parroquia-santa-maria-de-la-asuncion-tequisquiapan', 'prqstamatx@hotmail.com'),   -- Parroquia Santa María de la Asunción (Tequisqu
  ('parroquia-de-san-jose-fuentezuelas', 'sanjosefuentezuelas2011@gmail.com'),   -- Parroquia de San José (Fuentezuelas)
  ('parroquia-de-santa-maria-de-guadalupe-el-palmar', 'santamariadelpalmar@yahoo.com.mx'),   -- Parroquia de Santa María de Guadalupe (El Palm
  ('parroquia-de-san-pedro-toliman', 'sanpedrotoliman@gmail.com'),   -- Parroquia de San Pedro (Tolimán)
  ('parroquia-de-san-miguel-villa-progreso', 'sanmiguel_villaprogreso@hotmail.com'),   -- Parroquia de San Miguel (Villa Progreso)
  ('parroquia-del-sagrado-corazon-el-zamorano', 'scj.zamorano@gmail.com'),   -- Parroquia del Sagrado Corazón (El Zamorano)
  ('parroquia-de-nuestra-senora-de-la-luz-tancoyol', 'pfacturatancoyol@yahoo.com.mx'),   -- Parroquia de Nuestra Señora de la Luz (Tancoyo
  ('parroquia-el-divino-salvador-doctor-mora', 'p.divinosalvador_drmora@hotmail.com'),   -- Parroquia El Divino Salvador (Doctor Mora)
  ('parroquia-de-san-juan-bautista-victoria', 'parroquiasanjuanb2406@hotmail.com')   -- Parroquia de San Juan Bautista (Victoria)
) as v(id, email)
 where d.id = v.id and (d.email is null or d.email = '');

-- ── Comprobación ────────────────────────────────────────────────────────────
select count(*)                                              as total,
       count(*) filter (where lat is not null)                as con_coordenada,
       count(*) filter (where geo_precision = 'templo')       as pin_de_templo,
       count(*) filter (where geo_precision = 'localidad')    as pin_de_localidad,
       count(*) filter (where email is not null and email <> '') as con_correo
  from public.directorio_parroquias;

commit;
