-- scripts/previo-afiliar-esperanza.sql
--
-- ENSAYO. Solo lee: muestra EXACTAMENTE los datos con los que nacería la ficha
-- de la parroquia afiliada, para que los revises antes de escribir nada.
-- Córrelo ANTES de afiliar-esperanza-corregidora.sql.
--
-- Fíjate sobre todo en el correo y el teléfono: son los que verá el público en
-- el buscador. Si alguno sale vacío o no es el bueno, corrígelo primero en
-- directorio_parroquias y vuelve a correr este ensayo.

select 'MX-PAR-2026-000001'                    as registro_id,
       dp.nombre                               as nombre,
       coalesce(dp.pais, 'México')             as pais,
       'Despacho Parroquial'                   as nombre_contacto,
       dp.email                                as email_contacto,
       concat_ws(' ', '+52', dp.telefono)      as telefono,
       dp.direccion                            as direccion,
       dp.parroco                              as nombre_pastor,
       'Querétaro'                             as estado,
       dp.municipio                            as municipio,
       dp.lat, dp.lng, dp.geo_precision,
       dp.parroquia_id                         as ya_enlazada,
       (select count(*) from public.parroquias where registro_id = 'MX-PAR-2026-000001') as ya_existe
  from public.directorio_parroquias dp
 where dp.id = 'parroquia-de-nuestra-senora-de-la-esperanza';
