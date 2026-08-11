-- scripts/admin-afiliados.sql
-- Consola de administración: ALTA (aprobar), SUSPENSIÓN y BAJA (borrar) de
-- parroquias y diócesis afiliadas.
--
-- Modelo de situación (sin columnas nuevas salvo `suspendida`):
--   • pendiente  = aprobada=false y suspendida=false  (recién afiliada, sin revisar)
--   • activa     = aprobada=true                       (visible en el directorio)
--   • suspendida = suspendida=true                     (oculta, pero se conserva)
-- El directorio público filtra `aprobada=true`, así que pendientes y suspendidas
-- NO aparecen (no hace falta tocar las RPCs del directorio).
--
-- Requiere: public.es_admin(), public.admin_log, y las tablas parroquias/diocesis
-- (con columnas nombre, pais, estado, municipio, direccion, nombre_pastor /
-- nombre_obispo, nombre_contacto, email_contacto, codigo_pais_tel, telefono,
-- registro_id, aprobada). Idempotente y re-ejecutable.

-- ── Tabla para "otras" organizaciones/instituciones no previstas ────────────
-- (movimientos, colegios, universidades, capellanías, fundaciones, comunidades
-- religiosas, etc.). El interesado indica el `tipo_organizacion` al registrarse.
create table if not exists public.organizaciones_otro (
  id                 uuid primary key default gen_random_uuid(),
  registro_id        text,
  nombre             text not null,
  tipo_organizacion  text,
  pais               text,
  codigo_iso         text,
  nombre_contacto    text,
  email_contacto     text,
  codigo_pais_tel    text,
  telefono           text,
  estado             text,
  municipio          text,
  direccion          text,
  aprobada           boolean not null default false,
  suspendida         boolean not null default false,
  created_at         timestamptz default now()
);
-- El registro de afiliación ocurre ANTES de tener cuenta: permitir INSERT anónimo.
-- La lectura/gestión es solo del admin (vía las RPCs SECURITY DEFINER de abajo).
alter table public.organizaciones_otro enable row level security;
drop policy if exists org_otro_insert on public.organizaciones_otro;
create policy org_otro_insert on public.organizaciones_otro
  for insert to anon, authenticated with check (true);
-- Privilegio a nivel de tabla (la política RLS no basta si el rol no tiene GRANT).
grant insert on public.organizaciones_otro to anon, authenticated;

-- Columna de suspensión (nueva). El resto ya existen (las usan el directorio y el registro).
alter table public.parroquias      add column if not exists suspendida boolean not null default false;
alter table public.diocesis        add column if not exists suspendida boolean not null default false;
alter table public.centros_adiccion add column if not exists suspendida boolean not null default false;
-- Los centros no pasaron por directorio-afiliados.sql: asegúrales `aprobada`.
alter table public.centros_adiccion add column if not exists aprobada  boolean not null default false;
-- Defensivo por si faltara (tablas base): marca de tiempo de alta.
alter table public.parroquias      add column if not exists created_at timestamptz default now();
alter table public.diocesis        add column if not exists created_at timestamptz default now();
alter table public.centros_adiccion add column if not exists created_at timestamptz default now();

-- ── LISTAR (parroquias + diócesis, con su situación) ────────────────────────
drop function if exists public.admin_afiliados_listar(text, text, text);
create or replace function public.admin_afiliados_listar(
  p_tipo   text default null,   -- 'parroquia' | 'diocesis' | null (ambas)
  p_estado text default null,   -- 'pendiente' | 'activa' | 'suspendida' | null (todas)
  p_q      text default null    -- texto libre: nombre/país/estado/registro_id/email
) returns table(
  id uuid, tipo text, nombre text, responsable text, contacto text, email text,
  telefono text, pais text, estado text, municipio text, direccion text,
  registro_id text, aprobada boolean, suspendida boolean, situacion text,
  creado timestamptz, tipo_org text
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  return query
  with base as (
    select p.id, 'parroquia'::text as tipo, p.nombre, p.nombre_pastor as responsable,
           p.nombre_contacto as contacto, p.email_contacto as email,
           concat_ws(' ', p.codigo_pais_tel, p.telefono) as telefono,
           p.pais, p.estado, p.municipio, p.direccion, p.registro_id,
           coalesce(p.aprobada,false) as aprobada, coalesce(p.suspendida,false) as suspendida,
           p.created_at as creado, null::text as tipo_org
      from public.parroquias p
    union all
    select d.id, 'diocesis'::text, d.nombre, d.nombre_obispo,
           d.nombre_contacto, d.email_contacto,
           concat_ws(' ', d.codigo_pais_tel, d.telefono),
           d.pais, d.estado, d.municipio, d.direccion, d.registro_id,
           coalesce(d.aprobada,false), coalesce(d.suspendida,false),
           d.created_at, null::text
      from public.diocesis d
    union all
    -- Centros de tratamiento de adicciones (sin clero; dirección = calle + número).
    select c.id, 'centro'::text, c.nombre, null::text,
           c.nombre_contacto, c.email_contacto,
           concat_ws(' ', c.codigo_pais_tel, c.telefono),
           c.pais, c.estado, c.municipio, nullif(concat_ws(' ', c.calle, c.numero),''), c.registro_id,
           coalesce(c.aprobada,false), coalesce(c.suspendida,false),
           c.created_at, null::text
      from public.centros_adiccion c
    union all
    -- Otras organizaciones/instituciones: el tipo lo señaló el interesado.
    select o.id, 'otro'::text, o.nombre, null::text,
           o.nombre_contacto, o.email_contacto,
           concat_ws(' ', o.codigo_pais_tel, o.telefono),
           o.pais, o.estado, o.municipio, o.direccion, o.registro_id,
           coalesce(o.aprobada,false), coalesce(o.suspendida,false),
           o.created_at, o.tipo_organizacion
      from public.organizaciones_otro o
  ), calc as (
    select b.*, case when b.suspendida then 'suspendida'
                     when b.aprobada  then 'activa'
                     else 'pendiente' end as situacion
      from base b
  )
  -- Casts explícitos (la columna real puede ser varchar; RETURNS TABLE exige coincidencia exacta).
  select c.id::uuid, c.tipo::text, c.nombre::text, c.responsable::text, c.contacto::text, c.email::text, c.telefono::text,
         c.pais::text, c.estado::text, c.municipio::text, c.direccion::text, c.registro_id::text,
         c.aprobada::boolean, c.suspendida::boolean, c.situacion::text, c.creado::timestamptz, c.tipo_org::text
    from calc c
   where (p_tipo   is null or p_tipo   = '' or c.tipo = p_tipo)
     and (p_estado is null or p_estado = '' or c.situacion = p_estado)
     and (p_q is null or p_q = '' or
          concat_ws(' ', c.nombre, c.pais, c.estado, c.municipio, c.registro_id, c.email, c.tipo_org)
            ilike '%'||p_q||'%')
   order by (c.situacion='pendiente') desc, c.creado desc nulls last, c.nombre;
end;
$$;
grant execute on function public.admin_afiliados_listar(text, text, text) to authenticated;

-- ── ACCIÓN: aprobar / suspender / borrar ────────────────────────────────────
-- 'aprobar'   -> aprobada=true,  suspendida=false  (alta o reactivación)
-- 'suspender' -> aprobada=false, suspendida=true   (oculta, se conserva)
-- 'borrar'    -> elimina la fila (baja definitiva)
drop function if exists public.admin_afiliado_estado(text, uuid, text);
create or replace function public.admin_afiliado_estado(
  p_tipo   text,
  p_id     uuid,
  p_accion text
) returns text
language plpgsql security definer set search_path = public
as $$
declare v_email text; v_nombre text;
begin
  if not public.es_admin() then raise exception 'no autorizado'; end if;
  if p_accion not in ('aprobar','suspender','borrar') then raise exception 'accion invalida'; end if;
  select a.email into v_email from public.admins a where a.user_id = auth.uid();

  if p_tipo = 'parroquia' then
    if p_accion = 'aprobar' then
      update public.parroquias set aprobada=true,  suspendida=false where id=p_id returning nombre into v_nombre;
    elsif p_accion = 'suspender' then
      update public.parroquias set aprobada=false, suspendida=true  where id=p_id returning nombre into v_nombre;
    else
      delete from public.parroquias where id=p_id returning nombre into v_nombre;
    end if;
  elsif p_tipo = 'diocesis' then
    if p_accion = 'aprobar' then
      update public.diocesis set aprobada=true,  suspendida=false where id=p_id returning nombre into v_nombre;
    elsif p_accion = 'suspender' then
      update public.diocesis set aprobada=false, suspendida=true  where id=p_id returning nombre into v_nombre;
    else
      delete from public.diocesis where id=p_id returning nombre into v_nombre;
    end if;
  elsif p_tipo = 'centro' then
    if p_accion = 'aprobar' then
      update public.centros_adiccion set aprobada=true,  suspendida=false where id=p_id returning nombre into v_nombre;
    elsif p_accion = 'suspender' then
      update public.centros_adiccion set aprobada=false, suspendida=true  where id=p_id returning nombre into v_nombre;
    else
      delete from public.centros_adiccion where id=p_id returning nombre into v_nombre;
    end if;
  elsif p_tipo = 'otro' then
    if p_accion = 'aprobar' then
      update public.organizaciones_otro set aprobada=true,  suspendida=false where id=p_id returning nombre into v_nombre;
    elsif p_accion = 'suspender' then
      update public.organizaciones_otro set aprobada=false, suspendida=true  where id=p_id returning nombre into v_nombre;
    else
      delete from public.organizaciones_otro where id=p_id returning nombre into v_nombre;
    end if;
  else
    raise exception 'tipo invalido';
  end if;

  if v_nombre is null then raise exception 'afiliado no encontrado'; end if;

  -- admin_log.detalle es jsonb.
  insert into public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
  values (auth.uid(), v_email, 'afiliado_'||p_accion, p_tipo, p_id::text, to_jsonb(v_nombre));

  return v_nombre;
end;
$$;
grant execute on function public.admin_afiliado_estado(text, uuid, text) to authenticated;
