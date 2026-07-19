-- ============================================================================
-- Etapa 3: RPC para calificar evaluaciones en el SERVIDOR.
-- Ejecutar en el SQL Editor de Supabase (rol postgres / dueño de las tablas,
-- para que SECURITY DEFINER pueda leer/escribir bypaseando RLS).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1) obtener_preguntas(p_video_id)
--    Devuelve las preguntas y opciones de un video SIN respuesta_correcta.
--    Solo para usuarios autenticados Y con una inscripción activa en el
--    sacramento al que pertenece el video (evita fugar el banco completo
--    de preguntas de sacramentos que el usuario no cursa/pagó).
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.obtener_preguntas(p_video_id uuid)
RETURNS TABLE (
  id           uuid,
  pregunta_es  text,
  pregunta_en  text,
  opcion_a_es  text, opcion_a_en text,
  opcion_b_es  text, opcion_b_en text,
  opcion_c_es  text, opcion_c_en text,
  opcion_d_es  text, opcion_d_en text,
  puntaje      smallint,
  orden        smallint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.videos v
    JOIN public.inscripciones i ON i.sacramento_id = v.sacramento_id
    WHERE v.id = p_video_id AND i.usuario_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'No tienes una inscripción activa para este video';
  END IF;

  RETURN QUERY
  SELECT p.id, p.pregunta_es, p.pregunta_en,
         p.opcion_a_es, p.opcion_a_en,
         p.opcion_b_es, p.opcion_b_en,
         p.opcion_c_es, p.opcion_c_en,
         p.opcion_d_es, p.opcion_d_en,
         p.puntaje, p.orden
  FROM public.preguntas p
  WHERE p.video_id = p_video_id AND p.activo = true
  ORDER BY p.orden;
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_preguntas(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_preguntas(uuid) TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────
-- 2) calificar_evaluacion(p_video_id, p_respuestas)
--    p_respuestas: jsonb { "<preguntas.id>": "a"|"b"|"c"|"d", ... }
--    Compara SIEMPRE en el servidor contra preguntas.respuesta_correcta,
--    registra el intento en intentos_evaluacion y refleja el resultado en
--    progreso_videos (única vía que puede marcar `aprobado`; ver Etapa 4).
--    Devuelve solo {puntaje, aprobado} — nunca las respuestas correctas.
--
--    El puntaje se normaliza a escala 0-10 (puntos obtenidos / puntos
--    totales activos del video * 10), igual que el cálculo actual del
--    cliente, pero robusto si en el futuro cambia el número de preguntas
--    o su ponderación por video.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.calificar_evaluacion(p_video_id uuid, p_respuestas jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usuario_id       uuid := auth.uid();
  v_inscripcion_id   uuid;
  v_puntos_obtenidos numeric;
  v_puntos_totales   numeric;
  v_score            numeric;
  v_aprobado         boolean;
BEGIN
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT i.id INTO v_inscripcion_id
  FROM public.inscripciones i
  JOIN public.videos v ON v.sacramento_id = i.sacramento_id
  WHERE v.id = p_video_id AND i.usuario_id = v_usuario_id;

  IF v_inscripcion_id IS NULL THEN
    RAISE EXCEPTION 'No tienes una inscripción activa para este video';
  END IF;

  SELECT
    COALESCE(SUM(p.puntaje) FILTER (
      WHERE p_respuestas ->> p.id::text = p.respuesta_correcta
    ), 0),
    COALESCE(SUM(p.puntaje), 0)
  INTO v_puntos_obtenidos, v_puntos_totales
  FROM public.preguntas p
  WHERE p.video_id = p_video_id AND p.activo = true;

  IF v_puntos_totales = 0 THEN
    RAISE EXCEPTION 'Este video no tiene preguntas configuradas';
  END IF;

  v_score    := ROUND((v_puntos_obtenidos / v_puntos_totales) * 10, 1);
  v_aprobado := v_score >= 8;

  INSERT INTO public.intentos_evaluacion
    (inscripcion_id, video_id, puntaje, puntaje_maximo, respuestas, aprobado)
  VALUES
    (v_inscripcion_id, p_video_id, v_score, 10.0, p_respuestas, v_aprobado);

  -- Refleja el resultado en progreso_videos. Replica EXACTAMENTE el
  -- comportamiento actual de markEvalResult en App.jsx:
  --   - aprobado  -> aprobado=true, visto=true, fecha_aprobado=now()
  --   - reprobado -> aprobado=false (visto y fecha_aprobado NO se tocan)
  INSERT INTO public.progreso_videos (inscripcion_id, video_id, visto, aprobado, fecha_aprobado)
  VALUES (v_inscripcion_id, p_video_id, v_aprobado, v_aprobado,
          CASE WHEN v_aprobado THEN now() ELSE NULL END)
  ON CONFLICT (inscripcion_id, video_id) DO UPDATE SET
    aprobado       = EXCLUDED.aprobado,
    visto          = CASE WHEN EXCLUDED.aprobado THEN true ELSE public.progreso_videos.visto END,
    fecha_aprobado = CASE WHEN EXCLUDED.aprobado THEN now() ELSE public.progreso_videos.fecha_aprobado END;

  RETURN jsonb_build_object('puntaje', v_score, 'aprobado', v_aprobado);
END;
$$;

REVOKE ALL ON FUNCTION public.calificar_evaluacion(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.calificar_evaluacion(uuid, jsonb) TO authenticated;
