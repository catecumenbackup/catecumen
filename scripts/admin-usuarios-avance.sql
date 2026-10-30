-- admin-usuarios-avance.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Enriquece la lista de usuarios del panel con:
--   · sacramentos_elegidos / sacs_beneficiario (para mostrar sacramento o rol)
--   · formacion_inicio  → fecha de inicio de curso
--   · ultima_sesion     → última actividad (max accesos_video.actualizado)
--   · ultimo_video      → último video abierto (sacramento · #orden)
--   · avance_pct        → % de lecciones APROBADAS sobre el total de su secuencia
-- Return type sin cambios (json) → CREATE OR REPLACE seguro. Idempotente.
-- Avance: lecciones distintas (sacramento, orden), ignorando el idioma.
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
             u.sacramentos_elegidos, u.sacs_beneficiario, u.formacion_inicio,
             u.pago_realizado, u.importe_pagado, u.moneda_pago, u.beca_solidaria, u.beca_esperanza,
             u.formacion_gratuita, u.email_confirmado, u.suspendido, u.suspendido_motivo, u.eliminado,
             CASE WHEN u.beca_solidaria OR u.beca_esperanza OR u.formacion_gratuita THEN 'becado'
                  WHEN u.pago_realizado THEN 'pagado' ELSE 'pendiente' END AS estado_pago,
             (SELECT count(*) FROM public.inscripciones i WHERE i.usuario_id = u.id) AS num_inscripciones,
             (SELECT count(*) FROM public.constancias c WHERE c.usuario_id = u.id AND c.activo) AS num_constancias,
             (SELECT max(av.actualizado) FROM public.accesos_video av WHERE av.usuario_id = u.id) AS ultima_sesion,
             (SELECT sac.nombre_es || ' · #' || v.orden
                FROM public.accesos_video av
                JOIN public.videos v ON v.id = av.video_id
                LEFT JOIN public.sacramentos sac ON sac.id = v.sacramento_id
               WHERE av.usuario_id = u.id
               ORDER BY av.actualizado DESC NULLS LAST LIMIT 1) AS ultimo_video,
             (SELECT CASE WHEN tot.n > 0 THEN round(100.0 * comp.n / tot.n)::int ELSE 0 END
                FROM (SELECT count(DISTINCT v.sacramento_id::text || '-' || v.orden::text) AS n
                        FROM public.videos v
                        JOIN public.inscripciones i ON i.sacramento_id = v.sacramento_id
                       WHERE i.usuario_id = u.id AND v.activo) tot,
                     (SELECT count(DISTINCT v.sacramento_id::text || '-' || v.orden::text) AS n
                        FROM public.progreso_videos p
                        JOIN public.inscripciones i ON i.id = p.inscripcion_id
                        JOIN public.videos v ON v.id = p.video_id
                       WHERE i.usuario_id = u.id AND p.aprobado) comp
             ) AS avance_pct
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
