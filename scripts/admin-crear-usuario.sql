-- admin-crear-usuario.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Soporte para que el admin cree usuarios directamente (sin pasar por pago):
--   · Perfiles DE PAGA   → cuenta activa normal (como si hubiera pagado).
--   · Perfiles DE CORTESÍA → acceso gratuito con VIGENCIA definida. La vigencia
--     se implementa reutilizando el bloqueo de plazo ya existente: se fija
--     usuarios.formacion_inicio = now() y usuarios.formacion_limite = vencimiento,
--     de modo que al expirar, PlazoBloqueo bloquea el acceso automáticamente
--     (y PlazoAviso avisa los días restantes). El admin puede ampliar la
--     vigencia con el flujo de prórrogas que ya existe.
--
-- La creación real (auth.users + fila en usuarios) la hace la edge function
-- `admin-crear-usuario` con service-role. Aquí solo añadimos la marca `cortesia`.
-- Idempotente. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.usuarios add column if not exists cortesia boolean not null default false;

comment on column public.usuarios.cortesia is
  'true = cuenta de cortesía creada por el admin; su vigencia vive en formacion_limite.';
