-- cupo-ajustes.sql — Configuración del cupo diario: el admin puede mostrar u
-- ocultar la opción de "solicitar cupo extra". Correr DESPUÉS de cupo-extra-temas.sql.
-- El ajuste `temas_limite_dia` gana el campo booleano `solicitud` (default true).
-- `puedo_abrir_tema` devuelve `solicitud_visible` para que el frontend muestre/oculte
-- el botón. Idempotente.

update public.ajustes
   set valor = valor || jsonb_build_object('solicitud', coalesce((valor->>'solicitud')::boolean, true))
 where clave = 'temas_limite_dia';

create or replace function public.puedo_abrir_tema(p_video_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_sac uuid; v_orden int; v_idioma text;
  v_lim int; v_tz text; v_today date; v_extra int; v_solic boolean;
  g_start int; g_first timestamptz; v_hoy int; v_this_today boolean; v_pend boolean;
begin
  if uid is null then return jsonb_build_object('permitido', true, 'sin_sesion', true); end if;
  select sacramento_id, orden, idioma into v_sac, v_orden, v_idioma from videos where id = p_video_id;
  if v_sac is null then return jsonb_build_object('permitido', true); end if;

  v_lim   := coalesce((select (valor->>'n')::int          from ajustes where clave = 'temas_limite_dia'), 2);
  v_tz    := coalesce((select (valor->>'tz')              from ajustes where clave = 'temas_limite_dia'), 'America/Mexico_City');
  v_solic := coalesce((select (valor->>'solicitud')::boolean from ajustes where clave = 'temas_limite_dia'), true);
  v_today := (now() at time zone v_tz)::date;
  v_extra := coalesce((select sum(extra) from solicitudes_cupo
                        where usuario_id = uid and fecha = v_today and estado = 'aprobada'), 0);
  v_lim := v_lim + v_extra;
  g_start := ((v_orden - 1) / 4) * 4 + 1;

  select min(a.primer_acceso) into g_first
    from accesos_video a join videos vv on vv.id = a.video_id
   where a.usuario_id = uid and vv.sacramento_id = v_sac and vv.idioma = v_idioma
     and vv.orden between g_start and g_start + 3;

  if g_first is not null and (g_first at time zone v_tz)::date < v_today then
    return jsonb_build_object('permitido', true, 'continuacion', true, 'limite', v_lim);
  end if;
  v_this_today := g_first is not null and (g_first at time zone v_tz)::date = v_today;

  select count(*) into v_hoy from (
    select vv.sacramento_id, ((vv.orden - 1) / 4) as grupo
      from accesos_video a join videos vv on vv.id = a.video_id
     where a.usuario_id = uid
     group by vv.sacramento_id, ((vv.orden - 1) / 4)
    having (min(a.primer_acceso) at time zone v_tz)::date = v_today
  ) t;

  select exists(select 1 from solicitudes_cupo
                 where usuario_id = uid and fecha = v_today and estado = 'pendiente') into v_pend;

  if v_this_today then
    return jsonb_build_object('permitido', true, 'temas_hoy', v_hoy, 'limite', v_lim);
  elsif v_hoy < v_lim then
    return jsonb_build_object('permitido', true, 'temas_hoy', v_hoy, 'limite', v_lim, 'nuevo', true);
  else
    return jsonb_build_object('permitido', false, 'motivo', 'limite_temas_dia',
                              'temas_hoy', v_hoy, 'limite', v_lim,
                              'solicitud_pendiente', v_pend, 'solicitud_visible', v_solic);
  end if;
end $$;
grant execute on function public.puedo_abrir_tema(uuid) to authenticated;
