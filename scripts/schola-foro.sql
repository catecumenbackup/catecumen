-- scripts/schola-foro.sql
-- Comunidad/foro de las Scholas (intercambio entre miembros del espacio).
-- Mismo control de acceso que los recursos. Idempotente. Requiere scripts/schola.sql.

-- ── Helper de acceso reutilizable (refactor del check que ya usa la RPC schola) ──
create or replace function public.schola_acceso(p_espacio text)
returns boolean language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tu text;
begin
  if uid is null or p_espacio not in ('catecumen','fidei') then return false; end if;
  if p_espacio = 'catecumen' then
    select tipo_usuario into tu from public.usuarios where id = uid;
    return (tu = 'catequista') or public.es_admin();
  else
    return exists (select 1 from public.constancias where usuario_id = uid) or public.es_admin();
  end if;
end $$;

create or replace function public._schola_nombre(uid uuid)
returns text language sql security definer set search_path = public as $$
  select nullif(trim(coalesce(nombre,'') || ' ' || coalesce(apellido,'')), '') from public.usuarios where id = uid;
$$;

-- ── Tablas ──────────────────────────────────────────────────────────────────
create table if not exists public.schola_hilos (
  id bigint generated always as identity primary key,
  espacio text not null check (espacio in ('catecumen','fidei')),
  titulo text not null,
  autor_id uuid not null,
  autor_nombre text,
  fijado boolean not null default false,
  activo boolean not null default true,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index if not exists idx_schola_hilos_esp on public.schola_hilos (espacio, activo, fijado desc, actualizado desc);

create table if not exists public.schola_posts (
  id bigint generated always as identity primary key,
  hilo_id bigint not null references public.schola_hilos(id) on delete cascade,
  autor_id uuid not null,
  autor_nombre text,
  cuerpo text not null,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
create index if not exists idx_schola_posts_hilo on public.schola_posts (hilo_id, creado);

alter table public.schola_hilos enable row level security;
alter table public.schola_posts enable row level security;
-- Sin políticas: el acceso es solo por las RPCs SECURITY DEFINER de abajo.

-- ── Listar hilos ────────────────────────────────────────────────────────────
create or replace function public.schola_listar_hilos(p_espacio text)
returns json language plpgsql security definer set search_path = public as $$
begin
  if not public.schola_acceso(p_espacio) then return json_build_object('acceso', false, 'hilos', '[]'::json); end if;
  return json_build_object('acceso', true, 'hilos', coalesce((
    select json_agg(row_to_json(h)) from (
      select x.id, x.titulo, x.autor_nombre, x.fijado, x.creado, x.actualizado,
             (select count(*) from public.schola_posts p where p.hilo_id = x.id and p.activo) as respuestas
        from public.schola_hilos x
       where x.espacio = p_espacio and x.activo
       order by x.fijado desc, x.actualizado desc
       limit 100
    ) h), '[]'::json));
end $$;

-- ── Ver un hilo con sus mensajes ────────────────────────────────────────────
create or replace function public.schola_ver_hilo(p_hilo bigint)
returns json language plpgsql security definer set search_path = public as $$
declare esp text;
begin
  select espacio into esp from public.schola_hilos where id = p_hilo and activo;
  if esp is null or not public.schola_acceso(esp) then return json_build_object('acceso', false); end if;
  return json_build_object('acceso', true,
    'hilo', (select row_to_json(h) from (select id, titulo, autor_nombre, creado from public.schola_hilos where id = p_hilo) h),
    'posts', coalesce((
      select json_agg(row_to_json(p) order by p.creado) from (
        select id, autor_nombre, cuerpo, creado from public.schola_posts where hilo_id = p_hilo and activo
      ) p), '[]'::json));
end $$;

-- ── Crear hilo (con su primer mensaje) ──────────────────────────────────────
create or replace function public.schola_crear_hilo(p_espacio text, p_titulo text, p_cuerpo text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); nom text; hid bigint;
begin
  if not public.schola_acceso(p_espacio) then return json_build_object('ok', false); end if;
  if coalesce(trim(p_titulo),'') = '' or coalesce(trim(p_cuerpo),'') = '' then return json_build_object('ok', false, 'motivo', 'vacio'); end if;
  nom := public._schola_nombre(uid);
  insert into public.schola_hilos (espacio, titulo, autor_id, autor_nombre)
    values (p_espacio, left(p_titulo, 200), uid, nom) returning id into hid;
  insert into public.schola_posts (hilo_id, autor_id, autor_nombre, cuerpo)
    values (hid, uid, nom, left(p_cuerpo, 5000));
  return json_build_object('ok', true, 'id', hid);
end $$;

-- ── Responder en un hilo ────────────────────────────────────────────────────
create or replace function public.schola_responder(p_hilo bigint, p_cuerpo text)
returns json language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); esp text;
begin
  select espacio into esp from public.schola_hilos where id = p_hilo and activo;
  if esp is null or not public.schola_acceso(esp) then return json_build_object('ok', false); end if;
  if coalesce(trim(p_cuerpo),'') = '' then return json_build_object('ok', false); end if;
  insert into public.schola_posts (hilo_id, autor_id, autor_nombre, cuerpo)
    values (p_hilo, uid, public._schola_nombre(uid), left(p_cuerpo, 5000));
  update public.schola_hilos set actualizado = now() where id = p_hilo;
  return json_build_object('ok', true);
end $$;

grant execute on function public.schola_acceso(text)            to authenticated;
grant execute on function public.schola_listar_hilos(text)      to authenticated;
grant execute on function public.schola_ver_hilo(bigint)        to authenticated;
grant execute on function public.schola_crear_hilo(text, text, text) to authenticated;
grant execute on function public.schola_responder(bigint, text) to authenticated;
