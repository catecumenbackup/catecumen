-- scripts/directorio-datos-prueba.sql
-- Datos de PRUEBA para ver el mapa del directorio (2 parroquias + 2 diócesis),
-- ya aprobadas y con lat/lng. Re-ejecutable. Requiere directorio-afiliados.sql
-- y directorio-mx.sql (columnas estado/municipio/aprobada/lat/lng).
--
-- Todos llevan el email marcador 'prueba-directorio@catecumen.com' para poder
-- borrarlos de un golpe cuando termines de validar (ver el bloque final).

-- Limpia pruebas anteriores (idempotente).
delete from public.parroquias where email_contacto = 'prueba-directorio@catecumen.com';
delete from public.diocesis  where email_contacto = 'prueba-directorio@catecumen.com';

-- ── Parroquias (marcador = monograma de Catecumen) ──────────────────────────
insert into public.parroquias
  (registro_id, nombre, pais, codigo_iso, nombre_contacto, email_contacto,
   codigo_pais_tel, telefono, direccion, nombre_pastor, estado, municipio, aprobada, lat, lng)
values
  ('TEST-PAR-QRO', 'Parroquia de Nuestra Señora de la Esperanza', 'México', 'MX',
   'Recepción', 'prueba-directorio@catecumen.com', '+52', '442 000 0000',
   'Centro Histórico, Querétaro, Qro.', 'P. Juan Ejemplo García', 'Querétaro', 'Querétaro', true, 20.5931, -100.3892),
  ('TEST-PAR-CDMX', 'Parroquia de Santa María de Guadalupe', 'México', 'MX',
   'Recepción', 'prueba-directorio@catecumen.com', '+52', '55 0000 0000',
   'Villa de Guadalupe, CDMX', 'P. Pedro Muestra', 'Ciudad de México', 'Gustavo A. Madero', true, 19.4847, -99.1177);

-- ── Diócesis (marcador dorado destacado 🏛️) ────────────────────────────────
insert into public.diocesis
  (registro_id, nombre, pais, codigo_iso, nombre_contacto, email_contacto,
   codigo_pais_tel, telefono, direccion, nombre_obispo, estado, municipio, aprobada, lat, lng)
values
  ('TEST-DIO-QRO', 'Diócesis de Querétaro', 'México', 'MX',
   'Curia', 'prueba-directorio@catecumen.com', '+52', '442 111 1111',
   'Curia Diocesana, Querétaro, Qro.', 'Mons. Ejemplo', 'Querétaro', 'Querétaro', true, 20.5888, -100.3899),
  ('TEST-DIO-BA', 'Arquidiócesis de Buenos Aires', 'Argentina', 'AR',
   'Curia', 'prueba-directorio@catecumen.com', '+54', '11 1111 1111',
   'Catedral Metropolitana, Buenos Aires', 'Mons. Muestra', 'Buenos Aires', 'Buenos Aires', true, -34.6081, -58.3720);

-- ── Para BORRAR los datos de prueba cuando termines ─────────────────────────
-- delete from public.parroquias where email_contacto = 'prueba-directorio@catecumen.com';
-- delete from public.diocesis  where email_contacto = 'prueba-directorio@catecumen.com';
