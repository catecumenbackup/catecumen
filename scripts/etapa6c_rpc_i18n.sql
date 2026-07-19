-- ============================================================================
-- Etapa 6c: obtener_preguntas ahora devuelve los 6 idiomas (antes solo es/en).
-- Ejecutar DESPUÉS de etapa6_i18n_schema.sql y migracion_i18n_preguntas.sql.
--
-- Postgres no permite cambiar las columnas de RETURNS TABLE de una función
-- existente con CREATE OR REPLACE — hay que borrarla primero.
-- ============================================================================
DROP FUNCTION IF EXISTS public.obtener_preguntas(uuid);

CREATE FUNCTION public.obtener_preguntas(p_video_id uuid)
RETURNS TABLE (
  id           uuid,
  pregunta_es  text, pregunta_en text, pregunta_fr text, pregunta_de text, pregunta_pt text, pregunta_it text,
  opcion_a_es  text, opcion_a_en text, opcion_a_fr text, opcion_a_de text, opcion_a_pt text, opcion_a_it text,
  opcion_b_es  text, opcion_b_en text, opcion_b_fr text, opcion_b_de text, opcion_b_pt text, opcion_b_it text,
  opcion_c_es  text, opcion_c_en text, opcion_c_fr text, opcion_c_de text, opcion_c_pt text, opcion_c_it text,
  opcion_d_es  text, opcion_d_en text, opcion_d_fr text, opcion_d_de text, opcion_d_pt text, opcion_d_it text,
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
  SELECT p.id,
         p.pregunta_es, p.pregunta_en, p.pregunta_fr, p.pregunta_de, p.pregunta_pt, p.pregunta_it,
         p.opcion_a_es, p.opcion_a_en, p.opcion_a_fr, p.opcion_a_de, p.opcion_a_pt, p.opcion_a_it,
         p.opcion_b_es, p.opcion_b_en, p.opcion_b_fr, p.opcion_b_de, p.opcion_b_pt, p.opcion_b_it,
         p.opcion_c_es, p.opcion_c_en, p.opcion_c_fr, p.opcion_c_de, p.opcion_c_pt, p.opcion_c_it,
         p.opcion_d_es, p.opcion_d_en, p.opcion_d_fr, p.opcion_d_de, p.opcion_d_pt, p.opcion_d_it,
         p.puntaje, p.orden
  FROM public.preguntas p
  WHERE p.video_id = p_video_id AND p.activo = true
  ORDER BY p.orden;
END;
$$;

REVOKE ALL ON FUNCTION public.obtener_preguntas(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.obtener_preguntas(uuid) TO authenticated;
