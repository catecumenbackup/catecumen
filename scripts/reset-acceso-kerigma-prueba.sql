-- reset-acceso-kerigma-prueba.sql
-- Reinicia el ACCESO de los videos de Kerigma para la cuenta de prueba
-- (jormed2010@gmail.com → uid eee909d3-...). Deja cada bloque como "nunca visto":
-- 0 reproducciones, no aprobado, sin ventana de 72 h vencida. Útil para volver a
-- probar el flujo completo (4 videos → 4 encuestas → resumen → evaluación) desde cero.
-- NO borra el progreso del curso, solo el gating de acceso de 72 h / vistas.

DELETE FROM public.accesos_video
 WHERE usuario_id = 'eee909d3-d453-419c-a370-c468d00d5005'
   AND video_id IN (SELECT id FROM public.videos
                     WHERE sacramento_id = 'a877cda2-5066-40b7-908c-18631b3b5403');

-- (opcional) cerrar solicitudes de reapertura pendientes de esa cuenta en Kerigma:
UPDATE public.solicitudes_acceso s SET estado = 'rechazada', resuelto = now()
 WHERE s.usuario_id = 'eee909d3-d453-419c-a370-c468d00d5005'
   AND s.estado = 'pendiente'
   AND s.video_id IN (SELECT id FROM public.videos
                       WHERE sacramento_id = 'a877cda2-5066-40b7-908c-18631b3b5403');
