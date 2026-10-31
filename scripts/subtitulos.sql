-- subtitulos.sql — Subtítulos (VTT) por video para accesibilidad (personas sordas).
-- ADITIVO: añade la columna `url_subtitulos` a `videos` y dos RPC pequeñas para
-- leer/guardar ESE campo desde el panel, SIN tocar admin_crear_video /
-- admin_editar_video / admin_listar_videos (cuyos cuerpos no están en el repo).
-- El frontend lee `url_subtitulos` directo del SELECT de `videos` en loadBridge.
-- Idempotente y re-ejecutable.

-- 1) Columna (nullable). Guardará la URL pública del .vtt por (sacramento, orden, idioma).
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS url_subtitulos text;

-- 2) Admin: leer el subtítulo de un video (para precargar el editor).
CREATE OR REPLACE FUNCTION public.admin_get_subtitulos(p_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  RETURN (SELECT url_subtitulos FROM public.videos WHERE id = p_id);
END $$;
GRANT EXECUTE ON FUNCTION public.admin_get_subtitulos(uuid) TO authenticated;

-- 3) Admin: guardar/limpiar el subtítulo de un video (solo ese campo).
CREATE OR REPLACE FUNCTION public.admin_set_subtitulos(p_id uuid, p_url text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  UPDATE public.videos SET url_subtitulos = nullif(trim(coalesce(p_url,'')), '') WHERE id = p_id;
  BEGIN
    INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      VALUES (auth.uid(), (SELECT email FROM auth.users WHERE id = auth.uid()),
              'video.subtitulos', 'videos', p_id::text, jsonb_build_object('url', p_url));
  EXCEPTION WHEN others THEN NULL; END;
END $$;
GRANT EXECUTE ON FUNCTION public.admin_set_subtitulos(uuid, text) TO authenticated;
