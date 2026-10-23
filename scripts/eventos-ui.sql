-- ════════════════════════════════════════════════════════════════════════════
--  Monitor de clics (eventos de interfaz) — autoalojado y ANÓNIMO.
--
--  Registra un evento por clic en botones del home (y donde se quiera), SIN
--  cookies ni datos personales: solo el nombre del evento, el tipo de dispositivo
--  (móvil/escritorio), el idioma y el referrer. Se consulta desde el panel admin.
--
--  Correr en el SQL Editor de Supabase. Idempotente.
--  NOTA: no agregar al final una llamada a admin_eventos_ui_stats() — es_admin()
--  da null en el editor y revertiría el script (lección de despliegue SQL).
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.eventos_ui (
  id          bigserial primary key,
  evento      text not null,
  creado      timestamptz not null default now(),
  dispositivo text,            -- 'movil' | 'escritorio'
  idioma      text,
  referrer    text
);
create index if not exists eventos_ui_evento_creado on public.eventos_ui (evento, creado desc);
create index if not exists eventos_ui_creado on public.eventos_ui (creado desc);

-- RLS activo SIN políticas: solo se escribe/lee por las RPC SECURITY DEFINER.
alter table public.eventos_ui enable row level security;

-- ── Registrar un evento (PÚBLICO, anónimo) ──────────────────────────────────
create or replace function public.registrar_evento(
  p_evento text, p_ua text default null, p_lang text default null, p_ref text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_disp text;
begin
  if coalesce(trim(p_evento),'') = '' then return; end if;
  if length(p_evento) > 64 then return; end if;              -- clave razonable, evita basura
  v_disp := case when coalesce(p_ua,'') ~* 'mobile|android|iphone|ipad|ipod|windows phone'
                 then 'movil' else 'escritorio' end;
  insert into eventos_ui (evento, dispositivo, idioma, referrer)
    values (lower(trim(p_evento)), v_disp, left(p_lang,20), left(p_ref,300));
end $$;
grant execute on function public.registrar_evento(text,text,text,text) to anon, authenticated;

-- ── ADMIN: estadísticas de clics ────────────────────────────────────────────
create or replace function public.admin_eventos_ui_stats()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare res jsonb;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select jsonb_build_object(
    'total', (select count(*) from eventos_ui),
    'por_evento', coalesce((
      select jsonb_agg(x order by (x->>'total')::bigint desc) from (
        select jsonb_build_object(
          'evento', evento,
          'total', count(*),
          'ult7',  count(*) filter (where creado > now() - interval '7 days'),
          'ult30', count(*) filter (where creado > now() - interval '30 days'),
          'movil', count(*) filter (where dispositivo = 'movil'),
          'escritorio', count(*) filter (where dispositivo = 'escritorio')
        ) x
        from eventos_ui group by evento) t), '[]'::jsonb),
    'por_dia', coalesce((
      select jsonb_agg(jsonb_build_object('dia', d, 'n', n) order by d) from (
        select date_trunc('day', creado)::date d, count(*) n
          from eventos_ui where creado > now() - interval '30 days' group by 1) u), '[]'::jsonb)
  ) into res;
  return res;
end $$;
