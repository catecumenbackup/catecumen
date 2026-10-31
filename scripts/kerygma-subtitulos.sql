-- kerygma-subtitulos.sql — asigna los VTT de Kerygma a cada video (slug=kerigma, idioma es).
-- Correr DESPUÉS de subtitulos.sql. Idempotente. Los .vtt van en public/subtitulos/ (se despliegan con dist/).

UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-01-A.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=1 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-01-B.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=2 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-01-C.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=3 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-01-D.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=4 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-02-A.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=5 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-02-B.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=6 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-02-C.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=7 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-02-D.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=8 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-03-A.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=9 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-03-B.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=10 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-03-C.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=11 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-03-D.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=12 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-04-A.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=13 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-04-B.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=14 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-04-C.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=15 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-04-D.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=16 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-05-A.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=17 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-05-B.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=18 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-05-C.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=19 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-05-D.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=20 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-06-A.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=21 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-06-B.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=22 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-06-C.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=23 AND idioma='es';
UPDATE public.videos SET url_subtitulos='https://www.catecumen.com/subtitulos/KER-06-D.es.vtt' WHERE sacramento_id=(SELECT id FROM public.sacramentos WHERE slug='kerigma') AND orden=24 AND idioma='es';
