-- scripts/schola.sql
-- Motor común de las "Scholas" (espacios de formación continua):
--   · 'catecumen' — formación permanente para CATEQUISTAS.
--   · 'fidei'     — formación continua para quienes YA recibieron un sacramento.
-- Un solo modelo de recursos parametrizado por `espacio`; el acceso se decide en
-- el servidor (SECURITY DEFINER sobre auth.uid()). Idempotente y re-ejecutable.

create table if not exists public.schola_recursos (
  id              bigint generated always as identity primary key,
  espacio         text not null check (espacio in ('catecumen','fidei')),
  categoria_orden int  not null default 0,
  categoria_es text, categoria_en text, categoria_fr text, categoria_de text, categoria_pt text, categoria_it text,
  titulo_es text, titulo_en text, titulo_fr text, titulo_de text, titulo_pt text, titulo_it text,
  descripcion_es text, descripcion_en text, descripcion_fr text, descripcion_de text, descripcion_pt text, descripcion_it text,
  tipo   text not null check (tipo in ('video','documento','enlace')),
  url    text not null,
  orden  int  not null default 0,
  activo boolean not null default true,
  creado timestamptz not null default now()
);
create index if not exists idx_schola_espacio on public.schola_recursos (espacio) where activo;

alter table public.schola_recursos enable row level security;
-- Sin políticas: solo la RPC de abajo (SECURITY DEFINER) lee. La gestión de
-- contenido se hace por SQL o desde el panel admin (pestaña futura).

-- ── Acceso + listado en una sola llamada ───────────────────────────────────
-- Devuelve { acceso: bool, recursos: [...] }. Acceso:
--   catecumen → tipo_usuario = 'catequista' (o admin)
--   fidei     → tiene al menos una constancia emitida (o admin)
create or replace function public.schola(p_espacio text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  acceso boolean := false;
  tu text;
begin
  if uid is null or p_espacio not in ('catecumen','fidei') then
    return json_build_object('acceso', false, 'recursos', '[]'::json);
  end if;

  if p_espacio = 'catecumen' then
    select tipo_usuario into tu from public.usuarios where id = uid;
    acceso := (tu = 'catequista') or public.es_admin();
  else -- 'fidei'
    acceso := exists (select 1 from public.constancias where usuario_id = uid) or public.es_admin();
  end if;

  if not acceso then
    return json_build_object('acceso', false, 'recursos', '[]'::json);
  end if;

  return json_build_object(
    'acceso', true,
    'recursos', coalesce((
      select json_agg(row_to_json(r))
      from (
        select id, categoria_orden,
               categoria_es, categoria_en, categoria_fr, categoria_de, categoria_pt, categoria_it,
               titulo_es, titulo_en, titulo_fr, titulo_de, titulo_pt, titulo_it,
               descripcion_es, descripcion_en, descripcion_fr, descripcion_de, descripcion_pt, descripcion_it,
               tipo, url, orden
          from public.schola_recursos
         where espacio = p_espacio and activo
         order by categoria_orden, orden
      ) r
    ), '[]'::json)
  );
end;
$$;

grant execute on function public.schola(text) to authenticated;

-- ── Ejemplo de recurso (borra o adapta) ────────────────────────────────────
-- insert into public.schola_recursos (espacio, categoria_orden, categoria_es, titulo_es, descripcion_es, tipo, url, orden)
-- values ('fidei', 1, 'Oración', 'Introducción a la Lectio Divina', 'Cómo orar con la Escritura.', 'video', 'https://iframe.mediadelivery.net/embed/.../...', 1);
