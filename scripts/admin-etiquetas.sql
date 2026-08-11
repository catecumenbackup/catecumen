-- ============================================================================
-- ETIQUETAS DE LAS OPCIONES DE REGISTRO ("Próximamente", etc.)
-- Ejecutar en el SQL Editor de Supabase (rol dueño de las tablas).
-- Requiere: public.es_admin(), public.admin_log.
--
-- Pone una etiqueta sobre los botones del modal de filtrado (el que pregunta
-- "¿qué quieres hacer?"). El administrador decide en cuáles se muestra y con
-- qué texto. El modal se ve SIN iniciar sesión → lectura pública (anon).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.opciones_etiquetas (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clave         text NOT NULL UNIQUE,     -- debe coincidir con la opción del modal
  texto_es text, texto_en text, texto_fr text,
  texto_de text, texto_pt text, texto_it text,
  color_fondo   text NOT NULL DEFAULT '#B3261E',   -- rojo
  color_texto   text NOT NULL DEFAULT '#E5C97A',   -- dorado
  activo        boolean NOT NULL DEFAULT false,    -- false = no se muestra
  bloquea       boolean NOT NULL DEFAULT true,      -- true = además inhabilita la opción
  creado        timestamptz DEFAULT now()
);
-- Por si la tabla ya existía sin la columna:
ALTER TABLE public.opciones_etiquetas ADD COLUMN IF NOT EXISTS bloquea boolean NOT NULL DEFAULT true;

-- ─────────────────────────────────────────────────────────────────────────
-- Semilla: una fila por cada opción del modal, con "Próximamente" traducido.
-- Todas nacen DESACTIVADAS: enciendes solo las que quieras desde el panel.
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.opciones_etiquetas
  (clave, texto_es, texto_en, texto_fr, texto_de, texto_pt, texto_it, activo) VALUES
  ('catecumeno',       'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('prebautismal',     'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('padrino',          'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('catequista',       'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('parroquia',        'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('diocesis',         'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('centroadiccion',   'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  -- Sacramentos del segundo modal (selección de sacramento):
  ('bautismo',         'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('confirmacion',     'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  ('primera_comunion', 'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false),
  -- Botón "Buscar parroquia afiliada" de la pantalla de bienvenida:
  ('buscar_parroquia', 'Próximamente','Coming soon','Bientôt disponible','Demnächst','Em breve','Prossimamente', false)
ON CONFLICT (clave) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS: lectura pública solo de etiquetas activas.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.opciones_etiquetas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS etiquetas_lectura_publica ON public.opciones_etiquetas;
CREATE POLICY etiquetas_lectura_publica ON public.opciones_etiquetas
  FOR SELECT TO anon, authenticated USING (activo = true);

-- ─────────────────────────────────────────────────────────────────────────
-- 1) Lectura pública (el modal se muestra antes de iniciar sesión)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.obtener_etiquetas_opciones();
CREATE FUNCTION public.obtener_etiquetas_opciones()
RETURNS TABLE (
  clave text,
  texto_es text, texto_en text, texto_fr text, texto_de text, texto_pt text, texto_it text,
  color_fondo text, color_texto text, bloquea boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.clave, e.texto_es, e.texto_en, e.texto_fr, e.texto_de, e.texto_pt, e.texto_it,
         e.color_fondo, e.color_texto, e.bloquea
  FROM public.opciones_etiquetas e
  WHERE e.activo = true;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 2) Admin: listar todas (incluidas las apagadas)
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_listar_etiquetas();
CREATE FUNCTION public.admin_listar_etiquetas()
RETURNS SETOF public.opciones_etiquetas
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  RETURN QUERY SELECT * FROM public.opciones_etiquetas ORDER BY clave;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 3) Admin: crear / editar etiqueta
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_guardar_etiqueta(uuid, jsonb);
CREATE FUNCTION public.admin_guardar_etiqueta(p_id uuid, p_datos jsonb)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_id uuid; v_clave text;
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;

  v_clave := lower(trim(COALESCE(p_datos->>'clave','')));
  IF v_clave = '' THEN RAISE EXCEPTION 'La clave es obligatoria'; END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.opciones_etiquetas
      (clave, texto_es, texto_en, texto_fr, texto_de, texto_pt, texto_it,
       color_fondo, color_texto, activo, bloquea)
    VALUES (v_clave,
       NULLIF(p_datos->>'texto_es',''), NULLIF(p_datos->>'texto_en',''),
       NULLIF(p_datos->>'texto_fr',''), NULLIF(p_datos->>'texto_de',''),
       NULLIF(p_datos->>'texto_pt',''), NULLIF(p_datos->>'texto_it',''),
       COALESCE(NULLIF(p_datos->>'color_fondo',''),'#B3261E'),
       COALESCE(NULLIF(p_datos->>'color_texto',''),'#E5C97A'),
       COALESCE((p_datos->>'activo')::boolean, false),
       COALESCE((p_datos->>'bloquea')::boolean, true))
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.opciones_etiquetas SET
      clave       = v_clave,
      texto_es = NULLIF(p_datos->>'texto_es',''), texto_en = NULLIF(p_datos->>'texto_en',''),
      texto_fr = NULLIF(p_datos->>'texto_fr',''), texto_de = NULLIF(p_datos->>'texto_de',''),
      texto_pt = NULLIF(p_datos->>'texto_pt',''), texto_it = NULLIF(p_datos->>'texto_it',''),
      color_fondo = COALESCE(NULLIF(p_datos->>'color_fondo',''), color_fondo),
      color_texto = COALESCE(NULLIF(p_datos->>'color_texto',''), color_texto),
      activo      = COALESCE((p_datos->>'activo')::boolean, activo),
      bloquea     = COALESCE((p_datos->>'bloquea')::boolean, bloquea)
    WHERE id = p_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'La etiqueta no existe'; END IF;
  END IF;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          CASE WHEN p_id IS NULL THEN 'etiqueta_crear' ELSE 'etiqueta_editar' END,
          'opciones_etiquetas', v_id::text,
          jsonb_build_object('clave', v_clave, 'texto_es', p_datos->>'texto_es',
                             'activo', p_datos->>'activo'));
  RETURN v_id;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4) Admin: encender / apagar una etiqueta
-- ─────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.admin_etiqueta_activo(uuid, boolean);
CREATE FUNCTION public.admin_etiqueta_activo(p_id uuid, p_activo boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  UPDATE public.opciones_etiquetas SET activo = p_activo WHERE id = p_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'La etiqueta no existe'; END IF;

  INSERT INTO public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  VALUES (auth.uid(),
          (SELECT a.email FROM public.admins a WHERE a.user_id = auth.uid()),
          CASE WHEN p_activo THEN 'etiqueta_activar' ELSE 'etiqueta_desactivar' END,
          'opciones_etiquetas', p_id::text, jsonb_build_object('activo', p_activo));
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Permisos
-- ─────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION public.obtener_etiquetas_opciones()          FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_listar_etiquetas()              FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_guardar_etiqueta(uuid, jsonb)   FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_etiqueta_activo(uuid, boolean)  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.obtener_etiquetas_opciones()        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_listar_etiquetas()            TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_guardar_etiqueta(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_etiqueta_activo(uuid,boolean) TO authenticated;

-- Verificación segura:
-- SELECT clave, texto_es, activo FROM public.opciones_etiquetas ORDER BY clave;
