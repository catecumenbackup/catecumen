-- pareja-formacion.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Formación en pareja (papás/prebautismal y padrinos): dos cuentas INDEPENDIENTES
-- enlazadas por un id de pareja. Cada quien tiene su propio login, progreso,
-- plazo y constancia (se emite cuando CADA uno cumple). Una sola cuota individual
-- cubre a los dos: el titular paga, y al confirmarse el pago se crea la segunda
-- cuenta (ver activar-pago / stripe-webhook).
--
-- pareja_id = el uid del TITULAR (determinista: re-ejecuciones del webhook no
-- crean duplicados). Ambos miembros comparten ese valor.
-- Idempotente. Correr en el SQL Editor de Supabase.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.usuarios add column if not exists pareja_id uuid;

create index if not exists idx_usuarios_pareja
  on public.usuarios(pareja_id) where pareja_id is not null;

comment on column public.usuarios.pareja_id is
  'Id de pareja (= uid del titular). Enlaza a los dos miembros; cada cuenta sigue siendo independiente.';

-- El otro miembro de la pareja (para la ficha del admin): datos públicos básicos.
create or replace function public.admin_pareja_de(p_id uuid)
returns table(id uuid, nombre text, email text, tipo_usuario text,
              pago_realizado boolean, formacion_limite timestamptz, constancias bigint)
language sql security definer set search_path = public as $$
  select o.id,
         trim(coalesce(o.nombre,'')||' '||coalesce(o.apellido,'')) as nombre,
         o.email, o.tipo_usuario, o.pago_realizado, o.formacion_limite,
         (select count(*) from public.constancias c where c.usuario_id = o.id) as constancias
  from public.usuarios yo
  join public.usuarios o
    on o.pareja_id = yo.pareja_id and o.id <> yo.id
  where public.es_admin() and yo.id = p_id and yo.pareja_id is not null;
$$;
grant execute on function public.admin_pareja_de(uuid) to authenticated;
