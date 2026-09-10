-- scripts/parroco-cristo-de-la-montana.sql
--
-- Último hueco de párroco que se pudo cerrar con fuente.
--
-- El Templo Cristo de la Montaña NO es parroquia: es un templo FILIAL de la
-- Parroquia de Nuestra Señora de Lourdes, decanato de Santa Ana. Por eso no
-- tiene párroco propio y el campo estaba vacío. Lo que va aquí es el párroco
-- de la parroquia de la que depende — que es el dato que le sirve a quien
-- busca a quién dirigirse.
--
-- Fuente: directorio del decanato de Santa Ana en diocesisqro.org, que lista
-- la Parroquia de Nuestra Señora de Lourdes con el Pbro. Julio César Olvera
-- Martínez y menciona el templo Cristo de la Montaña, Col. Azteca, dentro del
-- decanato. El directorio de oficinaparroquial.com da otro nombre para esa
-- parroquia (Pbro. Francisco Gavidia Arteaga); se prefiere el sitio de la
-- propia diócesis.
--
-- Idempotente.

begin;

update public.directorio_parroquias
   set parroco     = 'Pbro. Julio César Olvera Martínez',
       estado_dato = 'templo filial de la Parroquia de Nuestra Señora de Lourdes (decanato de Santa Ana); el sacerdote es el párroco de esa parroquia, no de este templo',
       updated_at  = now()
 where id = 'templo-cristo-de-la-montana'
   and (parroco is null or parroco = '');

select id, nombre, parroco, estado_dato
  from public.directorio_parroquias
 where id = 'templo-cristo-de-la-montana';

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- LOS TRES QUE SIGUEN ABIERTOS, Y QUÉ HACE FALTA PARA CERRARLOS
--
-- 1 · templo-de-san-judas-tadeo — sin párroco.
--     CUIDADO con el parecido: el directorio de oficinaparroquial.com tiene una
--     «Parroquia de San Judas Tadeo y de la Santa Cruz» con el Pbro. Dr. Rubén
--     Cabrera López, pero está en Blvd. Universitario s/n, JURIQUILLA — es otro
--     templo, a más de 10 km. No lo uses.
--     De paso: las fuentes discrepan sobre el municipio de este templo. Nuestra
--     ficha dice Querétaro y C.P. 76144; dondehaymisa lo pone en El Marqués con
--     el mismo 76144, y el registro del DENUE lo pone en Santiago de Querétaro
--     con 76146. Lomas del Marqués está justo en el límite. Conviene confirmarlo
--     junto con el párroco.
--
-- 2 · parroquia-el-senor-de-la-misericordia — sin coordenada.
--     Anillo Vial III Km 4+188.5, Lote V 38-1, El Marqués. Erigida en 2023; la
--     diócesis publicó su visita pastoral en junio de 2024, pero no hay un solo
--     pin publicado de ella.
--
-- 3 · parroquia-del-espiritu-santo-rancho-viejo — sin coordenada.
--     Rancho Viejo (Espíritu Santo), Victoria, Gto., C.P. 37923: una ranchería
--     de 219 habitantes a unos 37 km al sur de la cabecera municipal. Existe en
--     los catálogos postales, pero ninguna fuente publica su coordenada.
--
-- CÓMO CERRAR ESTOS DOS ÚLTIMOS, sin depender de nadie: abre la dirección en
-- Google Maps, haz clic derecho sobre el techo del templo y copia el par de
-- números que aparece arriba del menú. Después:
--
--   update public.directorio_parroquias
--      set lat = <lat>, lng = <lng>,
--          geo_precision = 'templo', geo_revisar = false,
--          estado_dato = 'coordenada tomada a mano en el mapa el <fecha>',
--          updated_at = now()
--    where id = 'parroquia-el-senor-de-la-misericordia';   -- o el otro id
