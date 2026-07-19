-- ============================================================================
-- Etapa 4: RLS para que respuesta_correcta nunca sea legible desde el
-- cliente, y endurecimiento de progreso_videos para que `aprobado` solo
-- pueda escribirlo calificar_evaluacion (no un upsert directo del cliente).
-- Ejecutar en el SQL Editor de Supabase (rol postgres / dueño de las tablas).
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1) public.preguntas: acceso denegado por defecto para authenticated/anon.
--    Toda lectura pasa por obtener_preguntas() / calificar_evaluacion()
--    (SECURITY DEFINER, dueñas de la tabla, bypasean RLS).
-- ─────────────────────────────────────────────────────────────────────────

-- Elimina cualquier policy previa sobre preguntas (nombre desconocido/legado)
-- para partir de una base limpia, sin asumir cómo se llamaba.
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'preguntas'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.preguntas', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;

-- Sin políticas para authenticated/anon => RLS deniega TODO acceso directo.
-- Refuerzo con REVOKE explícito de privilegios a nivel de tabla (defensa en
-- profundidad, por si el proyecto tenía GRANT ALL heredado del setup inicial).
REVOKE ALL ON public.preguntas FROM authenticated, anon;


-- ─────────────────────────────────────────────────────────────────────────
-- 2) public.progreso_videos: el cliente conserva la capacidad de marcar
--    `visto` (necesaria para markVideoWatched), pero pierde la capacidad
--    de escribir `aprobado` / `fecha_aprobado` directamente — así
--    flushProgress() y cualquier upsert manual desde consola ya no pueden
--    "aprobar" una evaluación sin pasar por calificar_evaluacion().
-- ─────────────────────────────────────────────────────────────────────────

-- Incluye inscripcion_id/video_id: el upsert de PostgREST genera
-- ON CONFLICT (...) DO UPDATE SET sobre TODAS las columnas del payload,
-- incluidas las de conflicto — sin privilegio ahí, el upsert entero falla
-- con "permission denied for table" aunque visto/fecha_* sí lo tengan.
REVOKE UPDATE ON public.progreso_videos FROM authenticated;
GRANT UPDATE (inscripcion_id, video_id, visto, fecha_inicio_vista, fecha_fin_vista)
  ON public.progreso_videos TO authenticated;

-- Nota: no se toca RLS (USING/WITH CHECK) de progreso_videos aquí — solo el
-- privilegio de columna. La política de fila existente (dueño de la
-- inscripción) sigue aplicando igual. INSERT no se restringe porque el
-- cliente nunca incluye `aprobado` en su upsert inicial (solo lo hace
-- flushProgress, que se corrige en la Etapa 5 para dejar de enviarlo).


-- ─────────────────────────────────────────────────────────────────────────
-- Verificación rápida (ejecutar aparte, no forma parte de la migración):
--
--   SELECT * FROM pg_policies WHERE tablename='preguntas';         -- debe estar vacío
--   SELECT has_table_privilege('authenticated','public.preguntas','SELECT'); -- false
--   SELECT has_column_privilege('authenticated','public.progreso_videos','aprobado','UPDATE'); -- false
--   SELECT has_column_privilege('authenticated','public.progreso_videos','visto','UPDATE');    -- true
-- ─────────────────────────────────────────────────────────────────────────
