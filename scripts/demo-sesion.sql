-- demo-sesion.sql — Sesión de DEMOSTRACIÓN pública (sin crear cuenta).
-- ─────────────────────────────────────────────────────────────────────────────
-- El visitante entra por el botón de la bienvenida o por catecumen.com/?demo=1,
-- ve UN video, responde la encuesta y hace la evaluación, SIN registrarse y SIN
-- que se guarde ninguna respuesta personal. Solo se llevan contadores ANÓNIMOS
-- agregados (cuántos iniciaron / completaron / aprobaron, y el promedio).
--
-- Config (qué video y on/off): ajustes('demo') = {activa, slug, orden}.
--   · La edita el admin con la RPC existente admin_guardar_ajuste('demo', {...}).
--   · La lee la edge function `demo-sesion` (service role) para firmar el video.
-- Contadores: ajustes('demo_contadores') = {inicios,completos,aprobados,suma,n}.
-- Idempotente. No crea tablas nuevas (reutiliza `ajustes`).
-- ─────────────────────────────────────────────────────────────────────────────

-- Semillas (no pisan lo que ya exista).
INSERT INTO public.ajustes(clave, valor)
VALUES ('demo', '{"activa":false,"slug":"kerigma","orden":1}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

INSERT INTO public.ajustes(clave, valor)
VALUES ('demo_contadores', '{"inicios":0,"completos":0,"aprobados":0,"suma":0,"n":0}'::jsonb)
ON CONFLICT (clave) DO NOTHING;

-- Registrar un evento ANÓNIMO de la demo. Pública (anon + authenticated).
--   p_evento : 'inicio' | 'completo' | 'aprobado'
--   p_puntaje: 0..10 al terminar la evaluación (para el promedio); NULL si no aplica.
-- SECURITY DEFINER: el visitante anónimo no tiene permiso directo sobre `ajustes`;
-- esta función es la única vía y solo toca la fila de contadores (no personales).
CREATE OR REPLACE FUNCTION public.demo_registrar(p_evento text, p_puntaje numeric DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v jsonb;
BEGIN
  SELECT valor INTO v FROM public.ajustes WHERE clave = 'demo_contadores';
  IF v IS NULL THEN v := '{"inicios":0,"completos":0,"aprobados":0,"suma":0,"n":0}'::jsonb; END IF;

  IF p_evento = 'inicio' THEN
    v := jsonb_set(v, '{inicios}',   to_jsonb( COALESCE((v->>'inicios')::int,0)   + 1 ));
  ELSIF p_evento = 'completo' THEN
    v := jsonb_set(v, '{completos}', to_jsonb( COALESCE((v->>'completos')::int,0) + 1 ));
  ELSIF p_evento = 'aprobado' THEN
    v := jsonb_set(v, '{aprobados}', to_jsonb( COALESCE((v->>'aprobados')::int,0) + 1 ));
  END IF;

  IF p_puntaje IS NOT NULL THEN
    v := jsonb_set(v, '{suma}', to_jsonb( ROUND(COALESCE((v->>'suma')::numeric,0) + p_puntaje, 2) ));
    v := jsonb_set(v, '{n}',    to_jsonb( COALESCE((v->>'n')::int,0) + 1 ));
  END IF;

  UPDATE public.ajustes SET valor = v WHERE clave = 'demo_contadores';
END;
$$;

GRANT EXECUTE ON FUNCTION public.demo_registrar(text, numeric) TO anon, authenticated;

-- Lectura de contadores para el panel: se reutiliza la RPC pública obtener_ajuste
-- ('demo_contadores'); son solo números agregados, sin dato personal. El admin
-- calcula el promedio = suma / n en el cliente.
