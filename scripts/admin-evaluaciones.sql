-- ============================================================================
-- ADMIN — EVALUACIONES (CRUD de preguntas por video)
-- Ejecutar en el SQL Editor de Supabase con el rol dueño de las tablas.
--
-- Requiere: public.es_admin(), public.preguntas (con columnas i18n de
-- etapa6_i18n_schema.sql) y public.videos.
--
-- NOTA: la tabla preguntas ya está migrada a i18n; las columnas heredadas
-- (pregunta, opcion_a..d) fueron eliminadas. Estas funciones trabajan solo
-- con las columnas *_es/_en/_fr/_de/_pt/_it (+ respuesta_correcta, etc.).
--
-- Auditoría: escribe en public.admin_log (admin_id, admin_email, accion,
-- entidad, entidad_id, detalle). OJO: entidad_id es TEXT, por eso los uuid
-- van con ::text — sin el cast, el INSERT falla.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 0) Garantizar las columnas i18n en `preguntas` (idempotente).
--    admin_listar_preguntas lee pregunta_fr/de/pt/it y opcion_*_fr/de/pt/it;
--    si esas columnas no existen (migración i18n no aplicada), la función
--    falla con 400. Este bloque las crea si faltan y no daña si ya están.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.preguntas
  ADD COLUMN IF NOT EXISTS pregunta_es text, ADD COLUMN IF NOT EXISTS pregunta_en text,
  ADD COLUMN IF NOT EXISTS pregunta_fr text, ADD COLUMN IF NOT EXISTS pregunta_de text,
  ADD COLUMN IF NOT EXISTS pregunta_pt text, ADD COLUMN IF NOT EXISTS pregunta_it text,
  ADD COLUMN IF NOT EXISTS opcion_a_es text, ADD COLUMN IF NOT EXISTS opcion_a_en text,
  ADD COLUMN IF NOT EXISTS opcion_a_fr text, ADD COLUMN IF NOT EXISTS opcion_a_de text,
  ADD COLUMN IF NOT EXISTS opcion_a_pt text, ADD COLUMN IF NOT EXISTS opcion_a_it text,
  ADD COLUMN IF NOT EXISTS opcion_b_es text, ADD COLUMN IF NOT EXISTS opcion_b_en text,
  ADD COLUMN IF NOT EXISTS opcion_b_fr text, ADD COLUMN IF NOT EXISTS opcion_b_de text,
  ADD COLUMN IF NOT EXISTS opcion_b_pt text, ADD COLUMN IF NOT EXISTS opcion_b_it text,
  ADD COLUMN IF NOT EXISTS opcion_c_es text, ADD COLUMN IF NOT EXISTS opcion_c_en text,
  ADD COLUMN IF NOT EXISTS opcion_c_fr text, ADD COLUMN IF NOT EXISTS opcion_c_de text,
  ADD COLUMN IF NOT EXISTS opcion_c_pt text, ADD COLUMN IF NOT EXISTS opcion_c_it text,
  ADD COLUMN IF NOT EXISTS opcion_d_es text, ADD COLUMN IF NOT EXISTS opcion_d_en text,
  ADD COLUMN IF NOT EXISTS opcion_d_fr text, ADD COLUMN IF NOT EXISTS opcion_d_de text,
  ADD COLUMN IF NOT EXISTS opcion_d_pt text, ADD COLUMN IF NOT EXISTS opcion_d_it text;

-- Nota: la tabla `preguntas` ya fue migrada a i18n; las columnas heredadas
-- (pregunta, opcion_a..d) fueron eliminadas. Por eso estas funciones NO las
-- referencian: trabajan solo con las columnas *_es/_en/_fr/_de/_pt/_it.

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Videos con su número de preguntas (para el selector del panel)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_videos_evaluacion();
CREATE FUNCTION public.admin_videos_evaluacion()
RETURNS TABLE (
  video_id        uuid,
  titulo          text,
  orden           smallint,
  video_activo    boolean,
  sacramento_id   uuid,
  sacramento      text,
  sac_orden       smallint,
  num_preguntas   bigint,
  puntaje_total   bigint
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;

  RETURN QUERY
  SELECT v.id, COALESCE(v.titulo_es, v.titulo_en, '(sin título)'), v.orden, v.activo,
         s.id, COALESCE(s.nombre_es, s.slug), s.orden,
         COUNT(p.id) FILTER (WHERE p.activo),
         COALESCE(SUM(p.puntaje) FILTER (WHERE p.activo), 0)
  FROM public.videos v
  JOIN public.sacramentos s ON s.id = v.sacramento_id
  LEFT JOIN public.preguntas p ON p.video_id = v.id
  GROUP BY v.id, v.titulo_es, v.titulo_en, v.orden, v.activo, s.id, s.nombre_es, s.slug, s.orden
  ORDER BY s.orden, v.orden;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Listar preguntas de un video (el admin SÍ ve la respuesta correcta)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_listar_preguntas(uuid);
CREATE FUNCTION public.admin_listar_preguntas(p_video_id uuid)
RETURNS TABLE (
  id uuid,
  pregunta_es text, pregunta_en text, pregunta_fr text, pregunta_de text, pregunta_pt text, pregunta_it text,
  opcion_a_es text, opcion_a_en text, opcion_a_fr text, opcion_a_de text, opcion_a_pt text, opcion_a_it text,
  opcion_b_es text, opcion_b_en text, opcion_b_fr text, opcion_b_de text, opcion_b_pt text, opcion_b_it text,
  opcion_c_es text, opcion_c_en text, opcion_c_fr text, opcion_c_de text, opcion_c_pt text, opcion_c_it text,
  opcion_d_es text, opcion_d_en text, opcion_d_fr text, opcion_d_de text, opcion_d_pt text, opcion_d_it text,
  respuesta_correcta text,
  explicacion text,
  puntaje smallint,
  orden smallint,
  activo boolean
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;

  RETURN QUERY
  SELECT p.id,
         p.pregunta_es, p.pregunta_en, p.pregunta_fr, p.pregunta_de, p.pregunta_pt, p.pregunta_it,
         p.opcion_a_es, p.opcion_a_en, p.opcion_a_fr, p.opcion_a_de, p.opcion_a_pt, p.opcion_a_it,
         p.opcion_b_es, p.opcion_b_en, p.opcion_b_fr, p.opcion_b_de, p.opcion_b_pt, p.opcion_b_it,
         p.opcion_c_es, p.opcion_c_en, p.opcion_c_fr, p.opcion_c_de, p.opcion_c_pt, p.opcion_c_it,
         p.opcion_d_es, p.opcion_d_en, p.opcion_d_fr, p.opcion_d_de, p.opcion_d_pt, p.opcion_d_it,
         p.respuesta_correcta::text, p.explicacion, p.puntaje::smallint, p.orden::smallint, COALESCE(p.activo, true)
  FROM public.preguntas p
  WHERE p.video_id = p_video_id
  ORDER BY p.orden, p.id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Crear o editar una pregunta (upsert por jsonb)
--    p_id NULL  -> crea;  p_id con valor -> edita.
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_guardar_pregunta(uuid, uuid, jsonb);
CREATE FUNCTION public.admin_guardar_pregunta(
  p_id       uuid,
  p_video_id uuid,
  p_datos    jsonb
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id     uuid;
  v_orden  smallint;
  v_resp   char(1);
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  IF p_video_id IS NULL THEN RAISE EXCEPTION 'Falta el video'; END IF;

  IF COALESCE(p_datos->>'pregunta_es','') = '' THEN
    RAISE EXCEPTION 'La pregunta en español es obligatoria';
  END IF;

  v_resp := lower(COALESCE(p_datos->>'respuesta_correcta',''));
  IF v_resp NOT IN ('a','b','c','d') THEN
    RAISE EXCEPTION 'La respuesta correcta debe ser a, b, c o d';
  END IF;

  IF COALESCE(p_datos->>'opcion_a_es','') = ''
     OR COALESCE(p_datos->>'opcion_b_es','') = ''
     OR COALESCE(p_datos->>'opcion_c_es','') = ''
     OR COALESCE(p_datos->>'opcion_d_es','') = '' THEN
    RAISE EXCEPTION 'Las cuatro opciones en español son obligatorias';
  END IF;

  IF p_id IS NULL THEN
    -- orden: el indicado o el siguiente disponible
    v_orden := COALESCE(NULLIF(p_datos->>'orden','')::smallint,
                        (SELECT COALESCE(MAX(orden),0)+1 FROM public.preguntas WHERE video_id = p_video_id));

    INSERT INTO public.preguntas (
      video_id,
      pregunta_es, pregunta_en, pregunta_fr, pregunta_de, pregunta_pt, pregunta_it,
      opcion_a_es, opcion_a_en, opcion_a_fr, opcion_a_de, opcion_a_pt, opcion_a_it,
      opcion_b_es, opcion_b_en, opcion_b_fr, opcion_b_de, opcion_b_pt, opcion_b_it,
      opcion_c_es, opcion_c_en, opcion_c_fr, opcion_c_de, opcion_c_pt, opcion_c_it,
      opcion_d_es, opcion_d_en, opcion_d_fr, opcion_d_de, opcion_d_pt, opcion_d_it,
      respuesta_correcta, explicacion, puntaje, orden, activo
    ) VALUES (
      p_video_id,
      p_datos->>'pregunta_es', p_datos->>'pregunta_en', p_datos->>'pregunta_fr',
      p_datos->>'pregunta_de', p_datos->>'pregunta_pt', p_datos->>'pregunta_it',
      p_datos->>'opcion_a_es', p_datos->>'opcion_a_en', p_datos->>'opcion_a_fr',
      p_datos->>'opcion_a_de', p_datos->>'opcion_a_pt', p_datos->>'opcion_a_it',
      p_datos->>'opcion_b_es', p_datos->>'opcion_b_en', p_datos->>'opcion_b_fr',
      p_datos->>'opcion_b_de', p_datos->>'opcion_b_pt', p_datos->>'opcion_b_it',
      p_datos->>'opcion_c_es', p_datos->>'opcion_c_en', p_datos->>'opcion_c_fr',
      p_datos->>'opcion_c_de', p_datos->>'opcion_c_pt', p_datos->>'opcion_c_it',
      p_datos->>'opcion_d_es', p_datos->>'opcion_d_en', p_datos->>'opcion_d_fr',
      p_datos->>'opcion_d_de', p_datos->>'opcion_d_pt', p_datos->>'opcion_d_it',
      v_resp,
      NULLIF(p_datos->>'explicacion',''),
      COALESCE(NULLIF(p_datos->>'puntaje','')::smallint, 2),
      v_orden,
      COALESCE((p_datos->>'activo')::boolean, true)
    )
    RETURNING id INTO v_id;

  ELSE
    UPDATE public.preguntas SET
      pregunta_es = p_datos->>'pregunta_es', pregunta_en = p_datos->>'pregunta_en',
      pregunta_fr = p_datos->>'pregunta_fr', pregunta_de = p_datos->>'pregunta_de',
      pregunta_pt = p_datos->>'pregunta_pt', pregunta_it = p_datos->>'pregunta_it',
      opcion_a_es = p_datos->>'opcion_a_es', opcion_a_en = p_datos->>'opcion_a_en',
      opcion_a_fr = p_datos->>'opcion_a_fr', opcion_a_de = p_datos->>'opcion_a_de',
      opcion_a_pt = p_datos->>'opcion_a_pt', opcion_a_it = p_datos->>'opcion_a_it',
      opcion_b_es = p_datos->>'opcion_b_es', opcion_b_en = p_datos->>'opcion_b_en',
      opcion_b_fr = p_datos->>'opcion_b_fr', opcion_b_de = p_datos->>'opcion_b_de',
      opcion_b_pt = p_datos->>'opcion_b_pt', opcion_b_it = p_datos->>'opcion_b_it',
      opcion_c_es = p_datos->>'opcion_c_es', opcion_c_en = p_datos->>'opcion_c_en',
      opcion_c_fr = p_datos->>'opcion_c_fr', opcion_c_de = p_datos->>'opcion_c_de',
      opcion_c_pt = p_datos->>'opcion_c_pt', opcion_c_it = p_datos->>'opcion_c_it',
      opcion_d_es = p_datos->>'opcion_d_es', opcion_d_en = p_datos->>'opcion_d_en',
      opcion_d_fr = p_datos->>'opcion_d_fr', opcion_d_de = p_datos->>'opcion_d_de',
      opcion_d_pt = p_datos->>'opcion_d_pt', opcion_d_it = p_datos->>'opcion_d_it',
      respuesta_correcta = v_resp,
      explicacion = NULLIF(p_datos->>'explicacion',''),
      puntaje     = COALESCE(NULLIF(p_datos->>'puntaje','')::smallint, puntaje),
      orden       = COALESCE(NULLIF(p_datos->>'orden','')::smallint, orden),
      activo      = COALESCE((p_datos->>'activo')::boolean, activo)
    WHERE id = p_id
    RETURNING id INTO v_id;

    IF v_id IS NULL THEN RAISE EXCEPTION 'La pregunta no existe'; END IF;
  END IF;

  -- Auditoría
  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          CASE WHEN p_id IS NULL THEN 'pregunta_crear' ELSE 'pregunta_editar' END,
          'preguntas', v_id::text,
          jsonb_build_object('video_id', p_video_id,
                             'pregunta', left(COALESCE(p_datos->>'pregunta_es',''), 120)));

  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) Activar / desactivar una pregunta (borrado suave, reversible)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_pregunta_activo(uuid, boolean);
CREATE FUNCTION public.admin_pregunta_activo(p_id uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;

  UPDATE public.preguntas SET activo = p_activo WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'La pregunta no existe'; END IF;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          CASE WHEN p_activo THEN 'pregunta_activar' ELSE 'pregunta_desactivar' END,
          'preguntas', p_id::text, jsonb_build_object('activo', p_activo));
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 5) Borrado definitivo de una pregunta
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_borrar_pregunta(uuid);
CREATE FUNCTION public.admin_borrar_pregunta(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_txt text; v_video uuid;
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;

  SELECT pregunta_es, video_id INTO v_txt, v_video FROM public.preguntas WHERE id = p_id;
  IF v_video IS NULL THEN RAISE EXCEPTION 'La pregunta no existe'; END IF;

  DELETE FROM public.preguntas WHERE id = p_id;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          'pregunta_borrar', 'preguntas', p_id::text,
          jsonb_build_object('video_id', v_video, 'pregunta', left(COALESCE(v_txt,''), 120)));
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Permisos: solo usuarios autenticados pueden invocar; es_admin() filtra.
-- ─────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.admin_videos_evaluacion()               FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_listar_preguntas(uuid)            FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_guardar_pregunta(uuid,uuid,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_pregunta_activo(uuid,boolean)     FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_borrar_pregunta(uuid)             FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_videos_evaluacion()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_preguntas(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_guardar_pregunta(uuid,uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_pregunta_activo(uuid,boolean)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_borrar_pregunta(uuid)             TO authenticated;

-- Verificación segura (NO ejecuta RPCs protegidas: eso haría rollback):
-- SELECT proname FROM pg_proc
-- WHERE proname IN ('admin_videos_evaluacion','admin_listar_preguntas',
--                   'admin_guardar_pregunta','admin_pregunta_activo','admin_borrar_pregunta');
