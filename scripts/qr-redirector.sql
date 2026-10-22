-- ════════════════════════════════════════════════════════════════════════════
--  Redirector de QR en dominio propio (catecumen.com/qr) con estadísticas.
--
--  La página /qr/ (qr/index.html) llama a qr_hit(slug) que REGISTRA el escaneo
--  y devuelve el destino; la página redirige ahí. El admin gestiona enlaces y
--  ve estadísticas desde el panel. Enlace por defecto: slug 'home' (sin ?c=).
--  URL a codificar en un QR: https://www.catecumen.com/qr/?c=<slug>
--  (o https://www.catecumen.com/qr/ para el enlace 'home').
--
--  Correr en el SQL Editor de Supabase. Idempotente.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.qr_links (
  slug    text primary key,
  nombre  text,
  destino text not null,
  activo  boolean not null default true,
  creado  timestamptz not null default now()
);

create table if not exists public.qr_scans (
  id         bigserial primary key,
  slug       text not null,
  creado     timestamptz not null default now(),
  dispositivo text,            -- 'movil' | 'escritorio'
  user_agent text,
  referrer   text,
  idioma     text
);
create index if not exists qr_scans_slug_creado on public.qr_scans (slug, creado desc);

-- RLS activo SIN políticas: solo se accede por las RPC SECURITY DEFINER de abajo.
alter table public.qr_links enable row level security;
alter table public.qr_scans enable row level security;

-- Enlace por defecto (el 'home' que usa /qr/ sin parámetro).
insert into public.qr_links (slug, nombre, destino)
values ('home', 'Sitio principal', 'https://www.catecumen.com')
on conflict (slug) do nothing;

-- ── Registrar escaneo + devolver destino (PÚBLICO) ──────────────────────────
create or replace function public.qr_hit(
  p_slug text, p_ua text default null, p_ref text default null, p_lang text default null)
returns text
language plpgsql security definer set search_path = public as $$
declare v_destino text; v_activo boolean; v_disp text;
begin
  select destino, activo into v_destino, v_activo
    from qr_links where slug = lower(trim(p_slug));
  -- Slug desconocido o enlace desactivado → respaldo, sin registrar.
  if v_destino is null or v_activo is false then
    return 'https://www.catecumen.com';
  end if;
  v_disp := case when coalesce(p_ua,'') ~* 'mobile|android|iphone|ipad|ipod|windows phone'
                 then 'movil' else 'escritorio' end;
  insert into qr_scans (slug, dispositivo, user_agent, referrer, idioma)
    values (lower(trim(p_slug)), v_disp, left(p_ua,400), left(p_ref,400), left(p_lang,20));
  return v_destino;
end $$;
grant execute on function public.qr_hit(text,text,text,text) to anon, authenticated;

-- ── ADMIN: listar enlaces con total de escaneos ─────────────────────────────
create or replace function public.admin_qr_listar()
returns table (slug text, nombre text, destino text, activo boolean, creado timestamptz, escaneos bigint)
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return query
    select l.slug, l.nombre, l.destino, l.activo, l.creado, count(s.id)
      from qr_links l left join qr_scans s on s.slug = l.slug
     group by l.slug, l.nombre, l.destino, l.activo, l.creado
     order by l.creado desc;
end $$;

-- ── ADMIN: crear / editar enlace ────────────────────────────────────────────
create or replace function public.admin_qr_guardar(
  p_slug text, p_nombre text, p_destino text, p_activo boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  if coalesce(trim(p_slug),'') = '' then raise exception 'slug requerido'; end if;
  if coalesce(trim(p_destino),'') = '' then raise exception 'destino requerido'; end if;
  insert into qr_links (slug, nombre, destino, activo)
    values (lower(trim(p_slug)), p_nombre, trim(p_destino), coalesce(p_activo, true))
  on conflict (slug) do update
    set nombre = excluded.nombre, destino = excluded.destino, activo = excluded.activo;
end $$;

-- ── ADMIN: borrar enlace (y sus escaneos) ───────────────────────────────────
create or replace function public.admin_qr_borrar(p_slug text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  if lower(trim(p_slug)) = 'home' then raise exception 'el enlace home no se borra'; end if;
  delete from qr_scans where slug = lower(trim(p_slug));
  delete from qr_links where slug = lower(trim(p_slug));
end $$;

-- ── ADMIN: estadísticas de un enlace ────────────────────────────────────────
create or replace function public.admin_qr_stats(p_slug text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare total bigint; u7 bigint; u30 bigint; mov bigint; esc bigint; por_dia jsonb;
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  select count(*) into total from qr_scans where slug = p_slug;
  select count(*) into u7  from qr_scans where slug = p_slug and creado > now() - interval '7 days';
  select count(*) into u30 from qr_scans where slug = p_slug and creado > now() - interval '30 days';
  select count(*) filter (where dispositivo = 'movil'),
         count(*) filter (where dispositivo = 'escritorio')
    into mov, esc from qr_scans where slug = p_slug;
  select coalesce(jsonb_agg(jsonb_build_object('dia', d, 'n', n) order by d), '[]'::jsonb)
    into por_dia
    from (select date_trunc('day', creado)::date d, count(*) n
            from qr_scans
           where slug = p_slug and creado > now() - interval '30 days'
           group by 1) t;
  if not es_admin() then raise exception 'no autorizado'; end if;
  return jsonb_build_object('total', total, 'ult7', u7, 'ult30', u30,
    'movil', mov, 'escritorio', esc, 'por_dia', por_dia);
end $$;
