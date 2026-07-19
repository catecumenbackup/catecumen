-- ============================================================================
-- Etapa 6: extender public.preguntas a los 6 idiomas de la plataforma
-- (hoy solo tiene columnas _es/_en; el _en además es un placeholder que
-- duplica el español). Agrega fr/de/pt/it y deja _en listo para ser
-- reemplazado por traducción real en la Etapa 6b (UPDATE).
-- Ejecutar en el SQL Editor de Supabase.
-- ============================================================================

ALTER TABLE public.preguntas
  ADD COLUMN IF NOT EXISTS pregunta_fr text,
  ADD COLUMN IF NOT EXISTS pregunta_de text,
  ADD COLUMN IF NOT EXISTS pregunta_pt text,
  ADD COLUMN IF NOT EXISTS pregunta_it text,
  ADD COLUMN IF NOT EXISTS opcion_a_fr text,
  ADD COLUMN IF NOT EXISTS opcion_a_de text,
  ADD COLUMN IF NOT EXISTS opcion_a_pt text,
  ADD COLUMN IF NOT EXISTS opcion_a_it text,
  ADD COLUMN IF NOT EXISTS opcion_b_fr text,
  ADD COLUMN IF NOT EXISTS opcion_b_de text,
  ADD COLUMN IF NOT EXISTS opcion_b_pt text,
  ADD COLUMN IF NOT EXISTS opcion_b_it text,
  ADD COLUMN IF NOT EXISTS opcion_c_fr text,
  ADD COLUMN IF NOT EXISTS opcion_c_de text,
  ADD COLUMN IF NOT EXISTS opcion_c_pt text,
  ADD COLUMN IF NOT EXISTS opcion_c_it text,
  ADD COLUMN IF NOT EXISTS opcion_d_fr text,
  ADD COLUMN IF NOT EXISTS opcion_d_de text,
  ADD COLUMN IF NOT EXISTS opcion_d_pt text,
  ADD COLUMN IF NOT EXISTS opcion_d_it text;

-- Verificación:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='preguntas' ORDER BY ordinal_position;
