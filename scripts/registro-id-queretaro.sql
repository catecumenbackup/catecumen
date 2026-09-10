-- scripts/registro-id-queretaro.sql
--
-- Cambia el código de registro de la Diócesis de Querétaro:
--   'TEST-DIO-QRO'  →  'MX-DIO-2026-000001'
--
-- Es el último rastro del sembrado de prueba. Importa porque NO es interno:
-- es el código que sus catequistas escriben al registrarse (RPC
-- verificar_org_registro), así que se lee en pantalla y dice «TEST».
--
-- El riesgo del cambio es dejar colgado a quien ya se hubiera registrado con
-- el código viejo. La verificación del 10-sep-2026 dio 0 usuarios con un
-- registro_id 'TEST-%', así que no hay a quién dejar colgado — pero el
-- bloque de abajo lo vuelve a comprobar en el momento de correr y aborta si
-- alguien apareció mientras tanto.
--
-- Idempotente: si ya se corrió, no encuentra nada que cambiar.

begin;

do $$
declare
  v_usuarios integer;
  v_choque   integer;
begin
  select count(*) into v_usuarios
    from public.usuarios where registro_id = 'TEST-DIO-QRO';
  if v_usuarios > 0 then
    raise exception
      'Hay % usuario(s) registrados con TEST-DIO-QRO. Cambiar el código los dejaría colgados: reasígnalos primero.', v_usuarios;
  end if;

  select count(*) into v_choque
    from (select registro_id from public.diocesis
          union all
          select registro_id from public.parroquias) t
   where registro_id = 'MX-DIO-2026-000001';
  if v_choque > 0 then
    raise exception 'El código MX-DIO-2026-000001 ya está en uso.';
  end if;
end $$;

update public.diocesis
   set registro_id = 'MX-DIO-2026-000001'
 where registro_id = 'TEST-DIO-QRO';

-- Comprobación: 'restos TEST-' debe quedar en 0.
select (select count(*) from (select registro_id from public.diocesis
                              union all
                              select registro_id from public.parroquias) t
         where registro_id like 'TEST-%')::text as restos_test,
       (select registro_id from public.diocesis
         where nombre ilike '%Querétaro%')      as codigo_queretaro;

commit;
