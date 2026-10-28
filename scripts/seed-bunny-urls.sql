-- seed-bunny-urls.sql  ·  PLANTILLA para cargar las URLs de Bunny Stream
-- ─────────────────────────────────────────────────────────────────────────────
-- CÓMO USARLA (3 pasos):
--   1) Reemplaza en TODO el archivo  __BUNNY_HOST__  por el hostname de tu
--      pull zone de Bunny (p. ej.  vz-ab12cd34.b-cdn.net ).  (Buscar/Reemplazar)
--   2) En la columna guid de cada fila, pega el GUID del video de Bunny
--      (el identificador del video en tu Video Library). Deja '' las que aún
--      no tengas: esas filas se IGNORAN (esa lección seguirá con su video de
--      prueba hasta que le pongas GUID).
--   3) Corre todo el script en el SQL Editor de Supabase. Es re-ejecutable:
--      puedes volver a correrlo cuando agregues más GUIDs.
--
-- La URL final que se guarda es:  https://__BUNNY_HOST__/<guid>/playlist.m3u8
-- (firmar-video firma el directorio /<guid>/ para proteger playlist + segmentos.)
--
-- Puedes cargar UN idioma a la vez: llena solo el bloque de ese idioma y corre.
-- Un mismo video sin doblar puede reutilizarse en varios idiomas: pon el mismo
-- GUID en las filas de esos idiomas.
-- ─────────────────────────────────────────────────────────────────────────────

create temporary table _bunny (slug text, orden int, idioma text, guid text) on commit drop;

insert into _bunny (slug, orden, idioma, guid) values
  -- ══════════════ Español (es) ══════════════
  -- -- Kerigma (Módulo 0) --
  ('kerigma', 1, 'es', ''),
  -- -- Tronco Común I --
  ('tc1', 1, 'es', ''),
  ('tc1', 2, 'es', ''),
  ('tc1', 3, 'es', ''),
  ('tc1', 4, 'es', ''),
  ('tc1', 5, 'es', ''),
  ('tc1', 6, 'es', ''),
  ('tc1', 7, 'es', ''),
  ('tc1', 8, 'es', ''),
  ('tc1', 9, 'es', ''),
  ('tc1', 10, 'es', ''),
  ('tc1', 11, 'es', ''),
  ('tc1', 12, 'es', ''),
  ('tc1', 13, 'es', ''),
  ('tc1', 14, 'es', ''),
  ('tc1', 15, 'es', ''),
  ('tc1', 16, 'es', ''),
  ('tc1', 17, 'es', ''),
  ('tc1', 18, 'es', ''),
  ('tc1', 19, 'es', ''),
  ('tc1', 20, 'es', ''),
  ('tc1', 21, 'es', ''),
  ('tc1', 22, 'es', ''),
  -- -- Bautismo --
  ('bautismo', 1, 'es', ''),
  ('bautismo', 2, 'es', ''),
  ('bautismo', 3, 'es', ''),
  ('bautismo', 4, 'es', ''),
  -- -- Primera Comunión --
  ('primera_comunion', 1, 'es', ''),
  ('primera_comunion', 2, 'es', ''),
  ('primera_comunion', 3, 'es', ''),
  ('primera_comunion', 4, 'es', ''),
  ('primera_comunion', 5, 'es', ''),
  -- -- Confirmación --
  ('confirmacion', 1, 'es', ''),
  ('confirmacion', 2, 'es', ''),
  ('confirmacion', 3, 'es', ''),
  ('confirmacion', 4, 'es', ''),
  ('confirmacion', 5, 'es', ''),
  ('confirmacion', 6, 'es', ''),
  -- -- Prebautismal (papás) --
  ('prebautismal', 1, 'es', ''),
  ('prebautismal', 2, 'es', ''),
  ('prebautismal', 3, 'es', ''),
  ('prebautismal', 4, 'es', ''),
  -- -- Catequista --
  ('catequista', 1, 'es', ''),
  ('catequista', 2, 'es', ''),
  ('catequista', 3, 'es', ''),
  ('catequista', 4, 'es', ''),
  -- -- TC II · Confesión --
  ('tc2_confesion', 1, 'es', ''),
  ('tc2_confesion', 2, 'es', ''),
  ('tc2_confesion', 3, 'es', ''),
  ('tc2_confesion', 4, 'es', ''),
  ('tc2_confesion', 5, 'es', ''),
  -- -- TC II · Unción --
  ('tc2_uncion', 1, 'es', ''),
  ('tc2_uncion', 2, 'es', ''),
  ('tc2_uncion', 3, 'es', ''),
  ('tc2_uncion', 4, 'es', ''),
  -- ══════════════ Inglés (en) ══════════════
  -- -- Kerigma (Módulo 0) --
  ('kerigma', 1, 'en', ''),
  -- -- Tronco Común I --
  ('tc1', 1, 'en', ''),
  ('tc1', 2, 'en', ''),
  ('tc1', 3, 'en', ''),
  ('tc1', 4, 'en', ''),
  ('tc1', 5, 'en', ''),
  ('tc1', 6, 'en', ''),
  ('tc1', 7, 'en', ''),
  ('tc1', 8, 'en', ''),
  ('tc1', 9, 'en', ''),
  ('tc1', 10, 'en', ''),
  ('tc1', 11, 'en', ''),
  ('tc1', 12, 'en', ''),
  ('tc1', 13, 'en', ''),
  ('tc1', 14, 'en', ''),
  ('tc1', 15, 'en', ''),
  ('tc1', 16, 'en', ''),
  ('tc1', 17, 'en', ''),
  ('tc1', 18, 'en', ''),
  ('tc1', 19, 'en', ''),
  ('tc1', 20, 'en', ''),
  ('tc1', 21, 'en', ''),
  ('tc1', 22, 'en', ''),
  -- -- Bautismo --
  ('bautismo', 1, 'en', ''),
  ('bautismo', 2, 'en', ''),
  ('bautismo', 3, 'en', ''),
  ('bautismo', 4, 'en', ''),
  -- -- Primera Comunión --
  ('primera_comunion', 1, 'en', ''),
  ('primera_comunion', 2, 'en', ''),
  ('primera_comunion', 3, 'en', ''),
  ('primera_comunion', 4, 'en', ''),
  ('primera_comunion', 5, 'en', ''),
  -- -- Confirmación --
  ('confirmacion', 1, 'en', ''),
  ('confirmacion', 2, 'en', ''),
  ('confirmacion', 3, 'en', ''),
  ('confirmacion', 4, 'en', ''),
  ('confirmacion', 5, 'en', ''),
  ('confirmacion', 6, 'en', ''),
  -- -- Prebautismal (papás) --
  ('prebautismal', 1, 'en', ''),
  ('prebautismal', 2, 'en', ''),
  ('prebautismal', 3, 'en', ''),
  ('prebautismal', 4, 'en', ''),
  -- -- Catequista --
  ('catequista', 1, 'en', ''),
  ('catequista', 2, 'en', ''),
  ('catequista', 3, 'en', ''),
  ('catequista', 4, 'en', ''),
  -- -- TC II · Confesión --
  ('tc2_confesion', 1, 'en', ''),
  ('tc2_confesion', 2, 'en', ''),
  ('tc2_confesion', 3, 'en', ''),
  ('tc2_confesion', 4, 'en', ''),
  ('tc2_confesion', 5, 'en', ''),
  -- -- TC II · Unción --
  ('tc2_uncion', 1, 'en', ''),
  ('tc2_uncion', 2, 'en', ''),
  ('tc2_uncion', 3, 'en', ''),
  ('tc2_uncion', 4, 'en', ''),
  -- ══════════════ Francés (fr) ══════════════
  -- -- Kerigma (Módulo 0) --
  ('kerigma', 1, 'fr', ''),
  -- -- Tronco Común I --
  ('tc1', 1, 'fr', ''),
  ('tc1', 2, 'fr', ''),
  ('tc1', 3, 'fr', ''),
  ('tc1', 4, 'fr', ''),
  ('tc1', 5, 'fr', ''),
  ('tc1', 6, 'fr', ''),
  ('tc1', 7, 'fr', ''),
  ('tc1', 8, 'fr', ''),
  ('tc1', 9, 'fr', ''),
  ('tc1', 10, 'fr', ''),
  ('tc1', 11, 'fr', ''),
  ('tc1', 12, 'fr', ''),
  ('tc1', 13, 'fr', ''),
  ('tc1', 14, 'fr', ''),
  ('tc1', 15, 'fr', ''),
  ('tc1', 16, 'fr', ''),
  ('tc1', 17, 'fr', ''),
  ('tc1', 18, 'fr', ''),
  ('tc1', 19, 'fr', ''),
  ('tc1', 20, 'fr', ''),
  ('tc1', 21, 'fr', ''),
  ('tc1', 22, 'fr', ''),
  -- -- Bautismo --
  ('bautismo', 1, 'fr', ''),
  ('bautismo', 2, 'fr', ''),
  ('bautismo', 3, 'fr', ''),
  ('bautismo', 4, 'fr', ''),
  -- -- Primera Comunión --
  ('primera_comunion', 1, 'fr', ''),
  ('primera_comunion', 2, 'fr', ''),
  ('primera_comunion', 3, 'fr', ''),
  ('primera_comunion', 4, 'fr', ''),
  ('primera_comunion', 5, 'fr', ''),
  -- -- Confirmación --
  ('confirmacion', 1, 'fr', ''),
  ('confirmacion', 2, 'fr', ''),
  ('confirmacion', 3, 'fr', ''),
  ('confirmacion', 4, 'fr', ''),
  ('confirmacion', 5, 'fr', ''),
  ('confirmacion', 6, 'fr', ''),
  -- -- Prebautismal (papás) --
  ('prebautismal', 1, 'fr', ''),
  ('prebautismal', 2, 'fr', ''),
  ('prebautismal', 3, 'fr', ''),
  ('prebautismal', 4, 'fr', ''),
  -- -- Catequista --
  ('catequista', 1, 'fr', ''),
  ('catequista', 2, 'fr', ''),
  ('catequista', 3, 'fr', ''),
  ('catequista', 4, 'fr', ''),
  -- -- TC II · Confesión --
  ('tc2_confesion', 1, 'fr', ''),
  ('tc2_confesion', 2, 'fr', ''),
  ('tc2_confesion', 3, 'fr', ''),
  ('tc2_confesion', 4, 'fr', ''),
  ('tc2_confesion', 5, 'fr', ''),
  -- -- TC II · Unción --
  ('tc2_uncion', 1, 'fr', ''),
  ('tc2_uncion', 2, 'fr', ''),
  ('tc2_uncion', 3, 'fr', ''),
  ('tc2_uncion', 4, 'fr', ''),
  -- ══════════════ Alemán (de) ══════════════
  -- -- Kerigma (Módulo 0) --
  ('kerigma', 1, 'de', ''),
  -- -- Tronco Común I --
  ('tc1', 1, 'de', ''),
  ('tc1', 2, 'de', ''),
  ('tc1', 3, 'de', ''),
  ('tc1', 4, 'de', ''),
  ('tc1', 5, 'de', ''),
  ('tc1', 6, 'de', ''),
  ('tc1', 7, 'de', ''),
  ('tc1', 8, 'de', ''),
  ('tc1', 9, 'de', ''),
  ('tc1', 10, 'de', ''),
  ('tc1', 11, 'de', ''),
  ('tc1', 12, 'de', ''),
  ('tc1', 13, 'de', ''),
  ('tc1', 14, 'de', ''),
  ('tc1', 15, 'de', ''),
  ('tc1', 16, 'de', ''),
  ('tc1', 17, 'de', ''),
  ('tc1', 18, 'de', ''),
  ('tc1', 19, 'de', ''),
  ('tc1', 20, 'de', ''),
  ('tc1', 21, 'de', ''),
  ('tc1', 22, 'de', ''),
  -- -- Bautismo --
  ('bautismo', 1, 'de', ''),
  ('bautismo', 2, 'de', ''),
  ('bautismo', 3, 'de', ''),
  ('bautismo', 4, 'de', ''),
  -- -- Primera Comunión --
  ('primera_comunion', 1, 'de', ''),
  ('primera_comunion', 2, 'de', ''),
  ('primera_comunion', 3, 'de', ''),
  ('primera_comunion', 4, 'de', ''),
  ('primera_comunion', 5, 'de', ''),
  -- -- Confirmación --
  ('confirmacion', 1, 'de', ''),
  ('confirmacion', 2, 'de', ''),
  ('confirmacion', 3, 'de', ''),
  ('confirmacion', 4, 'de', ''),
  ('confirmacion', 5, 'de', ''),
  ('confirmacion', 6, 'de', ''),
  -- -- Prebautismal (papás) --
  ('prebautismal', 1, 'de', ''),
  ('prebautismal', 2, 'de', ''),
  ('prebautismal', 3, 'de', ''),
  ('prebautismal', 4, 'de', ''),
  -- -- Catequista --
  ('catequista', 1, 'de', ''),
  ('catequista', 2, 'de', ''),
  ('catequista', 3, 'de', ''),
  ('catequista', 4, 'de', ''),
  -- -- TC II · Confesión --
  ('tc2_confesion', 1, 'de', ''),
  ('tc2_confesion', 2, 'de', ''),
  ('tc2_confesion', 3, 'de', ''),
  ('tc2_confesion', 4, 'de', ''),
  ('tc2_confesion', 5, 'de', ''),
  -- -- TC II · Unción --
  ('tc2_uncion', 1, 'de', ''),
  ('tc2_uncion', 2, 'de', ''),
  ('tc2_uncion', 3, 'de', ''),
  ('tc2_uncion', 4, 'de', ''),
  -- ══════════════ Portugués (pt) ══════════════
  -- -- Kerigma (Módulo 0) --
  ('kerigma', 1, 'pt', ''),
  -- -- Tronco Común I --
  ('tc1', 1, 'pt', ''),
  ('tc1', 2, 'pt', ''),
  ('tc1', 3, 'pt', ''),
  ('tc1', 4, 'pt', ''),
  ('tc1', 5, 'pt', ''),
  ('tc1', 6, 'pt', ''),
  ('tc1', 7, 'pt', ''),
  ('tc1', 8, 'pt', ''),
  ('tc1', 9, 'pt', ''),
  ('tc1', 10, 'pt', ''),
  ('tc1', 11, 'pt', ''),
  ('tc1', 12, 'pt', ''),
  ('tc1', 13, 'pt', ''),
  ('tc1', 14, 'pt', ''),
  ('tc1', 15, 'pt', ''),
  ('tc1', 16, 'pt', ''),
  ('tc1', 17, 'pt', ''),
  ('tc1', 18, 'pt', ''),
  ('tc1', 19, 'pt', ''),
  ('tc1', 20, 'pt', ''),
  ('tc1', 21, 'pt', ''),
  ('tc1', 22, 'pt', ''),
  -- -- Bautismo --
  ('bautismo', 1, 'pt', ''),
  ('bautismo', 2, 'pt', ''),
  ('bautismo', 3, 'pt', ''),
  ('bautismo', 4, 'pt', ''),
  -- -- Primera Comunión --
  ('primera_comunion', 1, 'pt', ''),
  ('primera_comunion', 2, 'pt', ''),
  ('primera_comunion', 3, 'pt', ''),
  ('primera_comunion', 4, 'pt', ''),
  ('primera_comunion', 5, 'pt', ''),
  -- -- Confirmación --
  ('confirmacion', 1, 'pt', ''),
  ('confirmacion', 2, 'pt', ''),
  ('confirmacion', 3, 'pt', ''),
  ('confirmacion', 4, 'pt', ''),
  ('confirmacion', 5, 'pt', ''),
  ('confirmacion', 6, 'pt', ''),
  -- -- Prebautismal (papás) --
  ('prebautismal', 1, 'pt', ''),
  ('prebautismal', 2, 'pt', ''),
  ('prebautismal', 3, 'pt', ''),
  ('prebautismal', 4, 'pt', ''),
  -- -- Catequista --
  ('catequista', 1, 'pt', ''),
  ('catequista', 2, 'pt', ''),
  ('catequista', 3, 'pt', ''),
  ('catequista', 4, 'pt', ''),
  -- -- TC II · Confesión --
  ('tc2_confesion', 1, 'pt', ''),
  ('tc2_confesion', 2, 'pt', ''),
  ('tc2_confesion', 3, 'pt', ''),
  ('tc2_confesion', 4, 'pt', ''),
  ('tc2_confesion', 5, 'pt', ''),
  -- -- TC II · Unción --
  ('tc2_uncion', 1, 'pt', ''),
  ('tc2_uncion', 2, 'pt', ''),
  ('tc2_uncion', 3, 'pt', ''),
  ('tc2_uncion', 4, 'pt', ''),
  -- ══════════════ Italiano (it) ══════════════
  -- -- Kerigma (Módulo 0) --
  ('kerigma', 1, 'it', ''),
  -- -- Tronco Común I --
  ('tc1', 1, 'it', ''),
  ('tc1', 2, 'it', ''),
  ('tc1', 3, 'it', ''),
  ('tc1', 4, 'it', ''),
  ('tc1', 5, 'it', ''),
  ('tc1', 6, 'it', ''),
  ('tc1', 7, 'it', ''),
  ('tc1', 8, 'it', ''),
  ('tc1', 9, 'it', ''),
  ('tc1', 10, 'it', ''),
  ('tc1', 11, 'it', ''),
  ('tc1', 12, 'it', ''),
  ('tc1', 13, 'it', ''),
  ('tc1', 14, 'it', ''),
  ('tc1', 15, 'it', ''),
  ('tc1', 16, 'it', ''),
  ('tc1', 17, 'it', ''),
  ('tc1', 18, 'it', ''),
  ('tc1', 19, 'it', ''),
  ('tc1', 20, 'it', ''),
  ('tc1', 21, 'it', ''),
  ('tc1', 22, 'it', ''),
  -- -- Bautismo --
  ('bautismo', 1, 'it', ''),
  ('bautismo', 2, 'it', ''),
  ('bautismo', 3, 'it', ''),
  ('bautismo', 4, 'it', ''),
  -- -- Primera Comunión --
  ('primera_comunion', 1, 'it', ''),
  ('primera_comunion', 2, 'it', ''),
  ('primera_comunion', 3, 'it', ''),
  ('primera_comunion', 4, 'it', ''),
  ('primera_comunion', 5, 'it', ''),
  -- -- Confirmación --
  ('confirmacion', 1, 'it', ''),
  ('confirmacion', 2, 'it', ''),
  ('confirmacion', 3, 'it', ''),
  ('confirmacion', 4, 'it', ''),
  ('confirmacion', 5, 'it', ''),
  ('confirmacion', 6, 'it', ''),
  -- -- Prebautismal (papás) --
  ('prebautismal', 1, 'it', ''),
  ('prebautismal', 2, 'it', ''),
  ('prebautismal', 3, 'it', ''),
  ('prebautismal', 4, 'it', ''),
  -- -- Catequista --
  ('catequista', 1, 'it', ''),
  ('catequista', 2, 'it', ''),
  ('catequista', 3, 'it', ''),
  ('catequista', 4, 'it', ''),
  -- -- TC II · Confesión --
  ('tc2_confesion', 1, 'it', ''),
  ('tc2_confesion', 2, 'it', ''),
  ('tc2_confesion', 3, 'it', ''),
  ('tc2_confesion', 4, 'it', ''),
  ('tc2_confesion', 5, 'it', ''),
  -- -- TC II · Unción --
  ('tc2_uncion', 1, 'it', ''),
  ('tc2_uncion', 2, 'it', ''),
  ('tc2_uncion', 3, 'it', ''),
  ('tc2_uncion', 4, 'it', '');


update public.videos v
set url_video = 'https://__BUNNY_HOST__/' || b.guid || '/playlist.m3u8'
from _bunny b
join public.sacramentos s on s.slug = b.slug
where v.sacramento_id = s.id
  and v.orden = b.orden
  and v.idioma = b.idioma
  and b.guid <> '';

-- Verificación: cuántos videos quedaron con URL de Bunny, por idioma.
select idioma,
       count(*) filter (where url_video ilike 'https://%.m3u8') as con_bunny,
       count(*) filter (where url_video = 'PENDIENTE' or url_video is null) as pendientes
from public.videos
group by idioma order by idioma;
