-- scripts/correccion-parrocos.sql
--
-- Correcciones al directorio diocesano que NO vienen del sitio de la diócesis,
-- sino de conocimiento directo. Importa distinguirlas: el sitio oficial sigue
-- publicando el dato viejo, así que una reextracción las revertiría si no
-- quedaran marcadas.
--
-- Por eso cada corrección deja constancia en `estado_dato` y limpia
-- `fuente_url`: ese registro ya no refleja lo publicado.
--
-- Idempotente y re-ejecutable.

begin;

-- ── Parroquia de Nuestra Señora de la Esperanza (Corregidora) ───────────────
-- Decanato Nuestra Señora del Pueblito · Alejandría Nº 2, Fracc. Misión de
-- Santa Sofía. El sitio de la diócesis todavía publica como párroco al
-- Pbro. Mtro. Laureano López Saloma; el dato vigente es otro.
update public.directorio_parroquias
   set parroco      = 'Pbro. Mtro. Jorge Ramírez Casas',
       estado_dato  = 'párroco corregido a mano el 2026-09-10; el sitio de la diócesis aún publica al anterior',
       fuente_url   = null,
       updated_at   = now()
 where id = 'parroquia-de-nuestra-senora-de-la-esperanza';

-- Comprobación: debe devolver 1 renglón, con el párroco nuevo.
select id, nombre, municipio, decanato, parroco, estado_dato
  from public.directorio_parroquias
 where id = 'parroquia-de-nuestra-senora-de-la-esperanza';

-- Y para no confundirla con la otra del mismo nombre, que NO se toca:
select id, nombre, municipio, parroco
  from public.directorio_parroquias
 where nombre ilike '%Esperanza%'
 order by municipio;

commit;
