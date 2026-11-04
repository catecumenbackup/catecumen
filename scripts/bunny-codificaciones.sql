-- scripts/bunny-codificaciones.sql
-- Registro de la HORA REAL en que Bunny terminó de codificar cada video.
-- Bunny NO expone esa hora en su API de videos; la ÚNICA fuente real es el
-- webhook de Bunny Stream, que al pasar un video a "Finished" (Status=3) manda
-- un campo `Timestamp` = hora UTC del evento. La edge function `bunny-webhook`
-- recibe ese webhook (validando la firma HMAC con la Read-Only API key) y guarda
-- aquí guid + esa hora. El monitor (bunny_monitor.py) la lee por la RPC pública.
--
-- Idempotente y re-ejecutable. Correr en el SQL Editor de Supabase.
-- NO incluir al final una llamada a una RPC protegida (revierte el script).

create table if not exists public.bunny_codificaciones (
  guid            text primary key,
  library_id      bigint,
  status          int,
  codificado_en   timestamptz,          -- Timestamp del evento Finished (hora real de Bunny, UTC)
  event_id        text,                 -- EventId del webhook (para ignorar reenvíos)
  actualizado_en  timestamptz not null default now()
);

comment on table public.bunny_codificaciones is
  'Hora real de fin de codificación por video de Bunny Stream, poblada por el webhook (Status=3 Finished).';

-- Sin políticas de cliente: la escritura la hace SOLO la edge function con
-- service-role (ignora RLS). Dejamos RLS activa para que nadie más escriba.
alter table public.bunny_codificaciones enable row level security;

-- Lectura (dato NO sensible: solo guid + hora) por RPC pública, para que el
-- monitor pueda consultarla con la anon key.
create or replace function public.bunny_codificaciones_listar()
returns table (guid text, codificado_en timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.guid, c.codificado_en
    from public.bunny_codificaciones c
   where c.codificado_en is not null;
$$;

grant execute on function public.bunny_codificaciones_listar() to anon, authenticated;

-- Verificación segura (no usa auth.uid, no revierte):
-- select count(*) as filas from public.bunny_codificaciones;
