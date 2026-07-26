-- ============================================================================
-- MÓDULO 0 · KERIGMA — alta del sacramento/sección en la base de datos
-- Ejecutar en el SQL Editor de Supabase.
--
-- El frontend ya trata `kerigma` como una sección (SEC_META + buildSeq). Para
-- que el PUENTE frontend↔BD funcione (reproducir el video real y guardar
-- progreso/evaluación), la tabla `sacramentos` necesita una fila con
-- slug = 'kerigma'. El VIDEO y la EVALUACIÓN se cargan después desde el panel:
--   Panel → Videos → crear video bajo "Kerigma" (orden 1, título, URL)
--   Panel → Evaluaciones → elegir ese video → agregar preguntas
--
-- Defensivo: la tabla `sacramentos` fue migrada a i18n (`nombre_es/nombre_en`);
-- el `schema.sql` del repo aún muestra la columna heredada `nombre`. Este bloque
-- funciona exista o no la columna `nombre`.
-- ============================================================================

DO $$
DECLARE tiene_nombre boolean;
BEGIN
  -- Asegurar columnas i18n (idempotente)
  ALTER TABLE public.sacramentos ADD COLUMN IF NOT EXISTS nombre_es text;
  ALTER TABLE public.sacramentos ADD COLUMN IF NOT EXISTS nombre_en text;

  IF NOT EXISTS (SELECT 1 FROM public.sacramentos WHERE slug = 'kerigma') THEN
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'sacramentos'
        AND column_name = 'nombre'
    ) INTO tiene_nombre;

    IF tiene_nombre THEN
      INSERT INTO public.sacramentos (slug, nombre, nombre_es, nombre_en, orden, activo)
      VALUES ('kerigma', 'Kerigma', 'Kerigma', 'Kerygma', 0, true);
    ELSE
      INSERT INTO public.sacramentos (slug, nombre_es, nombre_en, orden, activo)
      VALUES ('kerigma', 'Kerigma', 'Kerygma', 0, true);
    END IF;
  END IF;
END $$;

-- Verificación:
-- SELECT slug, nombre_es, nombre_en, orden, activo
-- FROM public.sacramentos WHERE slug = 'kerigma';
