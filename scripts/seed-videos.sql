-- scripts/seed-videos.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Videos POR IDIOMA. Habilita una fila por (sacramento, orden, IDIOMA) para que
-- cada idioma tenga su propio video y — clave — para que el PROGRESO persista en
-- los 6 idiomas (el progreso se mapea por (sacramento, orden, idioma del alumno);
-- sin la fila, `persistProgreso` no tiene a qué video_id guardar y el avance se
-- pierde al cerrar sesión / borrar caché).
--
-- CAMBIO DE ESQUEMA: la tabla tenía UNIQUE(sacramento_id, orden), que impedía más
-- de un idioma por lección. Se reemplaza por UNIQUE(sacramento_id, orden, idioma).
--
-- Lecciones por sección (orden 1..N) — debe coincidir con SEC_META de course.js:
--   kerigma 1 · tc1 22 · bautismo 4 · confirmacion 6 · primera_comunion 5 ·
--   prebautismal 4 · catequista 4 · tc2_confesion 5 · tc2_uncion 4  → 55 lecciones
-- 55 × 6 idiomas = 330 filas.
--
-- titulo_es es NOT NULL → se pone un placeholder (los TÍTULOS que ve el alumno
-- vienen del frontend/SEC_META; estos son solo para el panel → Videos, editables).
-- Idempotente. Correr en Supabase → SQL Editor (proyecto Catecumen).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Restricción única por (sacramento, orden, idioma).
alter table public.videos drop constraint if exists videos_sacramento_orden_key;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'videos_sacramento_orden_idioma_key') then
    alter table public.videos
      add constraint videos_sacramento_orden_idioma_key unique (sacramento_id, orden, idioma);
  end if;
end $$;

-- 2) Sembrar una fila por lección × idioma (solo las que falten).
with cursos(slug, n) as (values
  ('kerigma', 1), ('tc1', 22), ('bautismo', 4), ('confirmacion', 6),
  ('primera_comunion', 5), ('prebautismal', 4), ('catequista', 4),
  ('tc2_confesion', 5), ('tc2_uncion', 4)
),
idiomas(idioma) as (values ('es'), ('en'), ('fr'), ('de'), ('pt'), ('it'))
insert into public.videos (sacramento_id, orden, idioma, titulo_es, titulo_en, url_video, activo)
select s.id, g.orden, i.idioma,
       c.slug || ' · Lección ' || g.orden,
       c.slug || ' · Lesson '  || g.orden,
       'PENDIENTE', true
from cursos c
join public.sacramentos s on s.slug = c.slug
cross join lateral generate_series(1, c.n) as g(orden)
cross join idiomas i
where not exists (
  select 1 from public.videos v
  where v.sacramento_id = s.id and v.orden = g.orden and v.idioma = i.idioma
);

-- Verificación (segura):
-- select idioma, count(*) from public.videos group by idioma order by idioma;
