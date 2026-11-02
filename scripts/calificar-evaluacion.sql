-- calificar-evaluacion.sql — SOLO la función de calificación server-side.
-- NO re-crear obtener_preguntas (la versión i18n de etapa6c ya es la correcta).
-- Idempotente (CREATE OR REPLACE).

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
