-- scripts/verificar-directorio.sql
--
-- Una SOLA consulta, porque el editor SQL de Supabase únicamente muestra el
-- resultado de la última sentencia. Devuelve el estado completo del directorio
-- en una tabla de dos columnas: concepto / valor.
--
-- Cómo leerlo:
--   · «restos de prueba …» debe ser 0 en las tres líneas.
--   · «parroquias del directorio sin coordenada» son las que aún no salen en
--     el mapa. Después de correr completar-directorio-diocesano.sql deben
--     quedar 7.
--   · «pin de localidad (revisar)» son pines aproximados, al centro del
--     pueblo, no del templo: llevan geo_revisar = true a propósito.
--
-- Solo lee. No modifica nada.

select 'restos de prueba · parroquias'            as concepto,
       count(*)::text                              as valor
  from public.parroquias
 where email_contacto = 'prueba-directorio@catecumen.com'
union all
select 'restos de prueba · diocesis',
       count(*)::text
  from public.diocesis
 where email_contacto = 'prueba-directorio@catecumen.com'
union all
select 'restos de prueba · registro_id TEST-',
       count(*)::text
  from (select registro_id from public.parroquias
        union all
        select registro_id from public.diocesis) t
 where registro_id like 'TEST-%'
union all
select '─────────────────────────────', '─────'
union all
select 'diócesis afiliadas (verde)',
       count(*)::text from public.diocesis where aprobada
union all
select 'parroquias afiliadas (verde)',
       count(*)::text from public.parroquias where aprobada
union all
select '─────────────────────────────', '─────'
union all
select 'directorio diocesano · total',
       count(*)::text from public.directorio_parroquias where activo
union all
select 'directorio diocesano · con coordenada',
       count(*)::text from public.directorio_parroquias where activo and lat is not null
union all
select 'directorio diocesano · SIN coordenada',
       count(*)::text from public.directorio_parroquias where activo and lat is null
union all
select 'directorio diocesano · pin de templo',
       count(*)::text from public.directorio_parroquias where activo and geo_precision = 'templo'
union all
select 'directorio diocesano · pin de localidad (revisar)',
       count(*)::text from public.directorio_parroquias where activo and geo_precision = 'localidad'
union all
select 'directorio diocesano · con correo',
       count(*)::text from public.directorio_parroquias where activo and email is not null and email <> ''
union all
select 'directorio diocesano · con párroco',
       count(*)::text from public.directorio_parroquias where activo and parroco is not null and parroco <> ''
union all
select '─────────────────────────────', '─────'
union all
select 'usuarios con un registro_id de prueba',
       count(*)::text from public.usuarios where registro_id like 'TEST-%';
