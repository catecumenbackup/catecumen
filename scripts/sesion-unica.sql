-- sesion-unica.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Una sola sesión activa por cuenta ("gana el dispositivo nuevo").
--
-- Mecanismo: cada cuenta guarda el token de su sesión vigente en
-- usuarios.sesion_token. Al iniciar sesión, el dispositivo RECLAMA la sesión
-- (sobrescribe el token → expulsa a los demás). Cada cierto tiempo el cliente
-- VALIDA su token; si ya no coincide, significa que alguien entró en otro
-- dispositivo y el cliente cierra la sesión local.
--
-- Las cuentas de pareja (papás/padrinos) son cuentas independientes, cada una
-- con su propio token, así que la regla aplica a cada quien por separado.
--
-- Ambas funciones son SECURITY DEFINER acotadas a auth.uid() (a prueba de
-- manipulación: un usuario solo puede tocar su propia fila). Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS sesion_token text;
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS sesion_actualizada timestamptz;

-- RECLAMAR: el dispositivo que acaba de iniciar sesión fija su token como el
-- vigente, pase lo que pase (así "gana el dispositivo nuevo").
CREATE OR REPLACE FUNCTION public.reclamar_sesion(p_token text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL OR p_token IS NULL OR p_token = '' THEN RETURN 'sin_sesion'; END IF;
  UPDATE public.usuarios
     SET sesion_token = p_token, sesion_actualizada = now()
   WHERE id = v_uid;
  RETURN 'ok';
END;
$$;

-- VALIDAR: comprueba si el token del cliente sigue siendo el vigente.
--   'ok'         → es la sesión vigente (o no hay perfil: admins/otros → no bloquear)
--   'conflicto'  → otra sesión tomó el control → el cliente debe cerrar sesión
-- Si el token vigente es NULL (sesión previa a esta función, o sin reclamar),
-- lo adopta el primero que valide, para no expulsar a una sesión legítima.
CREATE OR REPLACE FUNCTION public.validar_sesion(p_token text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid(); v_cur text; v_found boolean;
BEGIN
  IF v_uid IS NULL OR p_token IS NULL OR p_token = '' THEN RETURN 'ok'; END IF;
  SELECT sesion_token, true INTO v_cur, v_found
    FROM public.usuarios WHERE id = v_uid;
  IF NOT v_found THEN RETURN 'ok'; END IF;              -- no hay perfil → no bloquear
  IF v_cur IS NULL OR v_cur = p_token THEN
    UPDATE public.usuarios
       SET sesion_token = p_token, sesion_actualizada = now()
     WHERE id = v_uid;
    RETURN 'ok';
  END IF;
  RETURN 'conflicto';
END;
$$;

GRANT EXECUTE ON FUNCTION public.reclamar_sesion(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_sesion(text)  TO authenticated;
