-- scripts/preinscripcion-fase2.sql
-- PREINSCRIPCIÓN — Fase 2: CONVERSIÓN al abrir la plataforma.
-- Cuando el admin apaga el modo preinscripción, los preinscritos completan el
-- pago para activarse. La activación real (estado_inscripcion='activo') la hacen
-- las edge functions tras confirmar el pago (crear-sesion-pago/activar-pago/
-- stripe-webhook, rama "conversion"). Aquí solo van las piezas de BD.
-- Requiere haber corrido scripts/preinscripcion.sql. Idempotente.

-- Precio previsto guardado al preinscribirse (para cobrar al abrir sin recalcular).
alter table public.usuarios add column if not exists importe_previsto jsonb;

-- ── Activación GRATUITA (beca 100%) hecha por el propio usuario ──────────────
-- Solo funciona si su registro quedó marcado como formación gratuita; los de
-- pago DEBEN pasar por Stripe (esta RPC los rechaza). SECURITY DEFINER sobre
-- auth.uid(): a prueba de manipulación (no recibe id ajeno).
create or replace function public.activar_mi_preinscripcion()
returns text language plpgsql security definer set search_path = public as $$
declare v_estado text; v_gratis boolean;
begin
  select estado_inscripcion, coalesce(formacion_gratuita,false)
    into v_estado, v_gratis
    from public.usuarios where id = auth.uid();
  if v_estado is null then raise exception 'sin perfil'; end if;
  if v_estado <> 'preinscrito' then return 'ya activo'; end if;
  if not v_gratis then raise exception 'requiere pago'; end if;
  update public.usuarios
     set estado_inscripcion = 'activo', pago_realizado = true, importe_pagado = 0
   where id = auth.uid();
  return 'activado';
end; $$;
grant execute on function public.activar_mi_preinscripcion() to authenticated;

-- ── Activación MANUAL por el admin (becas, cortesías, casos especiales) ──────
create or replace function public.admin_activar_preinscrito(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_email text; v_nombre text;
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  select a.email into v_email from public.admins a where a.user_id = auth.uid();
  update public.usuarios
     set estado_inscripcion = 'activo'
   where id = p_id and estado_inscripcion = 'preinscrito'
   returning nombre into v_nombre;
  if v_nombre is null then raise exception 'preinscrito no encontrado'; end if;
  insert into public.admin_log(admin_id, admin_email, accion, entidad, entidad_id, detalle)
  values (auth.uid(), v_email, 'preinscrito_activar', 'usuarios', p_id::text, to_jsonb(v_nombre));
end; $$;
grant execute on function public.admin_activar_preinscrito(uuid) to authenticated;
