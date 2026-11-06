-- admin-usuarios-fecha-registro.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Añade la FECHA DE INSCRIPCIÓN del usuario a la lista del panel de admin.
-- Recrea admin_listar_usuarios agregando u.created_at AS fecha_registro al SELECT.
-- Return type sin cambios (json) → CREATE OR REPLACE es seguro. Idempotente.
-- Nota: usuarios.created_at se añadió en preinscripcion.sql con DEFAULT now(); para
-- cuentas creadas ANTES de esa migración, refleja la fecha de la migración, no el
-- alta real (las creadas después sí son exactas).
-- NO incluye ninguna llamada a RPC protegida por es_admin() (evita rollback en SQL Editor).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_listar_usuarios(
  p_busqueda text DEFAULT NULL::text, p_pais text DEFAULT NULL::text, p_idioma text DEFAULT NULL::text,
  p_tipo text DEFAULT NULL::text, p_pago text DEFAULT NULL::text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  IF NOT public.es_admin() THEN RAISE EXCEPTION 'no autorizado'; END IF;
  RETURN (
    SELECT COALESCE(json_agg(t ORDER BY t.suspendido DESC, t.nombre), '[]'::json)
    FROM (
      SELECT u.id, u.nombre, u.apellido, u.email, u.tipo_usuario, u.pais_residencia, u.idioma, u.registro_id,
             u.codigo_pais_tel, u.telefono, u.sacramentos_elegidos, u.sacs_beneficiario, u.formacion_inicio,
             u.created_at AS fecha_registro,
             u.pago_realizado, u.importe_pagado, u.moneda_pago, u.beca_solidaria, u.beca_esperanza,
             u.formacion_gratuita, u.email_confirmado, u.suspendido, u.suspendido_motivo, u.eliminado,
             CASE WHEN u.beca_solidaria OR u.beca_esperanza OR u.formacion_gratuita THEN 'becado'
                  WHEN u.pago_realizado THEN 'pagado' ELSE 'pendiente' END AS estado_pago,
             (SELECT count(*) FROM public.inscripciones i WHERE i.usuario_id = u.id) AS num_inscripciones,
             (SELECT count(*) FROM public.constancias c WHERE c.usuario_id = u.id AND c.activo) AS num_constancias,
             (SELECT max(av.actualizado) FROM public.accesos_video av WHERE av.usuario_id = u.id) AS ultima_sesion,
             (SELECT sac.nombre_es || ' · #' || v.orden FROM public.accesos_video av JOIN public.videos v ON v.id = av.video_id
                LEFT JOIN public.sacramentos sac ON sac.id = v.sacramento_id
                WHERE av.usuario_id = u.id ORDER BY av.actualizado DESC NULLS LAST LIMIT 1) AS ultimo_video,
             (SELECT CASE WHEN tot.n > 0 THEN round(100.0 * comp.n / tot.n)::int ELSE 0 END
                FROM (SELECT count(DISTINCT v.sacramento_id::text || '-' || v.orden::text) AS n
                        FROM public.videos v JOIN public.inscripciones i ON i.sacramento_id = v.sacramento_id
                        WHERE i.usuario_id = u.id AND v.activo) tot,
                     (SELECT count(DISTINCT v.sacramento_id::text || '-' || v.orden::text) AS n
                        FROM public.progreso_videos p JOIN public.inscripciones i ON i.id = p.inscripcion_id
                        JOIN public.videos v ON v.id = p.video_id
                        WHERE i.usuario_id = u.id AND p.aprobado) comp) AS avance_pct
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
