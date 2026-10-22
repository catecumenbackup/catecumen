-- ────────────────────────────────────────────────────────────────────────────
-- Interruptor MAESTRO de pagos de la plataforma.
-- Por defecto APAGADO: solo se permite preinscripción (reservar sin costo).
-- Mientras no esté en {"habilitados": true}, las edge functions crear-sesion-pago
-- y reanudar-pago rechazan cualquier cobro (403). Los donativos NO se ven afectados.
-- Enciéndelo cuando autorices la apertura: panel admin → pestaña Preinscripción →
-- "Pagos habilitados en la plataforma" (o un UPDATE manual aquí).
-- ────────────────────────────────────────────────────────────────────────────
insert into public.ajustes (clave, valor)
values ('pagos_habilitados', '{"habilitados": false}'::jsonb)
on conflict (clave) do nothing;   -- si ya existe, respeta tu valor actual

select clave, valor from public.ajustes where clave = 'pagos_habilitados';
