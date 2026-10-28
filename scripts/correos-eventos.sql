-- correos-eventos.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Acuses de correo (entrega / apertura / rebote) vía webhook de Resend.
-- La edge function `resend-webhook` inserta aquí cada evento que Resend reporta
-- (con service-role; la tabla no tiene políticas RLS, así que el cliente no
-- puede leerla). El admin consulta con las RPCs `admin_correos_*` (es_admin).
--
-- Eventos de Resend: email.sent, email.delivered, email.delivery_delayed,
--   email.opened, email.clicked, email.bounced, email.complained.
-- Guardamos el sufijo corto en `evento` (sent, delivered, opened, ...).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.correos_eventos (
  id            bigserial primary key,
  email_id      text,                         -- id del correo en Resend
  evento        text not null,                -- sent|delivered|opened|clicked|bounced|complained|delivery_delayed
  destinatario  text,                         -- correo del destinatario
  asunto        text,
  etiqueta      text,                         -- categoría del correo (bienvenida, recordatorio_plazo, aviso_admin, ...)
  usuario_id    uuid,                          -- si se pudo correlacionar
  ocurrido      timestamptz,                  -- created_at que reporta Resend
  creado        timestamptz not null default now(),
  payload       jsonb
);

create index if not exists idx_correos_eventos_email on public.correos_eventos(email_id);
create index if not exists idx_correos_eventos_dest  on public.correos_eventos(lower(destinatario));
create index if not exists idx_correos_eventos_etq   on public.correos_eventos(etiqueta);
create index if not exists idx_correos_eventos_creado on public.correos_eventos(creado desc);

alter table public.correos_eventos enable row level security;
-- Sin políticas: solo service-role (el webhook) escribe; el admin lee por RPC.

-- ─── Resumen: conteo por tipo de evento en los últimos N días ───────────────
create or replace function public.admin_correos_resumen(p_dias int default 30)
returns table(evento text, total bigint, ultimos_7 bigint)
language sql security definer set search_path = public as $$
  select e.evento,
         count(*) as total,
         count(*) filter (where e.creado >= now() - interval '7 days') as ultimos_7
  from public.correos_eventos e
  where public.es_admin()
    and e.creado >= now() - make_interval(days => greatest(1, p_dias))
  group by e.evento
  order by total desc;
$$;

-- ─── Listado filtrable (por destinatario, etiqueta o tipo de evento) ────────
create or replace function public.admin_correos_listar(
  p_q text default null, p_evento text default null,
  p_etiqueta text default null, p_limit int default 200)
returns table(
  id bigint, email_id text, evento text, destinatario text,
  asunto text, etiqueta text, usuario_id uuid, ocurrido timestamptz, creado timestamptz)
language sql security definer set search_path = public as $$
  select e.id, e.email_id, e.evento, e.destinatario, e.asunto,
         e.etiqueta, e.usuario_id, e.ocurrido, e.creado
  from public.correos_eventos e
  where public.es_admin()
    and (p_q is null or p_q = '' or e.destinatario ilike '%'||p_q||'%' or e.asunto ilike '%'||p_q||'%')
    and (p_evento   is null or p_evento   = '' or e.evento   = p_evento)
    and (p_etiqueta is null or p_etiqueta = '' or e.etiqueta = p_etiqueta)
  order by e.creado desc
  limit greatest(1, least(1000, p_limit));
$$;

-- ─── Estado de un correo concreto (traza completa por email_id) ─────────────
create or replace function public.admin_correo_traza(p_email_id text)
returns table(evento text, ocurrido timestamptz, creado timestamptz)
language sql security definer set search_path = public as $$
  select e.evento, e.ocurrido, e.creado
  from public.correos_eventos e
  where public.es_admin() and e.email_id = p_email_id
  order by e.creado asc;
$$;

grant execute on function public.admin_correos_resumen(int)            to authenticated;
grant execute on function public.admin_correos_listar(text,text,text,int) to authenticated;
grant execute on function public.admin_correo_traza(text)              to authenticated;
