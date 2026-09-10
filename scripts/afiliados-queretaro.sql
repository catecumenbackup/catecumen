-- scripts/afiliados-queretaro.sql
--
-- Deja el directorio LIMPIO: sin un solo registro del sembrado de prueba, y
-- con la Diócesis de Querétaro convertida en ficha real y afiliada.
--
-- Orden deliberado (importa):
--   1) Comprueba que nadie se haya registrado con un registro_id de prueba.
--   2) Corrige la Diócesis de Querétaro — al hacerlo pierde el correo marcador
--      'prueba-directorio@catecumen.com', así que el borrado del paso 3 ya no
--      la alcanza.
--   3) Borra TODO lo que siga llevando ese correo marcador: la Arquidiócesis
--      de Buenos Aires y las dos parroquias inventadas.
--
-- Los datos reales salen de diocesisqro.org (inicio, Curia Diocesana y
-- Obispos), corroborados en catholic-hierarchy.org y gcatholic.org.
--
-- Idempotente: se puede volver a correr sin efecto.

begin;

-- ── 0 · Seguro ──────────────────────────────────────────────────────────────
-- Los usuarios guardan el registro_id como TEXTO, no como llave foránea: si
-- alguien se registró con un código de prueba, borrar la ficha lo dejaría
-- huérfano sin que la base proteste. Aquí sí protesta y no se borra nada.
do $$
declare v_n integer;
begin
  select count(*) into v_n
    from public.usuarios
   where registro_id in ('TEST-PAR-QRO', 'TEST-PAR-CDMX', 'TEST-DIO-BA');
  if v_n > 0 then
    raise exception
      'Hay % usuario(s) registrados con un código de prueba. Reasígnalos antes de borrar las fichas.', v_n;
  end if;
end $$;

-- ── 1 · Diócesis de Querétaro: ficha real ───────────────────────────────────
--
-- Reemplaza 'Mons. Ejemplo' → Mons. Fidencio López Plaza (X Obispo de
-- Querétaro, nombrado el 12 de septiembre de 2020); la dirección genérica →
-- el domicilio del Obispado; y el teléfono 442 111 1111 → el de la Curia.
--
-- OJO con el correo: la diócesis publica contact@diocesisqueretaro.org en el
-- pie de su sitio, pero ese dominio NO es el del sitio (diocesisqro.org) y no
-- se pudo corroborar con ninguna fuente externa. Conviene confirmarlo por
-- teléfono antes de usarlo para algo que importe.
update public.diocesis
   set nombre          = 'Diócesis de Querétaro',
       pais            = 'México',
       codigo_iso      = 'MX',
       nombre_obispo   = 'S. E. Mons. Fidencio López Plaza',
       nombre_contacto = 'Curia Diocesana',
       email_contacto  = 'contact@diocesisqueretaro.org',
       codigo_pais_tel = '+52',
       telefono        = '442 224 0738',
       direccion       = 'Reforma 48, Col. Centro, C.P. 76000, Santiago de Querétaro, Qro.',
       estado          = 'Querétaro',
       municipio       = 'Querétaro',
       aprobada        = true,
       suspendida      = false
 where registro_id = 'TEST-DIO-QRO'
    or (nombre ilike '%Diócesis de Querétaro%' and email_contacto = 'prueba-directorio@catecumen.com');

-- La coordenada queda SIN TOCAR a propósito: la diócesis no publica lat/lng
-- de la curia y no se inventa. La ficha ya tiene una del sembrado de prueba
-- (20.5888, -100.3899); para fijarla bien, corre la edge function
-- `geocodificar-afiliados` y revisa el pin en el mapa antes de darla por buena.

-- ── 2 · Fuera todo lo demás del sembrado de prueba ──────────────────────────
--
-- Qué se va, y por qué:
--   · «Parroquia de Nuestra Señora de la Esperanza» (TEST-PAR-QRO), con el
--     párroco inventado «P. Juan Ejemplo García». Estorbaba de verdad: ahora
--     que el buscador también muestra el directorio diocesano, esa parroquia
--     salía DOS VECES en el mapa — en verde la falsa, en rojo la real de
--     Corregidora.
--   · «Parroquia de Santa María de Guadalupe» (TEST-PAR-CDMX), inventada.
--   · «Arquidiócesis de Buenos Aires» (TEST-DIO-BA), inventada.
--
-- La Diócesis de Querétaro NO cae aquí: el UPDATE de arriba ya le quitó el
-- correo marcador.
delete from public.parroquias where email_contacto = 'prueba-directorio@catecumen.com';
delete from public.diocesis  where email_contacto = 'prueba-directorio@catecumen.com';

-- ── 3 · Comprobación ────────────────────────────────────────────────────────
-- El editor SQL de Supabase solo muestra el resultado de la ULTIMA sentencia,
-- por eso el conteo va al final. Esperado: 'prueba' = 0 en las dos tablas.
select registro_id, nombre, nombre_obispo, telefono, direccion, aprobada, lat, lng
  from public.diocesis
 order by nombre;

select 'diocesis' as tabla,
       count(*) as total,
       count(*) filter (where email_contacto = 'prueba-directorio@catecumen.com') as prueba
  from public.diocesis
union all
select 'parroquias', count(*),
       count(*) filter (where email_contacto = 'prueba-directorio@catecumen.com')
  from public.parroquias;

commit;

-- ═══════════════════════════════════════════════════════════════════════════
-- PENDIENTE DE TU DECISIÓN — no se ejecuta
--
-- El `registro_id` de la diócesis sigue siendo 'TEST-DIO-QRO'. Es el código
-- que sus catequistas escriben al registrarse (RPC verificar_org_registro),
-- así que se ve en pantalla y dice «TEST». Cambiarlo sería lo correcto, pero
-- rompería el registro de quien ya lo tenga apuntado. Si nadie lo ha usado
-- todavía (el seguro del paso 0 no lo revisa, porque esa ficha se conserva):
--
--   select count(*) from public.usuarios where registro_id = 'TEST-DIO-QRO';
--
-- Si sale 0, puedes cambiarlo sin riesgo:
--
--   update public.diocesis set registro_id = 'MX-DIO-2026-000001'
--    where registro_id = 'TEST-DIO-QRO';
