-- ============================================================================
-- TOUR EDITABLE — tarjetas de bienvenida administrables desde el panel
-- Ejecutar en el SQL Editor de Supabase (rol dueño de las tablas).
-- Requiere: public.es_admin(), public.admin_log.
--
-- Diseño: los TEXTOS pueden quedar NULL. Si están vacíos, el frontend usa el
-- texto que ya trae integrado (respaldo). Así nada se rompe si aún no editas.
-- El tour se muestra ANTES de iniciar sesión → la lectura es pública (anon).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.tour_tarjetas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave           text NOT NULL UNIQUE,      -- 'bienvenida', 'muestra', etc.
  orden           smallint NOT NULL,
  video_url       text,                      -- mp4 (ruta /tour/x.mp4 o URL externa)
  video_webm_url  text,                      -- webm opcional
  poster_url      text,                      -- imagen de respaldo
  texto_es text, texto_en text, texto_fr text,
  texto_de text, texto_pt text, texto_it text,
  activo          boolean NOT NULL DEFAULT true,
  creado          timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tour_tarjetas_orden_idx ON public.tour_tarjetas (orden);

-- ─────────────────────────────────────────────────────────────────────────
-- Semilla: las 8 tarjetas actuales + la nueva de "video de muestra".
-- Los textos van NULL a propósito (el frontend usa los suyos por defecto).
-- La tarjeta 'muestra' queda SIN video: lo cargas desde el panel.
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.tour_tarjetas (clave, orden, video_url, video_webm_url) VALUES
  ('bienvenida',  1, '/tour/bienvenida.mp4',  '/tour/bienvenida.webm'),
  ('institucion', 2, '/tour/institucion.mp4', '/tour/institucion.webm'),
  ('biblia',      3, '/tour/biblia.mp4',      '/tour/biblia.webm'),
  ('sacerdotes',  4, '/tour/sacerdotes.mp4',  '/tour/sacerdotes.webm'),
  ('ia',          5, '/tour/ia.mp4',          '/tour/ia.webm'),
  ('documentos',  6, '/tour/documentos.mp4',  '/tour/documentos.webm'),
  ('avatares',    7, '/tour/avatares.mp4',    '/tour/avatares.webm'),
  ('comunidad',   8, '/tour/comunidad.mp4',   '/tour/comunidad.webm'),
  ('muestra',     9, NULL,                    NULL)
ON CONFLICT (clave) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS: lectura pública solo de tarjetas activas; escritura solo por RPC.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.tour_tarjetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tour_lectura_publica ON public.tour_tarjetas;
CREATE POLICY tour_lectura_publica ON public.tour_tarjetas
  FOR SELECT TO anon, authenticated USING (activo = true);

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Lectura pública para el frontend (el tour se ve sin iniciar sesión)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.obtener_tour();
CREATE FUNCTION public.obtener_tour()
RETURNS TABLE (
  clave text, orden smallint,
  video_url text, video_webm_url text, poster_url text,
  texto_es text, texto_en text, texto_fr text, texto_de text, texto_pt text, texto_it text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.clave, t.orden, t.video_url, t.video_webm_url, t.poster_url,
         t.texto_es, t.texto_en, t.texto_fr, t.texto_de, t.texto_pt, t.texto_it
  FROM public.tour_tarjetas t
  WHERE t.activo = true
  ORDER BY t.orden;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Admin: listar TODAS las tarjetas (incluidas inactivas)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_listar_tour();
CREATE FUNCTION public.admin_listar_tour()
RETURNS SETOF public.tour_tarjetas
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.tour_tarjetas ORDER BY orden, clave;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Admin: crear / editar tarjeta (upsert por jsonb)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_guardar_tarjeta_tour(uuid, jsonb);
CREATE FUNCTION public.admin_guardar_tarjeta_tour(p_id uuid, p_datos jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid; v_clave text; v_orden smallint;
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;

  v_clave := lower(trim(COALESCE(p_datos->>'clave','')));
  IF v_clave = '' THEN RAISE EXCEPTION 'La clave de la tarjeta es obligatoria'; END IF;
  IF v_clave !~ '^[a-z0-9_]+$' THEN
    RAISE EXCEPTION 'La clave solo admite minúsculas, números y guion bajo';
  END IF;

  IF p_id IS NULL THEN
    v_orden := COALESCE(NULLIF(p_datos->>'orden','')::smallint,
                        (SELECT COALESCE(MAX(orden),0)+1 FROM public.tour_tarjetas));
    INSERT INTO public.tour_tarjetas
      (clave, orden, video_url, video_webm_url, poster_url,
       texto_es, texto_en, texto_fr, texto_de, texto_pt, texto_it, activo)
    VALUES (v_clave, v_orden,
       NULLIF(p_datos->>'video_url',''), NULLIF(p_datos->>'video_webm_url',''),
       NULLIF(p_datos->>'poster_url',''),
       NULLIF(p_datos->>'texto_es',''), NULLIF(p_datos->>'texto_en',''),
       NULLIF(p_datos->>'texto_fr',''), NULLIF(p_datos->>'texto_de',''),
       NULLIF(p_datos->>'texto_pt',''), NULLIF(p_datos->>'texto_it',''),
       COALESCE((p_datos->>'activo')::boolean, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.tour_tarjetas SET
      clave          = v_clave,
      orden          = COALESCE(NULLIF(p_datos->>'orden','')::smallint, orden),
      video_url      = NULLIF(p_datos->>'video_url',''),
      video_webm_url = NULLIF(p_datos->>'video_webm_url',''),
      poster_url     = NULLIF(p_datos->>'poster_url',''),
      texto_es = NULLIF(p_datos->>'texto_es',''), texto_en = NULLIF(p_datos->>'texto_en',''),
      texto_fr = NULLIF(p_datos->>'texto_fr',''), texto_de = NULLIF(p_datos->>'texto_de',''),
      texto_pt = NULLIF(p_datos->>'texto_pt',''), texto_it = NULLIF(p_datos->>'texto_it',''),
      activo   = COALESCE((p_datos->>'activo')::boolean, activo)
    WHERE id = p_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'La tarjeta no existe'; END IF;
  END IF;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          CASE WHEN p_id IS NULL THEN 'tour_crear' ELSE 'tour_editar' END,
          'tour_tarjetas', v_id::text,
          jsonb_build_object('clave', v_clave, 'video_url', p_datos->>'video_url'));

  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) Admin: activar / desactivar
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_tour_activo(uuid, boolean);
CREATE FUNCTION public.admin_tour_activo(p_id uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  UPDATE public.tour_tarjetas SET activo = p_activo WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'La tarjeta no existe'; END IF;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          CASE WHEN p_activo THEN 'tour_activar' ELSE 'tour_desactivar' END,
          'tour_tarjetas', p_id::text, jsonb_build_object('activo', p_activo));
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5) Admin: borrar tarjeta
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_borrar_tarjeta_tour(uuid);
CREATE FUNCTION public.admin_borrar_tarjeta_tour(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_clave text;
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  SELECT clave INTO v_clave FROM public.tour_tarjetas WHERE id = p_id;
  IF v_clave IS NULL THEN RAISE EXCEPTION 'La tarjeta no existe'; END IF;

  DELETE FROM public.tour_tarjetas WHERE id = p_id;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          'tour_borrar', 'tour_tarjetas', p_id::text,
          jsonb_build_object('clave', v_clave));
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.obtener_tour()                            FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_listar_tour()                       FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_guardar_tarjeta_tour(uuid, jsonb)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_tour_activo(uuid, boolean)          FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_borrar_tarjeta_tour(uuid)           FROM PUBLIC;

-- El tour se ve sin iniciar sesión: anon TAMBIÉN puede leer.
GRANT EXECUTE ON FUNCTION public.obtener_tour()                          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_tour()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_guardar_tarjeta_tour(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_tour_activo(uuid, boolean)        TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_borrar_tarjeta_tour(uuid)         TO authenticated;

-- Verificación segura (no ejecuta RPC protegidas):
-- SELECT clave, orden, video_url, activo FROM public.tour_tarjetas ORDER BY orden;
