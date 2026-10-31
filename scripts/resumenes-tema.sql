-- resumenes-tema.sql
-- ─────────────────────────────────────────────────────────────────────────────
-- Resúmenes por TEMA, editables desde el panel (sin recompilar). El frontend los
-- carga al arrancar y, si existe uno en BD para un tema, prevalece sobre el que
-- venga en course.js (fallback). Clave = código del tema (p. ej. 'KER-01','TC1-01').
-- Estructura de `resumen`: { "es":[{ "tipo":"doctrina|practica", "texto":"..." }], ... }
-- Idempotente.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.resumenes_tema (
  tema          text primary key,          -- código del tema (mod)
  resumen       jsonb,                      -- { es:[{tipo,texto}], en:[...] }
  hoja_pdf_url  text,
  activo        boolean not null default true,
  actualizado   timestamptz not null default now()
);
alter table public.resumenes_tema enable row level security;  -- sin políticas: solo por RPC

-- ── Público: resúmenes activos (map tema -> {resumen, hoja_pdf_url}) ─────────
create or replace function public.obtener_resumenes()
returns jsonb language sql security definer set search_path = public stable as $$
  select coalesce(
    jsonb_object_agg(tema, jsonb_build_object('resumen', resumen, 'hoja_pdf_url', hoja_pdf_url)),
    '{}'::jsonb)
  from public.resumenes_tema where activo;
$$;
grant execute on function public.obtener_resumenes() to anon, authenticated;

-- ── Admin: CRUD ─────────────────────────────────────────────────────────────
create or replace function public.admin_resumenes_listar()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  return (select coalesce(jsonb_agg(to_jsonb(r) order by r.tema), '[]'::jsonb) from public.resumenes_tema r);
end $$;
grant execute on function public.admin_resumenes_listar() to authenticated;

create or replace function public.admin_resumen_guardar(p_tema text, p_resumen jsonb,
  p_hoja text default null, p_activo boolean default true)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  if p_tema is null or p_tema = '' then raise exception 'tema requerido'; end if;
  insert into public.resumenes_tema (tema, resumen, hoja_pdf_url, activo, actualizado)
    values (p_tema, p_resumen, nullif(p_hoja,''), coalesce(p_activo,true), now())
  on conflict (tema) do update
    set resumen = excluded.resumen, hoja_pdf_url = excluded.hoja_pdf_url,
        activo = excluded.activo, actualizado = now();
  begin
    insert into public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              'resumen.guardado', 'resumenes_tema', p_tema, jsonb_build_object('tema', p_tema));
  exception when others then null; end;
end $$;
grant execute on function public.admin_resumen_guardar(text, jsonb, text, boolean) to authenticated;

create or replace function public.admin_resumen_borrar(p_tema text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not es_admin() then raise exception 'no autorizado'; end if;
  delete from public.resumenes_tema where tema = p_tema;
  begin
    insert into public.admin_log (admin_id, admin_email, accion, entidad, entidad_id, detalle)
      values (auth.uid(), (select email from auth.users where id = auth.uid()),
              'resumen.borrado', 'resumenes_tema', p_tema, jsonb_build_object('tema', p_tema));
  exception when others then null; end;
end $$;
grant execute on function public.admin_resumen_borrar(text) to authenticated;
