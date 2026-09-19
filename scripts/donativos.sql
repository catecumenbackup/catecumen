-- ═══════════════════════════════════════════════════════════════════════════
--  Donativos de apoyo a la plataforma (Stripe Checkout)
--  Idempotente y re-ejecutable. Correr en Supabase → SQL Editor.
--
--  Modelo: la edge function `crear-donativo` inserta una fila PENDIENTE y crea
--  la sesión de Stripe. `stripe-webhook` la marca COMPLETADO al confirmarse el
--  pago (metadata.tipo = 'donativo'). Un donativo puede ser único o mensual.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.donativos (
  id                     uuid primary key default gen_random_uuid(),
  email                  text,                         -- opcional (el donante puede no dejarlo)
  monto                  numeric(12,2) not null,
  moneda                 text          not null default 'MXN',
  recurrente             boolean       not null default false,   -- true = suscripción mensual
  estado                 text          not null default 'pendiente', -- pendiente | completado | cancelado
  stripe_session_id      text,
  stripe_subscription_id text,                         -- solo en donativos recurrentes
  stripe_payment_intent  text,
  creado                 timestamptz   not null default now(),
  confirmado             timestamptz
);

-- RLS ACTIVADA y SIN POLÍTICAS: ni anon ni authenticated pueden leer/escribir
-- vía PostgREST. Las edge functions escriben con service-role (ignora RLS);
-- el admin lee por la RPC de abajo (SECURITY DEFINER + es_admin).
alter table public.donativos enable row level security;

create index if not exists donativos_estado_idx on public.donativos(estado);
create index if not exists donativos_creado_idx on public.donativos(creado desc);

-- ── Lectura para el panel admin ─────────────────────────────────────────────
create or replace function public.admin_donativos_listar()
returns setof public.donativos
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'no autorizado';
  end if;
  return query select * from public.donativos order by creado desc limit 500;
end;
$$;

-- Resumen rápido (totales) para tarjetas del panel.
create or replace function public.admin_donativos_resumen()
returns table(
  total_completados     bigint,
  monto_total           numeric,
  recurrentes_activos   bigint,
  pendientes            bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'no autorizado';
  end if;
  return query
    select
      count(*) filter (where estado = 'completado'),
      coalesce(sum(monto) filter (where estado = 'completado'), 0),
      count(*) filter (where estado = 'completado' and recurrente),
      count(*) filter (where estado = 'pendiente');
end;
$$;

revoke all on function public.admin_donativos_listar()  from public, anon, authenticated;
revoke all on function public.admin_donativos_resumen() from public, anon, authenticated;
grant  execute on function public.admin_donativos_listar()  to authenticated;
grant  execute on function public.admin_donativos_resumen() to authenticated;

-- NOTA: no agregar aquí una línea que ejecute admin_donativos_listar() para
-- "verificar": en el SQL Editor auth.uid() es null → es_admin() lanza excepción
-- → ROLLBACK de todo el script. Verifica con pg_get_functiondef(...) si quieres.
