-- scripts/precio-esperado.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Precio AUTORITATIVO calculado en el servidor, para que crear-sesion-pago no
-- confíe en el `importe` que manda el cliente (que podía enviar importe:1 y
-- cobrar de menos). Réplica EXACTA de la matemática del cliente
-- (RegisterForm.getPriceBreakdown + logic.aplicarBeca):
--
--   • catecumeno            → suma de la cuota de cada sacramento elegido
--                             (bautismo/confirmacion/primera_comunion), cada una
--                             con la Beca de Esperanza (20%) si aplica.
--   • prebautismal / padrino→ cuota única = columna `prebautismal` (el cliente usa
--                             `pre` para AMBOS), con Beca de Esperanza si aplica.
--   • catequista            → columna `catequista` (sin beca).
--
-- La Beca Solidaria (internado) y el catequista de organización afiliada NO pasan
-- por aquí: son ruta gratuita (handleFree), no crean sesión de pago.
--
-- Fuente de datos: tabla `cuotasporpais` (misma que carga el frontend), indexada
-- por nombre de país (`pais`) y `activo = true`.
--
-- Seguridad: SECURITY DEFINER, search_path fijo, solo `service_role` (la usan las
-- edge functions con service-role). No se expone a anon/authenticated.
--
-- Nota: aplicarBeca = round(base * 0.8) ⇒ redondeo a entero, igual que Math.round.
-- Idempotente. Correr en Supabase → SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.precio_esperado(
  p_pais           text,
  p_user_type      text,
  p_sacs           text[]  default '{}',
  p_beca_esperanza boolean default false
)
returns table(total numeric, moneda text)
language plpgsql
security definer
set search_path = public
as $$
declare
  r      record;
  factor numeric := case when p_beca_esperanza then 0.8 else 1 end;
  suma   numeric := 0;
  k      text;
begin
  -- Alias `cp` obligatorio: sin él, la columna `moneda` es ambigua con el
  -- parámetro de salida `moneda` (ERROR 42702 en tiempo de ejecución).
  select cp.bautismo, cp.confirmacion, cp.primera_comunion, cp.prebautismal,
         cp.catequista, cp.padrino, cp.moneda
    into r
  from cuotasporpais cp
  where cp.pais = p_pais and cp.activo = true
  limit 1;

  -- Sin fila para ese país: NO devolvemos nada. El llamante (edge function)
  -- interpreta "sin resultado" como "no puedo validar" y conserva el importe del
  -- cliente (el frontend usó el respaldo PPP local). Ver nota en crear-sesion-pago.
  if not found then
    return;
  end if;

  if p_user_type = 'catecumeno' then
    foreach k in array coalesce(p_sacs, '{}'::text[]) loop
      if    k = 'bautismo'         then suma := suma + round(coalesce(r.bautismo,0)         * factor);
      elsif k = 'confirmacion'     then suma := suma + round(coalesce(r.confirmacion,0)     * factor);
      elsif k = 'primera_comunion' then suma := suma + round(coalesce(r.primera_comunion,0) * factor);
      end if;
    end loop;
  elsif p_user_type = 'prebautismal' or p_user_type = 'padrino' then
    suma := round(coalesce(r.prebautismal,0) * factor);
  elsif p_user_type = 'catequista' then
    suma := coalesce(r.catequista,0);  -- sin beca
  else
    return;  -- tipo desconocido → sin validación
  end if;

  total  := suma;
  moneda := r.moneda;
  return next;
end;
$$;

revoke all on function public.precio_esperado(text,text,text[],boolean) from public, anon, authenticated;
grant execute on function public.precio_esperado(text,text,text[],boolean) to service_role;
