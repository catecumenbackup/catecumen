-- admin-usuarios-telefono.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Añade el teléfono (código de país + número) a la lista de usuarios del panel.
-- Recrea admin_listar_usuarios agregando u.codigo_pais_tel y u.telefono al SELECT.
-- Return type sin cambios (json) → CREATE OR REPLACE es seguro. Idempotente.
-- (admin_ficha_usuario ya devuelve telefono; la lista no lo hacía.)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_listar_usuarios(
  p_busqueda text DEFAULT NULL, p_pais text DEFAULT NULL, p_idioma text DEFAULT NULL,
  p_tipo text DEFAULT NULL, p_pago text DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  RETURN (
    SELECT COALESCE(json_agg(t ORDER BY t.suspendido DESC, t.nombre), '[]'::json)
    FROM (
      SELECT u.id, u.nombre, u.apellido, u.email, u.tipo_usuario, u.pais_residencia, u.idioma, u.registro_id,
             u.codigo_pais_tel, u.telefono,
             u.pago_realizado, u.importe_pagado, u.moneda_pago, u.beca_solidaria, u.beca_esperanza,
             u.formacion_gratuita, u.email_confirmado, u.suspendido, u.suspendido_motivo, u.eliminado,
             CASE WHEN u.beca_solidaria OR u.beca_esperanza OR u.formacion_gratuita THEN 'becado'
                  WHEN u.pago_realizado THEN 'pagado' ELSE 'pendiente' END AS estado_pago,
             (SELECT count(*) FROM public.inscripciones i WHERE i.usuario_id = u.id) AS num_inscripciones,
             (SELECT count(*) FROM public.constancias c WHERE c.usuario_id = u.id AND c.activo) AS num_constancias
      FROM public.usuarios u
      WHERE (p_busqueda IS NULL OR p_busqueda = '' OR u.nombre ILIKE '%'||p_busqueda||'%'
             OR u.apellido ILIKE '%'||p_busqueda||'%' OR u.email ILIKE '%'||p_busqueda||'%'
             OR u.registro_id ILIKE '%'||p_busqueda||'%')
        AND (p_pais   IS NULL OR p_pais   = '' OR u.pais_residencia = p_pais)
        AND (p_idioma IS NULL OR p_idioma = '' OR u.idioma = p_idioma)
        AND (p_tipo   IS NULL OR p_tipo   = '' OR u.tipo_usuario = p_tipo)
        AND (p_pago   IS NULL OR p_pago   = '' OR CASE WHEN u.beca_solidaria OR u.beca_esperanza OR u.formacion_gratuita THEN 'becado'
                  WHEN u.pago_realizado THEN 'pagado' ELSE 'pendiente' END = p_pago)
    ) t
  );
END;
$function$;
