-- ────────────────────────────────────────────────────────────────────────────
-- Actualización del Obispo de Querétaro (septiembre 2026)
-- Nuevo: S. E. Mons. Víctor Alejandro Aguilar Ledesma
-- En sustitución de: S. E. Mons. Fidencio López Plaza
--
-- Correr en el SQL Editor de Supabase. Idempotente (se puede correr de nuevo).
-- ────────────────────────────────────────────────────────────────────────────
update public.diocesis
   set nombre_obispo = 'S. E. Mons. Víctor Alejandro Aguilar Ledesma'
 where registro_id = 'TEST-DIO-QRO'
    or nombre ilike '%Diócesis de Querétaro%';

-- Comprobación (debe mostrar el nombre nuevo):
select registro_id, nombre, nombre_obispo, estado, aprobada
  from public.diocesis
 where nombre ilike '%Querétaro%';
